export const LAYER_ORDER = {
  types: 0,
  config: 1,
  repo: 2,
  providers: 2.5,
  service: 3,
  runtime: 4,
  ui: 5,
} as const;

export const ALLOWED_DEPENDENCIES: Record<string, string[]> = {
  types: [],
  config: ['types'],
  repo: ['types', 'config'],
  providers: ['types'],
  service: ['types', 'config', 'repo', 'providers'],
  runtime: ['types', 'config', 'repo', 'service', 'providers'],
  ui: ['types', 'config', 'service', 'runtime', 'providers'],
};
