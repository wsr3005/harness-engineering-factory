import { z } from 'zod';

import type { TasksConfig } from '../config/index.js';
import type { TelemetryProvider } from '../providers/index.js';
import { NoopTelemetryProvider } from '../providers/index.js';
import type { FindAllFilter, TaskRepository } from '../repo/index.js';
import {
  CreateTaskSchema,
  TaskStatusSchema,
  UpdateTaskSchema,
  type CreateTaskInput,
  type Task,
  type TaskStatus,
} from '../types/index.js';

/**
 * Allowed status transitions per product spec (tasks-domain.md).
 *
 * - todo -> in_progress
 * - in_progress -> done
 * - in_progress -> todo
 * - done -> in_progress (reopen)
 *
 * Disallowed:
 * - todo -> done (must move through in_progress)
 * - done -> todo (must reopen to in_progress first)
 *
 * Same-status transitions are treated as idempotent no-ops.
 */
const ALLOWED_TRANSITIONS: Record<TaskStatus, ReadonlySet<TaskStatus>> = {
  todo: new Set<TaskStatus>(['in_progress']),
  in_progress: new Set<TaskStatus>(['todo', 'done']),
  done: new Set<TaskStatus>(['in_progress']),
};

const IdSchema = z.string().uuid();

export class TaskNotFoundError extends Error {
  constructor(id: string) {
    super(`Task not found: ${id}`);
    this.name = 'TaskNotFoundError';
  }
}

export class InvalidTaskTransitionError extends Error {
  constructor(from: TaskStatus, to: TaskStatus) {
    super(`Invalid transition from ${from} to ${to}`);
    this.name = 'InvalidTaskTransitionError';
  }
}

export interface TaskServiceDeps {
  repo: TaskRepository;
  config: TasksConfig;
  telemetry?: TelemetryProvider;
}

export class TaskService {
  private readonly repo: TaskRepository;
  private readonly config: TasksConfig;
  private readonly telemetry: TelemetryProvider;

  constructor(deps: TaskServiceDeps) {
    this.repo = deps.repo;
    this.config = deps.config;
    this.telemetry = deps.telemetry ?? new NoopTelemetryProvider();
  }

  createTask(input: CreateTaskInput): Task {
    const parsed = CreateTaskSchema.parse({
      ...input,
      title: input.title.trim(),
      description: input.description.trim(),
      status: input.status,
    });

    if (parsed.title.length > this.config.maxTitleLength) {
      throw new Error(`Title exceeds ${this.config.maxTitleLength} characters`);
    }
    if (parsed.description.length > this.config.maxDescriptionLength) {
      throw new Error(`Description exceeds ${this.config.maxDescriptionLength} characters`);
    }

    const task = this.repo.create(parsed);
    this.telemetry.record('task.created', { taskId: task.id, status: task.status });
    return task;
  }

  getTask(id: string): Task {
    const taskId = IdSchema.parse(id);
    const task = this.repo.findById(taskId);
    if (!task) {
      throw new TaskNotFoundError(taskId);
    }
    return task;
  }

  listTasks(filter?: FindAllFilter): Task[] {
    return this.repo.findAll(filter);
  }

  updateTaskStatus(id: string, status: TaskStatus): Task {
    const taskId = IdSchema.parse(id);
    const nextStatus = TaskStatusSchema.parse(status);
    const existing = this.getTask(taskId);

    if (existing.status === nextStatus) {
      return existing;
    }

    if (!ALLOWED_TRANSITIONS[existing.status].has(nextStatus)) {
      throw new InvalidTaskTransitionError(existing.status, nextStatus);
    }

    const updated = this.repo.update(taskId, UpdateTaskSchema.parse({ status: nextStatus }));
    if (!updated) {
      throw new TaskNotFoundError(taskId);
    }

    this.telemetry.record('task.status.updated', {
      taskId: updated.id,
      from: existing.status,
      to: updated.status,
    });
    return updated;
  }

  deleteTask(id: string): void {
    const taskId = IdSchema.parse(id);
    const deleted = this.repo.delete(taskId);
    if (!deleted) {
      throw new TaskNotFoundError(taskId);
    }
    this.telemetry.record('task.deleted', { taskId });
  }
}
