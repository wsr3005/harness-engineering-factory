import type { GhError, PRInfo, Result, ReviewComment } from './types.js';

const GH_NOT_FOUND_CODES = new Set(['ENOENT', 'ENOTDIR']);

export function toGhError(error: unknown): GhError {
  if (error instanceof Error) {
    const withCode = error as Error & { code?: string; stderr?: string; message: string };
    if (withCode.code && GH_NOT_FOUND_CODES.has(withCode.code)) {
      return {
        code: 'GH_NOT_FOUND',
        message: 'GitHub CLI (gh) is not installed or not available in PATH.',
      };
    }
    return {
      code: 'GH_COMMAND_FAILED',
      message: withCode.message,
      details: withCode.stderr,
    };
  }
  return {
    code: 'GH_COMMAND_FAILED',
    message: 'Unknown gh execution error',
  };
}

export function parseJson<T>(raw: string): Result<T, GhError> {
  try {
    return { ok: true, value: JSON.parse(raw) as T };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: 'JSON_PARSE_FAILED',
        message: 'Failed to parse gh json response',
        details: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

export function mapPRInfo(raw: {
  number: number;
  url: string;
  title: string;
  body: string;
  state: string;
  headRefName: string;
  baseRefName: string;
  isDraft: boolean;
  labels: Array<{ name: string }>;
  reviewDecision: 'APPROVED' | 'CHANGES_REQUESTED' | 'REVIEW_REQUIRED' | null;
}): PRInfo {
  return {
    number: raw.number,
    url: raw.url,
    title: raw.title,
    body: raw.body,
    state: raw.state.toLowerCase() as PRInfo['state'],
    branch: raw.headRefName,
    baseBranch: raw.baseRefName,
    isDraft: raw.isDraft,
    labels: raw.labels.map((label) => label.name),
    reviewDecision: raw.reviewDecision,
  };
}

export function mapComment(raw: {
  id: string;
  body: string;
  author?: { login?: string };
  path?: string;
  line?: number;
  createdAt: string;
  isResolved?: boolean;
}): ReviewComment {
  return {
    id: raw.id,
    author: raw.author?.login ?? 'unknown',
    body: raw.body,
    path: raw.path,
    line: raw.line,
    createdAt: raw.createdAt,
    isResolved: raw.isResolved ?? false,
  };
}
