import { ESLintUtils } from '@typescript-eslint/utils';

import { MAX_FILE_LINES_ERROR, MAX_FILE_LINES_WARNING } from '../utils/constants.js';
import { buildRemediation } from '../utils/remediation.js';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/harness-engineering-factory/docs/eslint/${name}`,
);

type Options = [
  {
    warningLines?: number;
    errorLines?: number;
  },
];

type MessageIds = 'warning' | 'error';

const warningMessage = buildRemediation({
  rule: 'file-size-limit',
  message: `File exceeds warning threshold (${MAX_FILE_LINES_WARNING} lines by default).`,
  fix: 'Split responsibilities into smaller modules before the file grows further.',
  example: 'Extract validation helpers into ./helpers/*.ts and keep orchestrators focused.',
  docPath: 'docs/DESIGN.md',
});

const errorMessage = buildRemediation({
  rule: 'file-size-limit',
  message: `File exceeds hard limit (${MAX_FILE_LINES_ERROR} lines by default).`,
  fix: 'Refactor the file into multiple focused modules immediately.',
  example: 'Move transport adapters, business logic, and types into separate files.',
  docPath: 'docs/DESIGN.md',
});

export const fileSizeLimitRule = createRule<Options, MessageIds>({
  name: 'file-size-limit',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Warn or error when files exceed maintainable size thresholds.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          warningLines: { type: 'number', minimum: 1 },
          errorLines: { type: 'number', minimum: 1 },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      warning: warningMessage,
      error: errorMessage,
    },
  },
  defaultOptions: [
    {
      warningLines: MAX_FILE_LINES_WARNING,
      errorLines: MAX_FILE_LINES_ERROR,
    },
  ],
  create(context, [options]) {
    const warningLines = options.warningLines ?? MAX_FILE_LINES_WARNING;
    const errorLines = options.errorLines ?? MAX_FILE_LINES_ERROR;

    return {
      Program(node) {
        const lineCount = context.sourceCode.lines.length;
        if (lineCount >= errorLines) {
          context.report({ node, messageId: 'error' });
          return;
        }

        if (lineCount >= warningLines) {
          context.report({ node, messageId: 'warning' });
        }
      },
    };
  },
});

export default fileSizeLimitRule;
