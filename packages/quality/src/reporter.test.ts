import { describe, expect, it } from 'vitest';

import { aggregateScores } from './aggregate.js';
import { generateJSONReport, generateMarkdownReport } from './reporter.js';
import type { ProjectScore } from './types.js';

function createProjectScore(overall: number, grade: ProjectScore['grade']): ProjectScore {
  return {
    timestamp: '2026-03-04T00:00:00.000Z',
    domains: [
      {
        domain: 'tasks',
        lint: { name: 'lint', score: 95, weight: 0.25, details: '', violations: [] },
        typeSafety: { name: 'type-safety', score: 100, weight: 0.25, details: '', violations: [] },
        testCoverage: {
          name: 'test-coverage',
          score: 80,
          weight: 0.25,
          details: '',
          violations: [],
        },
        docCoverage: { name: 'doc-coverage', score: 90, weight: 0.25, details: '', violations: [] },
        overall,
        grade,
      },
    ],
    overall,
    grade,
  };
}

describe('reporter', () => {
  it('markdown report contains table headers', () => {
    const report = generateMarkdownReport(createProjectScore(91, 'A'));

    expect(report).toContain('| Domain | Lint | Types | Tests | Docs | Overall | Grade |');
    expect(report).toContain('|--------|------|-------|-------|------|---------|-------|');
  });

  it('markdown report contains domain rows', () => {
    const report = generateMarkdownReport(createProjectScore(91, 'A'));

    expect(report).toContain('| tasks | 95 | 100 | 80 | 90 | 91 | A |');
  });

  it('markdown report contains overall grade display', () => {
    const aGradeReport = generateMarkdownReport(createProjectScore(90, 'A'));
    const bGradeReport = generateMarkdownReport(createProjectScore(89, 'B'));

    expect(aGradeReport).toContain('**Overall Grade:** A (90/100)');
    expect(bGradeReport).toContain('**Overall Grade:** B (89/100)');
  });

  it('JSON report is valid JSON', () => {
    const report = generateJSONReport(createProjectScore(91, 'A'));

    expect(() => JSON.parse(report)).not.toThrow();
  });

  it('JSON report contains all domain data', () => {
    const source = createProjectScore(91, 'A');
    const parsed = JSON.parse(generateJSONReport(source)) as ProjectScore;

    expect(parsed.timestamp).toBe(source.timestamp);
    expect(parsed.overall).toBe(91);
    expect(parsed.grade).toBe('A');
    expect(parsed.domains).toHaveLength(1);
    expect(parsed.domains[0]?.domain).toBe('tasks');
    expect(parsed.domains[0]?.lint.score).toBe(95);
    expect(parsed.domains[0]?.typeSafety.score).toBe(100);
    expect(parsed.domains[0]?.testCoverage.score).toBe(80);
    expect(parsed.domains[0]?.docCoverage.score).toBe(90);
  });

  it('grade boundaries in aggregate can be surfaced in reports', () => {
    const aAggregate = aggregateScores([
      { name: 'domain', score: 90, weight: 1, details: '', violations: [] },
    ]);
    const bAggregate = aggregateScores([
      { name: 'domain', score: 89, weight: 1, details: '', violations: [] },
    ]);

    const aReport = generateMarkdownReport(
      createProjectScore(aAggregate.overall, aAggregate.grade),
    );
    const bReport = generateMarkdownReport(
      createProjectScore(bAggregate.overall, bAggregate.grade),
    );

    expect(aReport).toContain('**Overall Grade:** A (90/100)');
    expect(bReport).toContain('**Overall Grade:** B (89/100)');
  });
});
