import path from 'node:path';

import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';

import { SCHEMA_SUFFIX } from '../utils/constants.js';
import { buildRemediation } from '../utils/remediation.js';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/harness-engineering-factory/docs/eslint/${name}`,
);

type MessageIds = 'schemaName' | 'typeName' | 'configName' | 'testName';

const pascalCasePattern = /^[A-Z][A-Za-z0-9]*$/;

const messages: Record<MessageIds, string> = {
  schemaName: buildRemediation({
    rule: 'naming-conventions',
    message: `Zod schema declarations must end with '${SCHEMA_SUFFIX}'.`,
    fix: `Rename schema identifiers to end with '${SCHEMA_SUFFIX}'.`,
    example: 'const TaskSchema = z.object({ id: z.string() });',
    docPath: 'docs/DESIGN.md',
  }),
  typeName: buildRemediation({
    rule: 'naming-conventions',
    message: 'Type aliases and interfaces must use PascalCase names.',
    fix: 'Rename type declarations to PascalCase.',
    example: 'export type TaskRecord = { id: string };',
    docPath: 'docs/DESIGN.md',
  }),
  configName: buildRemediation({
    rule: 'naming-conventions',
    message: 'Files under a config layer must be named *.config.ts.',
    fix: 'Rename the file to <name>.config.ts or use index.ts as a barrel.',
    example: 'tasks.config.ts',
    docPath: 'docs/FRONTEND.md',
  }),
  testName: buildRemediation({
    rule: 'naming-conventions',
    message: 'Test files must end in .test.ts.',
    fix: 'Rename test files to the .test.ts suffix.',
    example: 'tasks.service.test.ts',
    docPath: 'docs/QUALITY_SCORE.md',
  }),
};

const isZodCallExpression = (node: TSESTree.Expression): boolean => {
  if (node.type !== 'CallExpression') {
    return false;
  }

  let callee: TSESTree.Expression | TSESTree.Super = node.callee;
  while (callee.type === 'MemberExpression') {
    callee = callee.object;
  }

  return callee.type === 'Identifier' && callee.name === 'z';
};

const isTestCall = (callee: TSESTree.CallExpression['callee']): boolean => {
  if (callee.type === 'Identifier') {
    return callee.name === 'describe' || callee.name === 'it' || callee.name === 'test';
  }

  return false;
};

export const namingConventionsRule = createRule<[], MessageIds>({
  name: 'naming-conventions',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce naming conventions for schemas, types, config files, and tests.',
    },
    schema: [],
    messages,
  },
  defaultOptions: [],
  create(context) {
    const normalizedPath = context.filename.replaceAll('\\', '/');
    const baseName = path.basename(normalizedPath);
    let testNameReported = false;

    return {
      Program(node) {
        if (
          /\/config\//.test(normalizedPath) &&
          baseName !== 'index.ts' &&
          !baseName.endsWith('.config.ts')
        ) {
          context.report({ node, messageId: 'configName' });
        }

        if (baseName.endsWith('.spec.ts')) {
          context.report({ node, messageId: 'testName' });
          testNameReported = true;
        }
      },
      VariableDeclarator(node) {
        if (
          node.id.type === 'Identifier' &&
          node.init &&
          isZodCallExpression(node.init) &&
          !node.id.name.endsWith(SCHEMA_SUFFIX)
        ) {
          context.report({ node: node.id, messageId: 'schemaName' });
        }
      },
      TSInterfaceDeclaration(node) {
        if (!pascalCasePattern.test(node.id.name)) {
          context.report({ node: node.id, messageId: 'typeName' });
        }
      },
      TSTypeAliasDeclaration(node) {
        if (!pascalCasePattern.test(node.id.name)) {
          context.report({ node: node.id, messageId: 'typeName' });
        }
      },
      CallExpression(node) {
        if (!testNameReported && isTestCall(node.callee) && !baseName.endsWith('.test.ts')) {
          testNameReported = true;
          context.report({ node, messageId: 'testName' });
        }
      },
    };
  },
});

export default namingConventionsRule;
