export const DOMAIN_DIR_PATTERN =
  /[\\/]domains[\\/](?<domain>[^\\/]+)[\\/](?<layer>types|config|repo|providers|service|runtime|ui)[\\/]/;

export const LAYER_NAMES = [
  'types',
  'config',
  'repo',
  'providers',
  'service',
  'runtime',
  'ui',
] as const;

export const SCHEMA_SUFFIX = 'Schema';

export const MAX_FILE_LINES_WARNING = 300;
export const MAX_FILE_LINES_ERROR = 500;
