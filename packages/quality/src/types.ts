export interface ScorerResult {
  name: string;
  score: number;
  weight: number;
  details: string;
  violations: Violation[];
}

export interface Violation {
  file: string;
  line?: number;
  rule: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface DomainScore {
  domain: string;
  lint: ScorerResult;
  typeSafety: ScorerResult;
  testCoverage: ScorerResult;
  docCoverage: ScorerResult;
  overall: number;
  grade: Grade;
}

export interface ProjectScore {
  timestamp: string;
  domains: DomainScore[];
  overall: number;
  grade: Grade;
}

export type Grade = 'A' | 'B' | 'C' | 'D' | 'F';
