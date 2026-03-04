import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';

import { getDomainLayerFromPath, parseImportSpecifier } from '../utils/parse-import.js';
import { buildRemediation } from '../utils/remediation.js';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/harness-engineering-factory/docs/eslint/${name}`,
);

type MessageIds = 'violation';

const message = buildRemediation({
  rule: 'no-cross-domain-imports',
  message: 'Direct imports between domains are forbidden.',
  fix: 'Move shared logic into a package or shared utils module and import from there.',
  example: "Use '@harness/quality' or 'src/utils/*' for shared code across domains.",
  docPath: 'docs/DESIGN.md',
});

const isUtilsImport = (specifier: string): boolean => /(^|[\\/])utils([\\/]|$)/.test(specifier);

const importSpecifierFromExpression = (node: TSESTree.ImportExpression): string | null => {
  if (node.source.type === 'Literal' && typeof node.source.value === 'string') {
    return node.source.value;
  }

  return null;
};

export const noCrossDomainImportsRule = createRule<[], MessageIds>({
  name: 'no-cross-domain-imports',
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow direct imports across domains.',
    },
    schema: [],
    messages: {
      violation: message,
    },
  },
  defaultOptions: [],
  create(context) {
    const source = getDomainLayerFromPath(context.filename);
    if (!source) {
      return {};
    }

    const checkSpecifier = (node: TSESTree.Node, specifier: string): void => {
      if (specifier.startsWith('@harness/') || isUtilsImport(specifier)) {
        return;
      }

      const parsed = parseImportSpecifier(specifier, context.filename);
      if (!parsed || !parsed.domain || parsed.domain === source.domain) {
        return;
      }

      context.report({ node, messageId: 'violation' });
    };

    return {
      ImportDeclaration(node) {
        if (typeof node.source.value === 'string') {
          checkSpecifier(node.source, node.source.value);
        }
      },
      ImportExpression(node) {
        const specifier = importSpecifierFromExpression(node);
        if (specifier) {
          checkSpecifier(node.source, specifier);
        }
      },
    };
  },
});

export default noCrossDomainImportsRule;
