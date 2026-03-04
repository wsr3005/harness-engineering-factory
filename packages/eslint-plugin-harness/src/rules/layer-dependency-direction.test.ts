import { RuleTester } from '@typescript-eslint/rule-tester';
import tsParser from '@typescript-eslint/parser';
import { afterAll, describe, it } from 'vitest';

import rule from './layer-dependency-direction.js';

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

tester.run('layer-dependency-direction', rule, {
  valid: [
    {
      code: "import { TaskSchema } from '../types/index.js';",
      filename: 'E:/Project/harness/apps/example/src/domains/tasks/config/tasks.config.ts',
    },
    {
      code: "import { TaskRepository } from '../repo/index.js';",
      filename: 'E:/Project/harness/apps/example/src/domains/tasks/service/tasks.service.ts',
    },
    {
      code: "import { TaskService } from '../service/index.js';",
      filename: 'E:/Project/harness/apps/example/src/domains/tasks/runtime/tasks.runtime.ts',
    },
    {
      code: "import { TaskService } from '../service/index.js';",
      filename: 'E:/Project/harness/apps/example/src/domains/tasks/ui/tasks.handler.ts',
    },
    {
      code: "await import('../providers/index.js');",
      filename: 'E:/Project/harness/apps/example/src/domains/tasks/service/tasks.service.ts',
    },
    {
      code: "import { z } from 'zod';",
      filename: 'E:/Project/harness/apps/example/src/domains/tasks/types/task.schema.ts',
    },
    {
      code: "import { x } from '../../other/domains/billing/ui/index.js';",
      filename: 'E:/Project/harness/apps/example/src/domains/tasks/service/tasks.service.ts',
    },
  ],
  invalid: [
    {
      code: "import { TaskHandlers } from '../ui/index.js';",
      filename: 'E:/Project/harness/apps/example/src/domains/tasks/service/tasks.service.ts',
      errors: [{ messageId: 'violation' }],
    },
    {
      code: "import { config } from '../config/index.js';",
      filename: 'E:/Project/harness/apps/example/src/domains/tasks/types/types.ts',
      errors: [{ messageId: 'violation' }],
    },
    {
      code: "import { repo } from '../repo/index.js';",
      filename: 'E:/Project/harness/apps/example/src/domains/tasks/config/tasks.config.ts',
      errors: [{ messageId: 'violation' }],
    },
    {
      code: "await import('../runtime/index.js');",
      filename: 'E:/Project/harness/apps/example/src/domains/tasks/repo/tasks.repo.ts',
      errors: [{ messageId: 'violation' }],
    },
    {
      code: "import { service } from '../service/index.js';",
      filename: 'E:/Project/harness/apps/example/src/domains/tasks/providers/auth.provider.ts',
      errors: [{ messageId: 'violation' }],
    },
  ],
});
