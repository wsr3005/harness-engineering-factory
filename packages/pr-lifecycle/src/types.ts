export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export interface PRInfo {
  number: number;
  url: string;
  title: string;
  body: string;
  state: 'open' | 'closed' | 'merged';
  branch: string;
  baseBranch: string;
  isDraft: boolean;
  labels: string[];
  reviewDecision: 'APPROVED' | 'CHANGES_REQUESTED' | 'REVIEW_REQUIRED' | null;
}

export interface ReviewComment {
  id: string;
  author: string;
  body: string;
  path?: string;
  line?: number;
  createdAt: string;
  isResolved: boolean;
}

export interface ReviewResult {
  approved: boolean;
  comments: ReviewComment[];
  summary: string;
}

export type AgentRole = 'fixer' | 'reviewer';

export interface QualityGateConfig {
  requireCIPass: boolean;
  requireReviewApproval: boolean;
  requireNoLintErrors: boolean;
  requireTypeCheck: boolean;
  minTestCoverage?: number;
}

export interface RalphLoopConfig {
  maxAttempts: number;
  taskDescription: string;
  baseBranch: string;
  branchPrefix: string;
  agentCommand: string;
  reviewers: string[];
  autoMerge: boolean;
  qualityGates: QualityGateConfig;
}

export interface AttemptRecord {
  attempt: number;
  timestamp: string;
  action: string;
  result: 'success' | 'failure';
  errorContext?: string;
  duration: number;
}

export interface RalphLoopState {
  attempt: number;
  prNumber: number | null;
  status: 'running' | 'success' | 'failed' | 'max_attempts_reached';
  errors: string[];
  history: AttemptRecord[];
}

export interface WorktreeInfo {
  name: string;
  path: string;
  branch: string;
  createdAt: string;
}

export interface GhError {
  code: 'GH_NOT_FOUND' | 'GH_COMMAND_FAILED' | 'JSON_PARSE_FAILED';
  message: string;
  details?: string;
}

export interface QualityGateFailure {
  gate: 'ci' | 'review' | 'lint' | 'typecheck' | 'coverage';
  reason: string;
}

export interface QualityGateResult {
  passed: boolean;
  failures: QualityGateFailure[];
}

export interface CategorizedReviewComments {
  actionable: ReviewComment[];
  informational: ReviewComment[];
  resolved: ReviewComment[];
}
