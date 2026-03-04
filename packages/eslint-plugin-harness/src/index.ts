import type { Linter } from 'eslint';

import recommended from './configs/recommended.js';
import fileSizeLimitRule from './rules/file-size-limit.js';
import layerDependencyDirectionRule from './rules/layer-dependency-direction.js';
import namingConventionsRule from './rules/naming-conventions.js';
import noCrossDomainImportsRule from './rules/no-cross-domain-imports.js';
import structuredLoggingRule from './rules/structured-logging.js';

export const rules: Record<string, unknown> = {
  'layer-dependency-direction': layerDependencyDirectionRule,
  'structured-logging': structuredLoggingRule,
  'naming-conventions': namingConventionsRule,
  'file-size-limit': fileSizeLimitRule,
  'no-cross-domain-imports': noCrossDomainImportsRule,
};

export const configs: Record<string, Linter.FlatConfig> = {
  recommended,
};

const plugin: { rules: typeof rules; configs: typeof configs } = {
  rules,
  configs,
};

export default plugin;
