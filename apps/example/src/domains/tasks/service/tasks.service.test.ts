import { describe, expect, it, vi } from 'vitest';

import { createTasksConfig } from '../config/index.js';
import type { TaskRepository } from '../repo/index.js';
import { InMemoryTaskRepository } from '../repo/index.js';
import { TaskService, TaskNotFoundError, InvalidTaskTransitionError } from './index.js';

const config = createTasksConfig();

describe('TaskService', () => {
  it('creates task with defaults and trimmed fields', () => {
    const service = new TaskService({
      repo: new InMemoryTaskRepository(),
      config,
    });

    const created = service.createTask({
      title: '  Build feature  ',
      description: '  details  ',
    });

    expect(created.title).toBe('Build feature');
    expect(created.description).toBe('details');
    expect(created.status).toBe('todo');
  });

  it('creates task with explicit status', () => {
    const service = new TaskService({
      repo: new InMemoryTaskRepository(),
      config,
    });

    const created = service.createTask({
      title: 'In progress task',
      description: 'already started',
      status: 'in_progress',
    });

    expect(created.status).toBe('in_progress');
  });

  it('gets existing task', () => {
    const repo = new InMemoryTaskRepository();
    const created = repo.create({ title: 'A', description: 'B' });
    const service = new TaskService({ repo, config });

    expect(service.getTask(created.id).id).toBe(created.id);
  });

  it('throws not found for missing task', () => {
    const service = new TaskService({ repo: new InMemoryTaskRepository(), config });
    expect(() => service.getTask('61f205ac-e8b9-4528-933e-8f1f458467ac')).toThrow(
      TaskNotFoundError,
    );
  });

  it('lists tasks from repository', () => {
    const repo = new InMemoryTaskRepository();
    repo.create({ title: 'A', description: 'B' });
    repo.create({ title: 'C', description: 'D', status: 'in_progress' });
    const service = new TaskService({ repo, config });

    expect(service.listTasks()).toHaveLength(2);
    expect(service.listTasks({ status: 'in_progress' })).toHaveLength(1);
  });

  it('allows todo -> in_progress', () => {
    const repo = new InMemoryTaskRepository();
    const created = repo.create({ title: 'A', description: 'B' });
    const service = new TaskService({ repo, config });

    const updated = service.updateTaskStatus(created.id, 'in_progress');
    expect(updated.status).toBe('in_progress');
  });

  it('allows in_progress -> done', () => {
    const repo = new InMemoryTaskRepository();
    const created = repo.create({ title: 'A', description: 'B', status: 'in_progress' });
    const service = new TaskService({ repo, config });

    const updated = service.updateTaskStatus(created.id, 'done');
    expect(updated.status).toBe('done');
  });

  it('allows in_progress -> todo', () => {
    const repo = new InMemoryTaskRepository();
    const created = repo.create({ title: 'A', description: 'B', status: 'in_progress' });
    const service = new TaskService({ repo, config });

    const updated = service.updateTaskStatus(created.id, 'todo');
    expect(updated.status).toBe('todo');
  });

  it('allows done -> in_progress (reopen)', () => {
    const repo = new InMemoryTaskRepository();
    const created = repo.create({ title: 'A', description: 'B', status: 'in_progress' });
    const service = new TaskService({ repo, config });

    service.updateTaskStatus(created.id, 'done');
    const reopened = service.updateTaskStatus(created.id, 'in_progress');
    expect(reopened.status).toBe('in_progress');
  });

  it('throws on todo -> done (must go through in_progress)', () => {
    const repo = new InMemoryTaskRepository();
    const created = repo.create({ title: 'A', description: 'B' });
    const service = new TaskService({ repo, config });

    expect(() => service.updateTaskStatus(created.id, 'done')).toThrow(InvalidTaskTransitionError);
  });

  it('throws on done -> todo (must reopen to in_progress first)', () => {
    const repo = new InMemoryTaskRepository();
    const created = repo.create({ title: 'A', description: 'B', status: 'in_progress' });
    const service = new TaskService({ repo, config });

    service.updateTaskStatus(created.id, 'done');
    expect(() => service.updateTaskStatus(created.id, 'todo')).toThrow(InvalidTaskTransitionError);
  });

  it('treats same-status transition as idempotent no-op', () => {
    const repo = new InMemoryTaskRepository();
    const created = repo.create({ title: 'A', description: 'B' });
    const service = new TaskService({ repo, config });

    const result = service.updateTaskStatus(created.id, 'todo');
    expect(result.id).toBe(created.id);
    expect(result.status).toBe('todo');
  });

  it('deletes existing task', () => {
    const repo = new InMemoryTaskRepository();
    const created = repo.create({ title: 'A', description: 'B' });
    const service = new TaskService({ repo, config });

    service.deleteTask(created.id);
    expect(() => service.getTask(created.id)).toThrow(TaskNotFoundError);
  });

  it('throws deleting missing task', () => {
    const service = new TaskService({ repo: new InMemoryTaskRepository(), config });
    expect(() => service.deleteTask('61f205ac-e8b9-4528-933e-8f1f458467ac')).toThrow(
      TaskNotFoundError,
    );
  });

  it('records telemetry events for create, update and delete', () => {
    const telemetry = { record: vi.fn() };
    const service = new TaskService({
      repo: new InMemoryTaskRepository(),
      config,
      telemetry,
    });

    const created = service.createTask({ title: 'A', description: 'B' });
    service.updateTaskStatus(created.id, 'in_progress');
    service.deleteTask(created.id);

    expect(telemetry.record).toHaveBeenCalledTimes(3);
  });

  it('works with a mocked repository implementation', () => {
    const task = {
      id: '2d74ba6f-43ee-4b85-8d51-0ce83db5f7cc',
      title: 'mock',
      description: 'mock',
      status: 'todo' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockRepo: TaskRepository = {
      create: vi.fn(() => task),
      findById: vi.fn(() => task),
      findAll: vi.fn(() => [task]),
      update: vi.fn((_id, input) => ({ ...task, ...input, updatedAt: new Date() })),
      delete: vi.fn(() => true),
    };

    const service = new TaskService({ repo: mockRepo, config });
    expect(service.listTasks()).toHaveLength(1);
    const updated = service.updateTaskStatus(task.id, 'in_progress');
    expect(updated.status).toBe('in_progress');
  });
});
