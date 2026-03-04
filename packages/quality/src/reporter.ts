import type { DomainScore, ProjectScore } from './types.js';

function formatScore(value: number): string {
  return `${Math.round(value)}`;
}

function row(domainScore: DomainScore): string {
  return [
    `| ${domainScore.domain}`,
    `${formatScore(domainScore.lint.score)}`,
    `${formatScore(domainScore.typeSafety.score)}`,
    `${formatScore(domainScore.testCoverage.score)}`,
    `${formatScore(domainScore.docCoverage.score)}`,
    `${formatScore(domainScore.overall)}`,
    `${domainScore.grade} |`,
  ].join(' | ');
}

export function generateMarkdownReport(scores: ProjectScore): string {
  const lines = [
    '# Quality Score Report',
    `**Generated:** ${scores.timestamp}`,
    `**Overall Grade:** ${scores.grade} (${formatScore(scores.overall)}/100)`,
    '',
    '| Domain | Lint | Types | Tests | Docs | Overall | Grade |',
    '|--------|------|-------|-------|------|---------|-------|',
    ...scores.domains.map((domain) => row(domain)),
  ];

  return `${lines.join('\n')}\n`;
}

export function generateJSONReport(scores: ProjectScore): string {
  return JSON.stringify(scores, null, 2);
}
