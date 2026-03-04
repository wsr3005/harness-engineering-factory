import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';

import { ALLOWED_DEPENDENCIES } from '../utils/layer-order.js';
import { getDomainLayerFromPath, parseImportSpecifier } from '../utils/parse-import.js';
import { buildRemediation } from '../utils/remediation.js';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/harness-engineering-factory/docs/eslint/${name}`,
);

const message = buildRemediation({
  rule: 'layer-dependency-direction',
  message: 'Import direction violates layer dependency ordering.',
  fix: 'Import from the same layer or an explicitly allowed lower-level layer.',
  example: "Use '../types/index.js' from config/repo/service, not '../ui/index.js' from service.",
  docPath: 'ARCHITECTURE.md',
});

type MessageIds = 'violation';

const resolveSpecifierFromExpression = (node: TSESTree.ImportExpression): string | null => {
  if (node.source.type === 'Literal' && typeof node.source.value === 'string') {
    return node.source.value;
  }

  return null;
};

export const layerDependencyDirectionRule = createRule<[], MessageIds>({
  name: 'layer-dependency-direction',
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce dependency direction between domain layers.',
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
      const parsed = parseImportSpecifier(specifier, context.filename);
      if (!parsed || parsed.kind === 'workspace' || !parsed.domain || !parsed.layer) {
        return;
      }

      if (parsed.domain !== source.domain) {
        return;
      }

      const allowed = ALLOWED_DEPENDENCIES[source.layer] ?? [];
      if (parsed.layer !== source.layer && !allowed.includes(parsed.layer)) {
        context.report({
          node,
          messageId: 'violation',
        });
      }
    };

    return {
      ImportDeclaration(node) {
        if (typeof node.source.value === 'string') {
          checkSpecifier(node.source, node.source.value);
        }
      },
      ImportExpression(node) {
        const specifier = resolveSpecifierFromExpression(node);
        if (specifier) {
          checkSpecifier(node.source, specifier);
        }
      },
    };
  },
});

export default layerDependencyDirectionRule;
