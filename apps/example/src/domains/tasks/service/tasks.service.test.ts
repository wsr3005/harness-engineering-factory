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
      status: 'todo',
    });

    expect(created.title).toBe('Build feature');
    expect(created.description).toBe('details');
    expect(created.status).toBe('todo');
  });

  it('gets existing task', () => {
    const repo = new InMemoryTaskRepository();
    const created = repo.create({ title: 'A', description: 'B', status: 'todo' });
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
    repo.create({ title: 'A', description: 'B', status: 'todo' });
    repo.create({ title: 'C', description: 'D', status: 'done' });
    const service = new TaskService({ repo, config });

    expect(service.listTasks()).toHaveLength(2);
    expect(service.listTasks({ status: 'done' })).toHaveLength(1);
  });

  it('updates status with valid transitions', () => {
    const repo = new InMemoryTaskRepository();
    const created = repo.create({ title: 'A', description: 'B', status: 'todo' });
    const service = new TaskService({ repo, config });

    const updated = service.updateTaskStatus(created.id, 'in_progress');
    expect(updated.status).toBe('in_progress');
  });

  it('throws on done to todo transition', () => {
    const repo = new InMemoryTaskRepository();
    const created = repo.create({ title: 'A', description: 'B', status: 'done' });
    const service = new TaskService({ repo, config });

    expect(() => service.updateTaskStatus(created.id, 'todo')).toThrow(InvalidTaskTransitionError);
  });

  it('deletes existing task', () => {
    const repo = new InMemoryTaskRepository();
    const created = repo.create({ title: 'A', description: 'B', status: 'todo' });
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

    const created = service.createTask({ title: 'A', description: 'B', status: 'todo' });
    service.updateTaskStatus(created.id, 'done');
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
    expect(service.updateTaskStatus(task.id, 'done').status).toBe('done');
  });
});
