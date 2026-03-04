import { GhClient } from './gh-client.js';
import type { GhError, Result } from './types.js';

interface RequestReviewsInput {
  prNumber: number;
  humanReviewers: string[];
  agentReviewers: string[];
}

interface RequestReviewsOutput {
  requestedHumans: string[];
  requestedAgents: string[];
  labelsAdded: string[];
}

export function requestReviews(
  input: RequestReviewsInput,
  ghClient: GhClient,
): Result<RequestReviewsOutput, GhError> {
  const allReviewers = [...input.humanReviewers, ...input.agentReviewers];
  const reviewResult = ghClient.requestReview({
    prNumber: input.prNumber,
    reviewers: allReviewers,
  });

  if (!reviewResult.ok) {
    return reviewResult;
  }

  const labelsAdded: string[] = [];
  if (input.agentReviewers.length > 0) {
    const labelResult = ghClient.addLabels(input.prNumber, ['agent-review-requested']);
    if (!labelResult.ok) {
      return labelResult;
    }
    labelsAdded.push(...labelResult.value.labels);
  }

  return {
    ok: true,
    value: {
      requestedHumans: input.humanReviewers,
      requestedAgents: input.agentReviewers,
      labelsAdded,
    },
  };
}
