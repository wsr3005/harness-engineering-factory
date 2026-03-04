import { z } from 'zod';

import { TaskStatusSchema } from '../types/index.js';
import {
  InvalidTaskTransitionError,
  TaskNotFoundError,
  type TaskService,
} from '../service/index.js';

type HandlerErrorCode = 'VALIDATION_ERROR' | 'NOT_FOUND' | 'INVALID_TRANSITION' | 'UNKNOWN';

type HandlerResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: HandlerErrorCode; message: string } };

const IdInputSchema = z.object({
  id: z.string().uuid(),
});

const ListInputSchema = z
  .object({
    status: TaskStatusSchema.optional(),
    page: z.number().int().min(1).optional(),
    pageSize: z.number().int().min(1).optional(),
  })
  .default({});

const CreateInputSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000),
  status: TaskStatusSchema,
});

const UpdateStatusInputSchema = z.object({
  id: z.string().uuid(),
  status: TaskStatusSchema,
});

const mapError = (error: unknown): { code: HandlerErrorCode; message: string } => {
  if (error instanceof z.ZodError) {
    return { code: 'VALIDATION_ERROR', message: error.message };
  }
  if (error instanceof TaskNotFoundError) {
    return { code: 'NOT_FOUND', message: error.message };
  }
  if (error instanceof InvalidTaskTransitionError) {
    return { code: 'INVALID_TRANSITION', message: error.message };
  }
  return {
    code: 'UNKNOWN',
    message: error instanceof Error ? error.message : 'Unknown error',
  };
};

const safeHandle = <T>(run: () => T): HandlerResponse<T> => {
  try {
    return { ok: true, data: run() };
  } catch (error) {
    return { ok: false, error: mapError(error) };
  }
};

export const handleCreateTask = (service: TaskService, input: unknown) =>
  safeHandle(() => service.createTask(CreateInputSchema.parse(input)));

export const handleGetTask = (service: TaskService, input: unknown) =>
  safeHandle(() => {
    const payload = IdInputSchema.parse(input);
    return service.getTask(payload.id);
  });

export const handleListTasks = (service: TaskService, input: unknown) =>
  safeHandle(() => service.listTasks(ListInputSchema.parse(input)));

export const handleUpdateTask = (service: TaskService, input: unknown) =>
  safeHandle(() => {
    const payload = UpdateStatusInputSchema.parse(input);
    return service.updateTaskStatus(payload.id, payload.status);
  });

export const handleDeleteTask = (service: TaskService, input: unknown) =>
  safeHandle(() => {
    const payload = IdInputSchema.parse(input);
    service.deleteTask(payload.id);
    return { deleted: true };
  });
