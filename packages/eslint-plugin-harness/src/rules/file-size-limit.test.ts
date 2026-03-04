import { RuleTester } from '@typescript-eslint/rule-tester';
import tsParser from '@typescript-eslint/parser';
import { afterAll, describe, it } from 'vitest';

import rule from './file-size-limit.js';

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

const lines = (count: number): string =>
  Array.from({ length: count }, () => 'const x = 1;').join('\n');

tester.run('file-size-limit', rule, {
  valid: [
    {
      code: lines(2),
      filename: 'E:/Project/harness/apps/example/src/domains/tasks/service/small.ts',
      options: [{ warningLines: 3, errorLines: 6 }],
    },
    {
      code: lines(6),
      filename: 'E:/Project/harness/apps/example/src/domains/tasks/service/custom.ts',
      options: [{ warningLines: 10, errorLines: 20 }],
    },
  ],
  invalid: [
    {
      code: lines(3),
      filename: 'E:/Project/harness/apps/example/src/domains/tasks/service/warn.ts',
      options: [{ warningLines: 3, errorLines: 6 }],
      errors: [{ messageId: 'warning' }],
    },
    {
      code: lines(6),
      filename: 'E:/Project/harness/apps/example/src/domains/tasks/service/error.ts',
      options: [{ warningLines: 3, errorLines: 6 }],
      errors: [{ messageId: 'error' }],
    },
  ],
});
