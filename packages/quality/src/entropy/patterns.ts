import { readFile } from 'node:fs/promises';
import path from 'node:path';

import type { Deviation } from './types.js';

type DetectionPattern = {
  detect: (files: string[]) => Promise<Deviation[]>;
};

const PRINCIPLES = {
  sharedUtilities: 'Shared Utilities Over Hand-Rolled Helpers',
  parseBoundaries: 'Parse at Boundaries',
  structuredLogging: 'Structured Logging Only',
  oneDomainOneDirectory: 'One Domain, One Directory',
  barrelExports: 'Barrel Exports at Every Boundary',
  testsCoLocated: 'Tests Co-Located with Source',
} as const;

function normalize(filePath: string): string {
  return filePath.replaceAll('\\', '/');
}

function extractDomain(filePath: string): string | undefined {
  const match = normalize(filePath).match(/\/domains\/([^/]+)\//);
  return match?.[1];
}

async function readText(filePath: string): Promise<string> {
  return readFile(filePath, 'utf8');
}

function lineNumber(content: string, token: string): number | undefined {
  const index = content.indexOf(token);
  if (index < 0) {
    return undefined;
  }

  return content.slice(0, index).split(/\r?\n/).length;
}

const detectSharedUtilities: DetectionPattern['detect'] = async (files) => {
  const functionDomains = new Map<string, Set<string>>();
  const functionFiles = new Map<string, string>();

  await Promise.all(
    files.map(async (filePath) => {
      const domain = extractDomain(filePath);
      if (!domain) {
        return;
      }

      const content = await readText(filePath).catch(() => '');
      const matches = content.matchAll(/export\s+function\s+(\w+)\s*\(/g);
      for (const match of matches) {
        const name = match[1];
        if (!name) {
          continue;
        }

        const domains = functionDomains.get(name) ?? new Set<string>();
        domains.add(domain);
        functionDomains.set(name, domains);
        if (!functionFiles.has(name)) {
          functionFiles.set(name, filePath);
        }
      }
    }),
  );

  const deviations: Deviation[] = [];
  for (const [name, domains] of functionDomains.entries()) {
    if (domains.size <= 1) {
      continue;
    }

    deviations.push({
      principle: PRINCIPLES.sharedUtilities,
      severity: 'medium',
      file: functionFiles.get(name) ?? 'unknown',
      description: `Function ${name} appears in multiple domains (${Array.from(domains).join(', ')})`,
      suggestedFix: `Move ${name} into a shared utility package and import it from each domain.`,
    });
  }

  return deviations;
};

const detectParseBoundaries: DetectionPattern['detect'] = async (files) => {
  const deviations: Deviation[] = [];

  await Promise.all(
    files.map(async (filePath) => {
      const content = await readText(filePath).catch(() => '');
      if (!/\bas\s+[A-Z]\w*/.test(content)) {
        return;
      }

      deviations.push({
        principle: PRINCIPLES.parseBoundaries,
        severity: 'medium',
        file: filePath,
        line: lineNumber(content, ' as '),
        description: 'Type assertion found at a boundary without explicit parsing.',
        suggestedFix: 'Parse unknown input with schema validation before using domain types.',
      });
    }),
  );

  return deviations;
};

const detectStructuredLogging: DetectionPattern['detect'] = async (files) => {
  const deviations: Deviation[] = [];

  await Promise.all(
    files.map(async (filePath) => {
      const content = await readText(filePath).catch(() => '');
      if (!content.includes('console.log(')) {
        return;
      }

      deviations.push({
        principle: PRINCIPLES.structuredLogging,
        severity: 'high',
        file: filePath,
        line: lineNumber(content, 'console.log('),
        description: 'console.log used in runtime code.',
        suggestedFix: 'Replace console.log with structured logging through @harness/observability.',
      });
    }),
  );

  return deviations;
};

const detectCrossDomainImports: DetectionPattern['detect'] = async (files) => {
  const deviations: Deviation[] = [];

  await Promise.all(
    files.map(async (filePath) => {
      const currentDomain = extractDomain(filePath);
      if (!currentDomain) {
        return;
      }

      const content = await readText(filePath).catch(() => '');
      const matches = content.matchAll(/from\s+['"][^'"]*domains\/([^/'"]+)\//g);
      for (const match of matches) {
        const importedDomain = match[1];
        if (!importedDomain || importedDomain === currentDomain) {
          continue;
        }

        deviations.push({
          principle: PRINCIPLES.oneDomainOneDirectory,
          severity: 'high',
          file: filePath,
          description: `Cross-domain import from ${currentDomain} to ${importedDomain}.`,
          suggestedFix: 'Route cross-domain interactions through explicit interfaces or providers.',
        });
      }
    }),
  );

  return deviations;
};

const detectMissingBarrels: DetectionPattern['detect'] = async (files) => {
  const candidateDirectories = new Set<string>();
  const normalizedFileSet = new Set(files.map((file) => normalize(file)));

  for (const filePath of files) {
    const normalized = normalize(filePath);
    if (!normalized.includes('/domains/')) {
      continue;
    }

    const name = path.basename(normalized);
    if (name === 'index.ts' || name.endsWith('.test.ts')) {
      continue;
    }

    candidateDirectories.add(path.dirname(filePath));
  }

  const deviations: Deviation[] = [];
  for (const directory of candidateDirectories) {
    const indexPath = path.join(directory, 'index.ts');
    if (normalizedFileSet.has(normalize(indexPath))) {
      continue;
    }

    deviations.push({
      principle: PRINCIPLES.barrelExports,
      severity: 'medium',
      file: directory,
      description: `Missing barrel export at ${indexPath}.`,
      suggestedFix: 'Add index.ts and export the public symbols for this layer.',
    });
  }

  return deviations;
};

const detectMissingCoLocatedTests: DetectionPattern['detect'] = async (files) => {
  const normalizedFiles = files.map((file) => normalize(file));
  const fileSet = new Set(normalizedFiles);
  const deviations: Deviation[] = [];

  for (const filePath of normalizedFiles) {
    if (!filePath.includes('/domains/')) {
      continue;
    }

    const name = path.basename(filePath);
    if (name === 'index.ts' || name.endsWith('.test.ts')) {
      continue;
    }

    if (!name.endsWith('.ts')) {
      continue;
    }

    const testPath = filePath.replace(/\.ts$/, '.test.ts');
    if (fileSet.has(testPath)) {
      continue;
    }

    deviations.push({
      principle: PRINCIPLES.testsCoLocated,
      severity: 'low',
      file: filePath,
      description: `Missing co-located test for ${name}.`,
      suggestedFix: `Add ${path.basename(testPath)} next to ${name}.`,
    });
  }

  return deviations;
};

export const DETECTION_PATTERNS: DetectionPattern[] = [
  { detect: detectSharedUtilities },
  { detect: detectParseBoundaries },
  { detect: detectStructuredLogging },
  { detect: detectCrossDomainImports },
  { detect: detectMissingBarrels },
  { detect: detectMissingCoLocatedTests },
];
