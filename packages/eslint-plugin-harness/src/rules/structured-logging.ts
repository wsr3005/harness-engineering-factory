import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';

import { buildRemediation } from '../utils/remediation.js';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/harness-engineering-factory/docs/eslint/${name}`,
);

const message = buildRemediation({
  rule: 'structured-logging',
  message: 'Console logging is forbidden in domain runtime paths.',
  fix: 'Use structured logging adapters from @harness/observability or process streams in scripts only.',
  example: "Replace console.error('x') with logger.error('x', { domain: 'tasks' }).",
  docPath: 'docs/RELIABILITY.md',
});

type MessageIds = 'violation';

const BLOCKED_CONSOLE_METHODS = new Set(['log', 'warn', 'error', 'info', 'debug']);

const getConsoleMethodName = (callee: TSESTree.CallExpression['callee']): string | null => {
  const member = callee.type === 'MemberExpression' ? callee : null;

  if (!member || member.object.type !== 'Identifier' || member.object.name !== 'console') {
    return null;
  }

  if (!member.computed && member.property.type === 'Identifier') {
    return member.property.name;
  }

  if (
    member.computed &&
    member.property.type === 'Literal' &&
    typeof member.property.value === 'string'
  ) {
    return member.property.value;
  }

  return null;
};

const isDomainFile = (fileName: string): boolean => /[\\/]domains[\\/]/.test(fileName);
const isScriptFile = (fileName: string): boolean => /[\\/]scripts[\\/].+\.ts$/.test(fileName);

export const structuredLoggingRule = createRule<[], MessageIds>({
  name: 'structured-logging',
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow direct console logging in domain code.',
    },
    schema: [],
    messages: {
      violation: message,
    },
  },
  defaultOptions: [],
  create(context) {
    if (!isDomainFile(context.filename) || isScriptFile(context.filename)) {
      return {};
    }

    return {
      CallExpression(node) {
        const method = getConsoleMethodName(node.callee);
        if (method && BLOCKED_CONSOLE_METHODS.has(method)) {
          context.report({ node, messageId: 'violation' });
        }
      },
    };
  },
});

export default structuredLoggingRule;
