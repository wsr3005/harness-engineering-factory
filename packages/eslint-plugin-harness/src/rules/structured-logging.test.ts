import { RuleTester } from '@typescript-eslint/rule-tester';
import tsParser from '@typescript-eslint/parser';
import { afterAll, describe, it } from 'vitest';

import rule from './structured-logging.js';

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

tester.run('structured-logging', rule, {
  valid: [
    {
      code: "logger.error('x', { domain: 'tasks' });",
      filename: 'E:/Project/harness/apps/example/src/domains/tasks/service/tasks.service.ts',
    },
    {
      code: "console.error('ok in scripts');",
      filename: 'E:/Project/harness/scripts/validate-architecture.ts',
    },
    {
      code: "console.log('ok outside domains');",
      filename: 'E:/Project/harness/packages/quality/src/index.ts',
    },
    {
      code: 'console.table(tasks);',
      filename: 'E:/Project/harness/apps/example/src/domains/tasks/ui/tasks.handler.ts',
    },
  ],
  invalid: [
    {
      code: "console.log('x');",
      filename: 'E:/Project/harness/apps/example/src/domains/tasks/service/tasks.service.ts',
      errors: [{ messageId: 'violation' }],
    },
    {
      code: "console['warn']('x');",
      filename: 'E:/Project/harness/apps/example/src/domains/tasks/repo/tasks.repo.ts',
      errors: [{ messageId: 'violation' }],
    },
    {
      code: "console?.error('x');",
      filename: 'E:/Project/harness/apps/example/src/domains/tasks/runtime/tasks.runtime.ts',
      errors: [{ messageId: 'violation' }],
    },
  ],
});
