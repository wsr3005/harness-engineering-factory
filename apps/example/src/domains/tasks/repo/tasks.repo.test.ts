import { describe, expect, it } from 'vitest';

import { InMemoryTaskRepository } from './index.js';

describe('InMemoryTaskRepository', () => {
  it('creates and fetches a task by id', () => {
    const repo = new InMemoryTaskRepository();
    const created = repo.create({ title: 'A', description: 'B', status: 'todo' });

    const found = repo.findById(created.id);
    expect(found?.id).toBe(created.id);
  });

  it('returns undefined for missing id', () => {
    const repo = new InMemoryTaskRepository();
    expect(repo.findById('f5ad3808-06d8-4fe8-87aa-3ef0d22a8ce8')).toBeUndefined();
  });

  it('updates an existing task', () => {
    const repo = new InMemoryTaskRepository();
    const created = repo.create({ title: 'Before', description: 'B', status: 'todo' });

    const updated = repo.update(created.id, { title: 'After' });
    expect(updated?.title).toBe('After');
  });

  it('returns undefined when updating missing task', () => {
    const repo = new InMemoryTaskRepository();
    const updated = repo.update('f5ad3808-06d8-4fe8-87aa-3ef0d22a8ce8', { title: 'x' });

    expect(updated).toBeUndefined();
  });

  it('deletes existing task and returns true', () => {
    const repo = new InMemoryTaskRepository();
    const created = repo.create({ title: 'Delete me', description: 'B', status: 'todo' });

    expect(repo.delete(created.id)).toBe(true);
    expect(repo.findById(created.id)).toBeUndefined();
  });

  it('returns false when deleting missing task', () => {
    const repo = new InMemoryTaskRepository();
    expect(repo.delete('f5ad3808-06d8-4fe8-87aa-3ef0d22a8ce8')).toBe(false);
  });

  it('filters list by status', () => {
    const repo = new InMemoryTaskRepository();
    repo.create({ title: 'Todo', description: 'B', status: 'todo' });
    repo.create({ title: 'Done', description: 'B', status: 'done' });

    const doneOnly = repo.findAll({ status: 'done' });
    expect(doneOnly).toHaveLength(1);
    expect(doneOnly[0]?.status).toBe('done');
  });

  it('applies pagination defaults from config', () => {
    const repo = new InMemoryTaskRepository({ pageSize: 2 });
    repo.create({ title: '1', description: 'B', status: 'todo' });
    repo.create({ title: '2', description: 'B', status: 'todo' });
    repo.create({ title: '3', description: 'B', status: 'todo' });

    const firstPage = repo.findAll();
    const secondPage = repo.findAll({ page: 2 });

    expect(firstPage).toHaveLength(2);
    expect(secondPage).toHaveLength(1);
  });

  it('accepts configured status values at create time', () => {
    const repo = new InMemoryTaskRepository({ defaultStatus: 'in_progress' });
    const created = repo.create({
      title: 'Configured status',
      description: 'B',
      status: 'in_progress',
    });

    expect(created.status).toBe('in_progress');
  });
});
