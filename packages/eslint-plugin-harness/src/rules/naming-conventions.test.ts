import { RuleTester } from '@typescript-eslint/rule-tester';
import tsParser from '@typescript-eslint/parser';
import { afterAll, describe, it } from 'vitest';

import rule from './naming-conventions.js';

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

tester.run('naming-conventions', rule, {
  valid: [
    {
      code: "import { z } from 'zod'; const TaskSchema = z.object({ id: z.string() });",
      filename: 'E:/Project/harness/apps/example/src/domains/tasks/types/task.schema.ts',
    },
    {
      code: 'export interface TaskRecord { id: string }',
      filename: 'E:/Project/harness/apps/example/src/domains/tasks/types/task.schema.ts',
    },
    {
      code: 'export type TaskStatus = \"todo\" | \"done\";',
      filename: 'E:/Project/harness/apps/example/src/domains/tasks/types/task.schema.ts',
    },
    {
      code: 'export const x = 1;',
      filename: 'E:/Project/harness/apps/example/src/domains/tasks/config/tasks.config.ts',
    },
    {
      code: "describe('x', () => {});",
      filename: 'E:/Project/harness/apps/example/src/domains/tasks/service/tasks.service.test.ts',
    },
  ],
  invalid: [
    {
      code: "import { z } from 'zod'; const Task = z.object({ id: z.string() });",
      filename: 'E:/Project/harness/apps/example/src/domains/tasks/types/task.schema.ts',
      errors: [{ messageId: 'schemaName' }],
    },
    {
      code: 'export interface taskRecord { id: string }',
      filename: 'E:/Project/harness/apps/example/src/domains/tasks/types/task.schema.ts',
      errors: [{ messageId: 'typeName' }],
    },
    {
      code: 'export type task_status = \"todo\" | \"done\";',
      filename: 'E:/Project/harness/apps/example/src/domains/tasks/types/task.schema.ts',
      errors: [{ messageId: 'typeName' }],
    },
    {
      code: 'export const x = 1;',
      filename: 'E:/Project/harness/apps/example/src/domains/tasks/config/tasks.ts',
      errors: [{ messageId: 'configName' }],
    },
    {
      code: "describe('x', () => {});",
      filename: 'E:/Project/harness/apps/example/src/domains/tasks/service/tasks.service.ts',
      errors: [{ messageId: 'testName' }],
    },
    {
      code: 'export const x = 1;',
      filename: 'E:/Project/harness/apps/example/src/domains/tasks/service/tasks.service.spec.ts',
      errors: [{ messageId: 'testName' }],
    },
  ],
});
