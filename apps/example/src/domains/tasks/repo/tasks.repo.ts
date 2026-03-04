import { randomUUID } from 'node:crypto';
import { z } from 'zod';

import type { TasksConfig } from '../config/index.js';
import { createTasksConfig } from '../config/index.js';
import {
  CreateTaskSchema,
  TaskSchema,
  TaskStatusSchema,
  UpdateTaskSchema,
  type CreateTask,
  type Task,
  type TaskStatus,
  type UpdateTask,
} from '../types/index.js';

const FindByIdSchema = z.string().uuid();

const FindAllFilterSchema = z
  .object({
    status: TaskStatusSchema.optional(),
    page: z.number().int().min(1).optional(),
    pageSize: z.number().int().min(1).optional(),
  })
  .default({});

export type FindAllFilter = z.infer<typeof FindAllFilterSchema>;

export interface TaskRepository {
  create(input: CreateTask): Task;
  findById(id: string): Task | undefined;
  findAll(filter?: FindAllFilter): Task[];
  update(id: string, input: UpdateTask): Task | undefined;
  delete(id: string): boolean;
}

export class InMemoryTaskRepository implements TaskRepository {
  private readonly tasks = new Map<string, Task>();
  private readonly config: TasksConfig;

  constructor(config?: Partial<TasksConfig>) {
    this.config = createTasksConfig(config);
  }

  create(input: CreateTask): Task {
    const parsedInput = CreateTaskSchema.parse(input);
    const now = new Date();
    const task = TaskSchema.parse({
      id: randomUUID(),
      title: parsedInput.title,
      description: parsedInput.description,
      status: parsedInput.status,
      createdAt: now,
      updatedAt: now,
    });

    this.tasks.set(task.id, task);
    return task;
  }

  findById(id: string): Task | undefined {
    const taskId = FindByIdSchema.parse(id);
    const task = this.tasks.get(taskId);
    return task ? TaskSchema.parse(task) : undefined;
  }

  findAll(filter?: FindAllFilter): Task[] {
    const parsedFilter = FindAllFilterSchema.parse(filter ?? {});
    const page = parsedFilter.page ?? 1;
    const pageSize = parsedFilter.pageSize ?? this.config.pageSize;

    const tasks = [...this.tasks.values()]
      .filter((task) => (parsedFilter.status ? task.status === parsedFilter.status : true))
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());

    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return tasks.slice(start, end).map((task) => TaskSchema.parse(task));
  }

  update(id: string, input: UpdateTask): Task | undefined {
    const taskId = FindByIdSchema.parse(id);
    const parsedUpdate = UpdateTaskSchema.parse(input);
    const existing = this.tasks.get(taskId);
    if (!existing) {
      return undefined;
    }

    const updated = TaskSchema.parse({
      ...existing,
      ...parsedUpdate,
      updatedAt: new Date(),
    });

    this.tasks.set(taskId, updated);
    return updated;
  }

  delete(id: string): boolean {
    const taskId = FindByIdSchema.parse(id);
    return this.tasks.delete(taskId);
  }
}

export const isTerminalStatus = (status: TaskStatus): boolean => status === 'done';
