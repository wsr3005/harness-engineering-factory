import type { Linter } from 'eslint';

export const recommended: Linter.FlatConfig = {
  name: 'harness/recommended',
  rules: {
    'harness/layer-dependency-direction': 'error',
    'harness/structured-logging': 'error',
    'harness/naming-conventions': 'error',
    'harness/file-size-limit': 'warn',
    'harness/no-cross-domain-imports': 'error',
  },
};

export default recommended;
