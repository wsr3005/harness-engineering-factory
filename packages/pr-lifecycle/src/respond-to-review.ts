import { GhClient } from './gh-client.js';
import type { GhError, Result, ReviewComment } from './types.js';

interface FeedbackResponseInput {
  prNumber: number;
  comments: ReviewComment[];
  responsePrefix?: string;
}

interface FeedbackResponseResult {
  posted: number;
  resolvedIds: string[];
}

export function respondToFeedback(
  input: FeedbackResponseInput,
  ghClient: GhClient,
): Result<FeedbackResponseResult, GhError> {
  const responsePrefix = input.responsePrefix ?? 'Addressed review feedback';
  const resolvedIds: string[] = [];
  let posted = 0;

  for (const comment of input.comments) {
    const replyBody = `${responsePrefix}: ${comment.id}`;
    const replyResult = ghClient.addComment(input.prNumber, replyBody);
    if (!replyResult.ok) {
      return replyResult;
    }
    posted += 1;
    resolvedIds.push(comment.id);
  }

  return {
    ok: true,
    value: {
      posted,
      resolvedIds,
    },
  };
}
