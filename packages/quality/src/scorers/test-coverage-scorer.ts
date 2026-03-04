import { readFile } from 'node:fs/promises';
import path from 'node:path';

import type { ScorerResult, Violation } from '../types.js';

type CoverageMetrics = {
  pct?: number;
};

type CoverageEntry = {
  lines?: CoverageMetrics;
  branches?: CoverageMetrics;
};

type CoverageSummary = Record<string, CoverageEntry>;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function isCoverageEntry(value: unknown): value is CoverageEntry {
  return typeof value === 'object' && value !== null;
}

function normalize(filePath: string): string {
  return filePath.replaceAll('\\', '/').toLowerCase();
}

function scoreFromEntries(entries: CoverageEntry[]): number {
  if (entries.length === 0) {
    return 0;
  }

  const total = entries.reduce((sum, entry) => {
    const lines = typeof entry.lines?.pct === 'number' ? entry.lines.pct : 0;
    const branches = typeof entry.branches?.pct === 'number' ? entry.branches.pct : 0;
    return sum + (lines + branches) / 2;
  }, 0);

  return clamp(total / entries.length, 0, 100);
}

export async function scoreTestCoverage(domainPath: string): Promise<ScorerResult> {
  try {
    const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
    const raw = await readFile(coveragePath, 'utf8');
    const parsed = JSON.parse(raw) as unknown;

    if (typeof parsed !== 'object' || parsed === null) {
      throw new Error('coverage summary is invalid');
    }

    const normalizedDomainPath = normalize(domainPath);
    const summary = parsed as CoverageSummary;
    const entries = Object.entries(summary)
      .filter(([filePath]) => normalize(filePath).includes(normalizedDomainPath))
      .map(([, entry]) => entry)
      .filter((entry) => isCoverageEntry(entry));

    if (entries.length === 0) {
      return {
        name: 'test-coverage',
        score: 0,
        weight: 0.25,
        details: `No coverage data found for ${domainPath}`,
        violations: [
          {
            file: domainPath,
            rule: 'coverage.missing',
            message: 'No coverage data available for this domain',
            severity: 'warning',
          },
        ],
      };
    }

    const score = scoreFromEntries(entries);
    return {
      name: 'test-coverage',
      score,
      weight: 0.25,
      details: `Coverage score for ${domainPath} calculated from ${entries.length} files`,
      violations: [],
    };
  } catch {
    const violations: Violation[] = [
      {
        file: domainPath,
        rule: 'coverage.unavailable',
        message: 'coverage/coverage-summary.json is missing or unreadable',
        severity: 'warning',
      },
    ];

    return {
      name: 'test-coverage',
      score: 0,
      weight: 0.25,
      details: `Coverage data unavailable for ${domainPath}`,
      violations,
    };
  }
}
