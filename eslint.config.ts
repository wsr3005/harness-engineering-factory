import type { Linter } from 'eslint';
import tsEslintPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

import harnessPlugin from './packages/eslint-plugin-harness/src/index.ts';

const config: Linter.FlatConfig[] = [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      'docker/**',
      '.dependency-cruiser.cjs',
    ],
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    plugins: {
      '@typescript-eslint': tsEslintPlugin,
      harness: harnessPlugin,
    },
    rules: {
      ...harnessPlugin.configs.recommended.rules,
    },
  },
];

export default config;
