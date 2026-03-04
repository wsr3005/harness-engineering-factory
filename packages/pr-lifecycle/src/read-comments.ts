import { GhClient } from './gh-client.js';
import type { CategorizedReviewComments, GhError, Result, ReviewComment } from './types.js';

const ACTIONABLE_PATTERNS = [
  /must/i,
  /please/i,
  /change/i,
  /fix/i,
  /required/i,
  /should/i,
  /can you/i,
];

const INFORMATIONAL_PATTERNS = [/nit/i, /suggestion/i, /optional/i, /fyi/i, /consider/i];

function rankActionable(comment: ReviewComment): number {
  const body = comment.body.toLowerCase();
  if (body.includes('blocking') || body.includes('required')) {
    return 3;
  }
  if (body.includes('fix') || body.includes('must')) {
    return 2;
  }
  return 1;
}

function sortByPriority(comments: ReviewComment[]): ReviewComment[] {
  return [...comments].sort((a, b) => {
    const scoreDiff = rankActionable(b) - rankActionable(a);
    if (scoreDiff !== 0) {
      return scoreDiff;
    }
    return a.createdAt.localeCompare(b.createdAt);
  });
}

function isActionable(body: string): boolean {
  return ACTIONABLE_PATTERNS.some((pattern) => pattern.test(body));
}

function isInformational(body: string): boolean {
  return INFORMATIONAL_PATTERNS.some((pattern) => pattern.test(body));
}

export function readReviewFeedback(
  prNumber: number,
  ghClient: GhClient,
): Result<CategorizedReviewComments, GhError> {
  const result = ghClient.listPRComments(prNumber);
  if (!result.ok) {
    return result;
  }

  const actionable: ReviewComment[] = [];
  const informational: ReviewComment[] = [];
  const resolved: ReviewComment[] = [];

  for (const comment of result.value) {
    if (comment.isResolved) {
      resolved.push(comment);
      continue;
    }

    if (isActionable(comment.body)) {
      actionable.push(comment);
      continue;
    }

    if (isInformational(comment.body)) {
      informational.push(comment);
      continue;
    }

    informational.push(comment);
  }

  return {
    ok: true,
    value: {
      actionable: sortByPriority(actionable),
      informational: sortByPriority(informational),
      resolved: sortByPriority(resolved),
    },
  };
}
