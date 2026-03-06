import { describe, expect, it } from 'vitest';

import { createTasksRuntime } from '../runtime/index.js';
import {
  handleCreateTask,
  handleDeleteTask,
  handleGetTask,
  handleListTasks,
  handleUpdateTask,
} from './index.js';

describe('task handlers', () => {
  it('creates task with default status todo when status omitted', () => {
    const runtime = createTasksRuntime();
    const result = handleCreateTask(runtime.service, {
      title: 'Handler create',
      description: 'B',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.id).toBeTruthy();
      expect(result.data.status).toBe('todo');
    }
  });

  it('creates task with explicit status', () => {
    const runtime = createTasksRuntime();
    const result = handleCreateTask(runtime.service, {
      title: 'Handler create explicit',
      description: 'B',
      status: 'in_progress',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.status).toBe('in_progress');
    }
  });

  it('returns validation error for invalid create payload', () => {
    const runtime = createTasksRuntime();
    const result = handleCreateTask(runtime.service, {
      title: '',
      description: 'B',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('gets and lists tasks through handlers', () => {
    const runtime = createTasksRuntime();
    const created = handleCreateTask(runtime.service, {
      title: 'Handler list',
      description: 'B',
      status: 'in_progress',
    });

    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }

    const getResult = handleGetTask(runtime.service, { id: created.data.id });
    const listResult = handleListTasks(runtime.service, { status: 'in_progress' });

    expect(getResult.ok).toBe(true);
    expect(listResult.ok).toBe(true);
    if (listResult.ok) {
      expect(listResult.data).toHaveLength(1);
    }
  });

  it('updates task status through valid transition', () => {
    const runtime = createTasksRuntime();
    const created = handleCreateTask(runtime.service, {
      title: 'Handler update',
      description: 'B',
    });

    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }

    const updated = handleUpdateTask(runtime.service, {
      id: created.data.id,
      status: 'in_progress',
    });

    expect(updated.ok).toBe(true);
    if (updated.ok) {
      expect(updated.data.status).toBe('in_progress');
    }
  });

  it('blocks todo -> done transition (must go through in_progress)', () => {
    const runtime = createTasksRuntime();
    const created = handleCreateTask(runtime.service, {
      title: 'Handler invalid',
      description: 'B',
    });

    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }

    const invalid = handleUpdateTask(runtime.service, {
      id: created.data.id,
      status: 'done',
    });

    expect(invalid.ok).toBe(false);
    if (!invalid.ok) {
      expect(invalid.error.code).toBe('INVALID_TRANSITION');
    }
  });

  it('blocks done -> todo transition (must reopen to in_progress)', () => {
    const runtime = createTasksRuntime();
    const created = handleCreateTask(runtime.service, {
      title: 'Handler reopen',
      description: 'B',
      status: 'in_progress',
    });

    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }

    handleUpdateTask(runtime.service, { id: created.data.id, status: 'done' });

    const invalid = handleUpdateTask(runtime.service, {
      id: created.data.id,
      status: 'todo',
    });

    expect(invalid.ok).toBe(false);
    if (!invalid.ok) {
      expect(invalid.error.code).toBe('INVALID_TRANSITION');
    }
  });

  it('deletes tasks through handler', () => {
    const runtime = createTasksRuntime();
    const created = handleCreateTask(runtime.service, {
      title: 'Handler delete',
      description: 'B',
    });

    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }

    const deleted = handleDeleteTask(runtime.service, { id: created.data.id });
    const missing = handleGetTask(runtime.service, { id: created.data.id });

    expect(deleted.ok).toBe(true);
    expect(missing.ok).toBe(false);
    if (!missing.ok) {
      expect(missing.error.code).toBe('NOT_FOUND');
    }
  });

  it('returns not found when deleting absent task', () => {
    const runtime = createTasksRuntime();
    const result = handleDeleteTask(runtime.service, {
      id: 'c27e76b8-4d73-4f41-812f-4506736f8ea5',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });
});
