import type { Grade, ScorerResult } from './types.js';

function toGrade(score: number): Grade {
  if (score >= 90) {
    return 'A';
  }

  if (score >= 75) {
    return 'B';
  }

  if (score >= 60) {
    return 'C';
  }

  if (score >= 40) {
    return 'D';
  }

  return 'F';
}

export function aggregateScores(results: ScorerResult[]): { overall: number; grade: Grade } {
  if (results.length === 0) {
    return { overall: 0, grade: 'F' };
  }

  const totalWeight = results.reduce((sum, result) => sum + result.weight, 0);
  if (totalWeight <= 0) {
    return { overall: 0, grade: 'F' };
  }

  const weighted = results.reduce((sum, result) => sum + result.score * result.weight, 0);
  const overall = weighted / totalWeight;
  return { overall, grade: toGrade(overall) };
}
