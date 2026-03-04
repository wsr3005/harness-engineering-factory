import { GhClient } from './gh-client.js';
import { checkQualityGates } from './quality-gates.js';
import type { GhError, QualityGateConfig, Result } from './types.js';

interface ApproveAndMergeInput {
  prNumber: number;
  gates: QualityGateConfig;
  cwd?: string;
}

interface ApproveAndMergeResult {
  merged: boolean;
  reason?: string;
}

export function approveAndMerge(
  input: ApproveAndMergeInput,
  ghClient: GhClient,
): Result<ApproveAndMergeResult, GhError> {
  const prResult = ghClient.getPR(input.prNumber);
  if (!prResult.ok) {
    return prResult;
  }

  const qualityResult = checkQualityGates(
    {
      prNumber: input.prNumber,
      gates: input.gates,
      cwd: input.cwd,
      reviewDecision: prResult.value.reviewDecision,
    },
    ghClient,
  );

  if (!qualityResult.ok) {
    return qualityResult;
  }

  if (!qualityResult.value.passed) {
    return {
      ok: false,
      error: {
        code: 'GH_COMMAND_FAILED',
        message: 'Quality gates failed.',
        details: qualityResult.value.failures.map((failure) => failure.reason).join(' | '),
      },
    };
  }

  const approveResult = ghClient.approvePR(
    input.prNumber,
    'Automated approval after quality gates.',
  );
  if (!approveResult.ok) {
    return approveResult;
  }

  const mergeResult = ghClient.mergePR(input.prNumber);
  if (!mergeResult.ok) {
    return mergeResult;
  }

  return { ok: true, value: { merged: true } };
}
