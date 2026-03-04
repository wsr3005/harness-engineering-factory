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
  it('creates task through handler', () => {
    const runtime = createTasksRuntime();
    const result = handleCreateTask(runtime.service, {
      title: 'Handler create',
      description: 'B',
      status: 'todo',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.id).toBeTruthy();
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

  it('updates task status and blocks invalid transition', () => {
    const runtime = createTasksRuntime();
    const created = handleCreateTask(runtime.service, {
      title: 'Handler update',
      description: 'B',
      status: 'done',
    });

    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }

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
      status: 'todo',
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
