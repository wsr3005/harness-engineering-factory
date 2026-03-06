import { readFile } from 'node:fs/promises';
import path from 'node:path';

import {
  domainNameFromPath,
  fileExists,
  isDomainFile,
  lineNumberAt,
  toPosix,
  walkTsFiles,
} from './scanner-utils.js';
import type { Deviation, ScanResult } from './types.js';

const SEVERITY_ORDER: Record<Deviation['severity'], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

const detectSharedUtilities = async (files: string[]): Promise<Deviation[]> => {
  const functionMap = new Map<string, Map<string, Array<{ file: string; line: number }>>>();

  for (const file of files.filter(isDomainFile)) {
    const content = await readFile(file, 'utf8');
    const domain = domainNameFromPath(file);
    if (!domain) {
      continue;
    }

    const matches = [
      ...content.matchAll(/(?:^|\n)\s*export\s+function\s+([A-Za-z_$][\w$]*)\s*\(/g),
      ...content.matchAll(/(?:^|\n)\s*function\s+([A-Za-z_$][\w$]*)\s*\(/g),
    ];

    for (const match of matches) {
      const functionName = match[1];
      if (!functionName) {
        continue;
      }

      const byDomain =
        functionMap.get(functionName) ?? new Map<string, Array<{ file: string; line: number }>>();
      const locations = byDomain.get(domain) ?? [];
      locations.push({ file, line: lineNumberAt(content, match.index ?? 0) });
      byDomain.set(domain, locations);
      functionMap.set(functionName, byDomain);
    }
  }

  const deviations: Deviation[] = [];
  for (const [name, byDomain] of functionMap) {
    if (byDomain.size < 2) {
      continue;
    }

    for (const locations of byDomain.values()) {
      for (const location of locations) {
        deviations.push({
          principle: 'Shared Utilities Over Hand-Rolled Helpers',
          severity: 'medium',
          file: location.file,
          line: location.line,
          description: `Function "${name}" appears in multiple domains; shared logic is likely duplicated.`,
          suggestedFix: 'Extract shared behavior into @harness/* package or shared utility module.',
        });
      }
    }
  }

  return deviations;
};

const detectParseBoundaries = async (files: string[]): Promise<Deviation[]> => {
  const deviations: Deviation[] = [];
  for (const file of files) {
    const content = await readFile(file, 'utf8');
    const jsonParseMatches = [...content.matchAll(/JSON\.parse\s*\(/g)];
    if (jsonParseMatches.length === 0) {
      continue;
    }

    const hasZod = /from\s+['"]zod['"]|\bz\.[A-Za-z_$]|\.safeParse\(/.test(content);
    if (hasZod) {
      continue;
    }

    for (const match of jsonParseMatches) {
      deviations.push({
        principle: 'Parse at Boundaries',
        severity: 'high',
        file,
        line: lineNumberAt(content, match.index ?? 0),
        description: 'JSON.parse() used without visible Zod validation in file.',
        suggestedFix: 'Validate parsed payload with Zod before use in domain/runtime logic.',
      });
    }
  }

  return deviations;
};

const detectStructuredLogging = async (files: string[]): Promise<Deviation[]> => {
  const deviations: Deviation[] = [];
  for (const file of files.filter((item) => isDomainFile(item) && !item.endsWith('.test.ts'))) {
    const content = await readFile(file, 'utf8');
    const matches = [...content.matchAll(/console\.(log|warn|error|info|debug)\s*\(/g)];
    for (const match of matches) {
      deviations.push({
        principle: 'Structured Logging Only',
        severity: 'high',
        file,
        line: lineNumberAt(content, match.index ?? 0),
        description: `Disallowed ${match[0].replace(/\s*\($/, '')} usage in domain code.`,
        suggestedFix: 'Use structured logger from @harness/observability provider interface.',
      });
    }
  }

  return deviations;
};

const detectOneDomainOneDirectory = async (files: string[]): Promise<Deviation[]> => {
  const deviations: Deviation[] = [];
  for (const file of files.filter(isDomainFile)) {
    const content = await readFile(file, 'utf8');
    const sourceDomain = domainNameFromPath(file);
    if (!sourceDomain) {
      continue;
    }

    const importMatches = [
      ...content.matchAll(/(?:import|export)\s+[^'"`]*?from\s+['"]([^'"]+)['"]/g),
    ];
    for (const match of importMatches) {
      const specifier = match[1] ?? '';
      const domainMatch = /\/domains\/([^/]+)\//.exec(specifier);
      if (!domainMatch || domainMatch[1] === sourceDomain) {
        continue;
      }

      deviations.push({
        principle: 'One Domain, One Directory',
        severity: 'high',
        file,
        line: lineNumberAt(content, match.index ?? 0),
        description: `Domain "${sourceDomain}" imports directly from domain "${domainMatch[1]}".`,
        suggestedFix: 'Route cross-domain access through providers or shared packages.',
      });
    }
  }

  return deviations;
};

const detectBarrelExports = async (files: string[]): Promise<Deviation[]> => {
  const deviations: Deviation[] = [];
  const layerDirs = new Set<string>();

  for (const file of files.filter(isDomainFile)) {
    const match =
      /(.*\/domains\/[^/]+\/(types|config|repo|providers|service|runtime|ui))(?:\/|$)/.exec(
        toPosix(file),
      );
    if (match?.[1]) {
      layerDirs.add(path.normalize(match[1]));
    }
  }

  for (const layerDir of layerDirs) {
    const barrelPath = path.join(layerDir, 'index.ts');
    if (!(await fileExists(barrelPath))) {
      deviations.push({
        principle: 'Barrel Exports at Every Boundary',
        severity: 'medium',
        file: layerDir,
        description: 'Layer directory is missing index.ts barrel export.',
        suggestedFix: 'Add index.ts that exports layer public API.',
      });
      continue;
    }

    const content = await readFile(barrelPath, 'utf8');
    if (!/(^|\n)\s*export\s+/.test(content)) {
      deviations.push({
        principle: 'Barrel Exports at Every Boundary',
        severity: 'low',
        file: barrelPath,
        line: 1,
        description: 'Barrel file exists but does not export any module.',
        suggestedFix: 'Export layer modules from index.ts for boundary imports.',
      });
    }
  }

  return deviations;
};

const detectTestsCoLocated = async (files: string[]): Promise<Deviation[]> => {
  const deviations: Deviation[] = [];
  const candidates = files.filter((file) => {
    const normalized = toPosix(file);
    if (!normalized.endsWith('.ts')) {
      return false;
    }
    if (normalized.endsWith('.test.ts') || normalized.endsWith('.d.ts')) {
      return false;
    }
    if (normalized.endsWith('/index.ts')) {
      return false;
    }
    if (normalized.includes('/types/')) {
      return false;
    }
    return true;
  });

  for (const file of candidates) {
    const parsed = path.parse(file);
    const sibling = path.join(parsed.dir, `${parsed.name}.test.ts`);
    if (!(await fileExists(sibling))) {
      deviations.push({
        principle: 'Tests Co-Located with Source',
        severity: 'medium',
        file,
        description: 'Source module does not have co-located test file.',
        suggestedFix: `Add ${path.basename(sibling)} next to the module.`,
      });
    }
  }

  return deviations;
};

export const scanForDeviations = async (rootDir: string): Promise<ScanResult> => {
  const absoluteRoot = path.resolve(rootDir);
  const [appFiles, packageFiles] = await Promise.all([
    walkTsFiles(path.join(absoluteRoot, 'apps')).catch(() => []),
    walkTsFiles(path.join(absoluteRoot, 'packages')).catch(() => []),
  ]);
  const files = [...appFiles, ...packageFiles];

  const deviations = (
    await Promise.all([
      detectSharedUtilities(files),
      detectParseBoundaries(files),
      detectStructuredLogging(files),
      detectOneDomainOneDirectory(files),
      detectBarrelExports(files),
      detectTestsCoLocated(files),
    ])
  )
    .flat()
    .sort((left, right) => {
      const severityDelta = SEVERITY_ORDER[left.severity] - SEVERITY_ORDER[right.severity];
      if (severityDelta !== 0) {
        return severityDelta;
      }
      const fileDelta = left.file.localeCompare(right.file);
      if (fileDelta !== 0) {
        return fileDelta;
      }
      return (left.line ?? 0) - (right.line ?? 0);
    });

  const byPrinciple: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};
  for (const deviation of deviations) {
    byPrinciple[deviation.principle] = (byPrinciple[deviation.principle] ?? 0) + 1;
    bySeverity[deviation.severity] = (bySeverity[deviation.severity] ?? 0) + 1;
  }

  return {
    timestamp: new Date().toISOString(),
    deviations,
    summary: {
      total: deviations.length,
      byPrinciple,
      bySeverity,
    },
  };
};
