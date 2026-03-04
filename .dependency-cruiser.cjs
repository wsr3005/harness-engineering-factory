/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Circular dependencies create hidden coupling.',
      from: {},
      to: {
        circular: true,
      },
    },
    {
      name: 'no-orphans',
      severity: 'warn',
      comment: 'Keep dead files out of the codebase.',
      from: {
        orphan: true,
        pathNot: '\\.(test|spec)\\.ts$|eslint\\.config\\.ts|scripts/',
      },
      to: {},
    },
    {
      name: 'no-layer-violation',
      severity: 'error',
      comment: 'Domain layers can only depend downward in the architecture order.',
      from: {
        path: '^apps/[^/]+/src/domains/[^/]+/(types|config|repo|providers|service|runtime|ui)/',
      },
      to: {
        path: '^apps/[^/]+/src/domains/[^/]+/(ui|runtime|service|repo|config|providers)/',
      },
    },
    {
      name: 'no-cross-domain',
      severity: 'error',
      comment: 'Domains must not directly depend on other domains.',
      from: {
        path: '^apps/[^/]+/src/domains/([^/]+)/',
      },
      to: {
        path: '^apps/[^/]+/src/domains/([^/]+)/',
        pathNot: '^apps/[^/]+/src/domains/\1/',
      },
    },
    {
      name: 'no-apps-to-packages-internal',
      severity: 'error',
      comment: 'Apps should import package entrypoints only.',
      from: {
        path: '^apps/',
      },
      to: {
        path: '^packages/[^/]+/src/',
      },
    },
  ],
  options: {
    doNotFollow: {
      path: 'node_modules',
    },
    includeOnly: '^apps|^packages|^scripts',
    tsConfig: {
      fileName: './tsconfig.json',
    },
  },
};
