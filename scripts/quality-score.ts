import { mkdir, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import {
  aggregateScores,
  generateJSONReport,
  generateMarkdownReport,
  scoreDocCoverage,
  scoreLint,
  scoreTestCoverage,
  scoreTypeSafety,
  type DomainScore,
  type ProjectScore,
  type ScorerResult,
} from '../packages/quality/src/index.js';

const SCORER_WEIGHT = 0.25;

async function discoverDomains(domainsRoot: string): Promise<string[]> {
  const entries = await readdir(domainsRoot, { withFileTypes: true });
  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
}

function fallbackScorerResult(name: string, details: string): ScorerResult {
  return {
    name,
    score: 0,
    weight: SCORER_WEIGHT,
    details,
    violations: [],
  };
}

async function runScorerSafely(
  name: string,
  scorer: () => Promise<ScorerResult>,
): Promise<ScorerResult> {
  try {
    return await scorer();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return fallbackScorerResult(name, `Scorer failed: ${message}`);
  }
}

async function scoreDomain(domainsRoot: string, domain: string): Promise<DomainScore> {
  const domainPath = path.join(domainsRoot, domain);

  const [lint, typeSafety, testCoverage, docCoverage] = await Promise.all([
    runScorerSafely('lint', () => scoreLint(domainPath)),
    runScorerSafely('type-safety', () => scoreTypeSafety(domainPath)),
    runScorerSafely('test-coverage', () => scoreTestCoverage(domainPath)),
    runScorerSafely('doc-coverage', () => scoreDocCoverage(domainPath, domain)),
  ]);

  const aggregate = aggregateScores([lint, typeSafety, testCoverage, docCoverage]);
  return {
    domain,
    lint,
    typeSafety,
    testCoverage,
    docCoverage,
    overall: aggregate.overall,
    grade: aggregate.grade,
  };
}

function aggregateProject(domains: DomainScore[]): ProjectScore {
  const projectAggregate = aggregateScores(
    domains.map((domain) => ({
      name: domain.domain,
      score: domain.overall,
      weight: 1,
      details: `Aggregate score for ${domain.domain}`,
      violations: [],
    })),
  );

  return {
    timestamp: new Date().toISOString(),
    domains,
    overall: projectAggregate.overall,
    grade: projectAggregate.grade,
  };
}

async function writeReports(root: string, score: ProjectScore): Promise<void> {
  const markdownPath = path.join(root, 'docs', 'QUALITY_SCORE.md');
  const generatedDir = path.join(root, 'docs', 'generated');
  const jsonPath = path.join(generatedDir, 'quality-score.json');

  await mkdir(generatedDir, { recursive: true });
  await writeFile(markdownPath, generateMarkdownReport(score), 'utf8');
  await writeFile(jsonPath, `${generateJSONReport(score)}\n`, 'utf8');
}

async function main(): Promise<void> {
  const root = process.cwd();
  const domainsRoot = path.join(root, 'apps', 'example', 'src', 'domains');

  try {
    const domains = await discoverDomains(domainsRoot);
    const domainScores = await Promise.all(
      domains.map((domain) => scoreDomain(domainsRoot, domain)),
    );
    const projectScore = aggregateProject(domainScores);

    await writeReports(root, projectScore);
    process.stdout.write(
      `Quality score generated for ${projectScore.domains.length} domain(s). Overall: ${projectScore.overall.toFixed(1)} (${projectScore.grade})\n`,
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const fallbackScore: ProjectScore = {
      timestamp: new Date().toISOString(),
      domains: [],
      overall: 0,
      grade: 'F',
    };

    await writeReports(root, fallbackScore);
    process.stdout.write(`Quality score run completed with issues: ${message}\n`);
  }
}

void main();
