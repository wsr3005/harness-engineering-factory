import { describe, expect, it } from 'vitest';

import { aggregateScores } from './aggregate.js';

describe('aggregateScores', () => {
  it('calculates weighted average with equal weights', () => {
    const aggregate = aggregateScores([
      { name: 'lint', score: 100, weight: 1, details: '', violations: [] },
      { name: 'types', score: 80, weight: 1, details: '', violations: [] },
      { name: 'tests', score: 60, weight: 1, details: '', violations: [] },
      { name: 'docs', score: 40, weight: 1, details: '', violations: [] },
    ]);

    expect(aggregate.overall).toBe(70);
    expect(aggregate.grade).toBe('C');
  });

  it('calculates weighted average with unequal weights', () => {
    const aggregate = aggregateScores([
      { name: 'lint', score: 100, weight: 4, details: '', violations: [] },
      { name: 'types', score: 50, weight: 1, details: '', violations: [] },
    ]);

    expect(aggregate.overall).toBe(90);
    expect(aggregate.grade).toBe('A');
  });

  it('maps grade boundary 90 to A and 89 to B', () => {
    expect(
      aggregateScores([{ name: 'a', score: 90, weight: 1, details: '', violations: [] }]).grade,
    ).toBe('A');
    expect(
      aggregateScores([{ name: 'b', score: 89, weight: 1, details: '', violations: [] }]).grade,
    ).toBe('B');
  });

  it('maps grade boundary 75 to B and 74 to C', () => {
    expect(
      aggregateScores([{ name: 'a', score: 75, weight: 1, details: '', violations: [] }]).grade,
    ).toBe('B');
    expect(
      aggregateScores([{ name: 'b', score: 74, weight: 1, details: '', violations: [] }]).grade,
    ).toBe('C');
  });

  it('maps grade boundary 60 to C and 59 to D', () => {
    expect(
      aggregateScores([{ name: 'a', score: 60, weight: 1, details: '', violations: [] }]).grade,
    ).toBe('C');
    expect(
      aggregateScores([{ name: 'b', score: 59, weight: 1, details: '', violations: [] }]).grade,
    ).toBe('D');
  });

  it('maps grade boundary 40 to D and 39 to F', () => {
    expect(
      aggregateScores([{ name: 'a', score: 40, weight: 1, details: '', violations: [] }]).grade,
    ).toBe('D');
    expect(
      aggregateScores([{ name: 'b', score: 39, weight: 1, details: '', violations: [] }]).grade,
    ).toBe('F');
  });

  it('returns grade F with overall 0 for empty results', () => {
    const aggregate = aggregateScores([]);

    expect(aggregate.overall).toBe(0);
    expect(aggregate.grade).toBe('F');
  });

  it('returns same score and grade for a single scorer result', () => {
    const aggregate = aggregateScores([
      { name: 'lint', score: 83, weight: 0.25, details: '', violations: [] },
    ]);

    expect(aggregate.overall).toBe(83);
    expect(aggregate.grade).toBe('B');
  });
});
