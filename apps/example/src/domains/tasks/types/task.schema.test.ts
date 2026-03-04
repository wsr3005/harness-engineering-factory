import { describe, expect, it } from 'vitest';

import { CreateTaskSchema, TaskSchema, TaskStatusSchema } from './index.js';

describe('task schemas', () => {
  it('parses a valid task payload', () => {
    const parsed = TaskSchema.parse({
      id: 'af594f79-e45e-4320-bd8d-e780bb5aaf2e',
      title: 'Ship architecture',
      description: 'Implement layered domain',
      status: 'todo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    expect(parsed.id).toBe('af594f79-e45e-4320-bd8d-e780bb5aaf2e');
    expect(parsed.createdAt).toBeInstanceOf(Date);
  });

  it('rejects invalid uuid values', () => {
    expect(() =>
      TaskSchema.parse({
        id: 'not-a-uuid',
        title: 'x',
        description: 'y',
        status: 'todo',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ).toThrow();
  });

  it('rejects empty title values', () => {
    expect(() =>
      TaskSchema.parse({
        id: 'af594f79-e45e-4320-bd8d-e780bb5aaf2e',
        title: '',
        description: 'y',
        status: 'todo',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ).toThrow();
  });

  it('validates allowed task statuses', () => {
    expect(TaskStatusSchema.parse('todo')).toBe('todo');
    expect(TaskStatusSchema.parse('in_progress')).toBe('in_progress');
    expect(TaskStatusSchema.parse('done')).toBe('done');
  });

  it('rejects unknown statuses', () => {
    expect(() => TaskStatusSchema.parse('blocked')).toThrow();
  });

  it('create schema omits id and timestamps', () => {
    const parsed = CreateTaskSchema.parse({
      title: 'Draft docs',
      description: 'Draft domain docs',
      status: 'todo',
    });

    expect(parsed).not.toHaveProperty('id');
    expect(parsed).not.toHaveProperty('createdAt');
    expect(parsed).not.toHaveProperty('updatedAt');
  });

  it('create schema rejects id field if provided', () => {
    const payload = {
      id: 'af594f79-e45e-4320-bd8d-e780bb5aaf2e',
      title: 'Draft docs',
      description: 'Draft domain docs',
      status: 'todo',
    };
    expect(() => CreateTaskSchema.strict().parse(payload)).toThrow();
  });
});
