import path from 'node:path';

import { DOMAIN_DIR_PATTERN, LAYER_NAMES } from './constants.js';

export type LayerName = (typeof LAYER_NAMES)[number];

export interface DomainLayerLocation {
  domain: string;
  layer: LayerName;
}

export interface ParsedImport {
  kind: 'relative' | 'workspace' | 'absolute';
  domain: string | null;
  layer: LayerName | null;
  resolvedPath: string | null;
}

const parseDomainLayer = (value: string): DomainLayerLocation | null => {
  const match = value.match(DOMAIN_DIR_PATTERN);
  const domain = match?.groups?.domain;
  const layer = match?.groups?.layer;

  if (!domain || !layer || !LAYER_NAMES.includes(layer as LayerName)) {
    return null;
  }

  return { domain, layer: layer as LayerName };
};

export const getDomainLayerFromPath = (filePath: string): DomainLayerLocation | null => {
  const normalized = filePath.replaceAll('\\', '/');
  return parseDomainLayer(normalized);
};

export const parseImportSpecifier = (
  specifier: string,
  sourceFilePath: string,
): ParsedImport | null => {
  if (specifier.startsWith('@harness/')) {
    return {
      kind: 'workspace',
      domain: null,
      layer: null,
      resolvedPath: null,
    };
  }

  if (specifier.startsWith('./') || specifier.startsWith('../')) {
    const resolved = path.resolve(path.dirname(sourceFilePath), specifier).replaceAll('\\', '/');
    const target = parseDomainLayer(resolved);
    return {
      kind: 'relative',
      domain: target?.domain ?? null,
      layer: target?.layer ?? null,
      resolvedPath: resolved,
    };
  }

  if (specifier.startsWith('/')) {
    const target = parseDomainLayer(specifier);
    return {
      kind: 'absolute',
      domain: target?.domain ?? null,
      layer: target?.layer ?? null,
      resolvedPath: specifier,
    };
  }

  if (specifier.includes('/domains/')) {
    const normalized = specifier.replaceAll('\\', '/');
    const target = parseDomainLayer(normalized);
    return {
      kind: 'absolute',
      domain: target?.domain ?? null,
      layer: target?.layer ?? null,
      resolvedPath: normalized,
    };
  }

  return null;
};
