import { z } from 'zod';

import { TaskStatusSchema } from '../types/index.js';

const TasksConfigSchema = z.object({
  maxTitleLength: z.number().int().positive().default(200),
  maxDescriptionLength: z.number().int().positive().default(2000),
  defaultStatus: TaskStatusSchema.default('todo'),
  pageSize: z.number().int().positive().default(20),
});

export type TasksConfig = z.infer<typeof TasksConfigSchema>;

export const createTasksConfig = (input?: Partial<TasksConfig>): TasksConfig =>
  TasksConfigSchema.parse(input ?? {});
