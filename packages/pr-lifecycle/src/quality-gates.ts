import { execFileSync } from 'node:child_process';

import { GhClient } from './gh-client.js';
import type {
  GhError,
  QualityGateConfig,
  QualityGateFailure,
  QualityGateResult,
  Result,
} from './types.js';

interface QualityGateOptions {
  prNumber: number;
  gates: QualityGateConfig;
  cwd?: string;
  reviewDecision?: 'APPROVED' | 'CHANGES_REQUESTED' | 'REVIEW_REQUIRED' | null;
  coveragePercent?: number;
}

function runPnpmScript(cwd: string, script: 'lint' | 'typecheck'): Result<true, GhError> {
  try {
    execFileSync('pnpm', ['run', script], {
      cwd,
      stdio: 'pipe',
      encoding: 'utf8',
    });
    return { ok: true, value: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      error: {
        code: 'GH_COMMAND_FAILED',
        message: `${script} failed`,
        details: message,
      },
    };
  }
}

export function checkQualityGates(
  options: QualityGateOptions,
  ghClient: GhClient,
): Result<QualityGateResult, GhError> {
  const failures: QualityGateFailure[] = [];

  if (options.gates.requireCIPass) {
    const checksResult = ghClient.getPRChecks(options.prNumber);
    if (!checksResult.ok) {
      return checksResult;
    }

    const allSucceeded = checksResult.value.every((check) => check.state === 'SUCCESS');
    if (!allSucceeded) {
      failures.push({ gate: 'ci', reason: 'One or more PR checks are not successful.' });
    }
  }

  if (options.gates.requireReviewApproval && options.reviewDecision !== 'APPROVED') {
    failures.push({
      gate: 'review',
      reason: 'PR is not approved yet.',
    });
  }

  const cwd = options.cwd ?? process.cwd();

  if (options.gates.requireNoLintErrors) {
    const lintResult = runPnpmScript(cwd, 'lint');
    if (!lintResult.ok) {
      failures.push({ gate: 'lint', reason: lintResult.error.details ?? lintResult.error.message });
    }
  }

  if (options.gates.requireTypeCheck) {
    const typecheckResult = runPnpmScript(cwd, 'typecheck');
    if (!typecheckResult.ok) {
      failures.push({
        gate: 'typecheck',
        reason: typecheckResult.error.details ?? typecheckResult.error.message,
      });
    }
  }

  if (
    typeof options.gates.minTestCoverage === 'number' &&
    (options.coveragePercent ?? 0) < options.gates.minTestCoverage
  ) {
    failures.push({
      gate: 'coverage',
      reason: `Coverage ${options.coveragePercent ?? 0}% is below required ${options.gates.minTestCoverage}%.`,
    });
  }

  return {
    ok: true,
    value: {
      passed: failures.length === 0,
      failures,
    },
  };
}
