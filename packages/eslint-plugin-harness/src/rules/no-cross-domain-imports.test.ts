import { RuleTester } from '@typescript-eslint/rule-tester';
import tsParser from '@typescript-eslint/parser';
import { afterAll, describe, it } from 'vitest';

import rule from './no-cross-domain-imports.js';

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

tester.run('no-cross-domain-imports', rule, {
  valid: [
    {
      code: "import { TaskService } from '../service/index.js';",
      filename: 'E:/Project/harness/apps/example/src/domains/tasks/ui/tasks.handler.ts',
    },
    {
      code: "import { createLogger } from '../../../utils/logger.js';",
      filename: 'E:/Project/harness/apps/example/src/domains/tasks/ui/tasks.handler.ts',
    },
    {
      code: "import { createLogger } from '@harness/observability';",
      filename: 'E:/Project/harness/apps/example/src/domains/tasks/ui/tasks.handler.ts',
    },
    {
      code: "await import('../../../utils/result.js');",
      filename: 'E:/Project/harness/apps/example/src/domains/tasks/service/tasks.service.ts',
    },
  ],
  invalid: [
    {
      code: "import { BillingService } from '../../billing/service/index.js';",
      filename: 'E:/Project/harness/apps/example/src/domains/tasks/ui/tasks.handler.ts',
      errors: [{ messageId: 'violation' }],
    },
    {
      code: "import { BillingSchema } from '../../billing/types/index.js';",
      filename: 'E:/Project/harness/apps/example/src/domains/tasks/service/tasks.service.ts',
      errors: [{ messageId: 'violation' }],
    },
    {
      code: "await import('../../billing/runtime/index.js');",
      filename: 'E:/Project/harness/apps/example/src/domains/tasks/repo/tasks.repo.ts',
      errors: [{ messageId: 'violation' }],
    },
  ],
});
