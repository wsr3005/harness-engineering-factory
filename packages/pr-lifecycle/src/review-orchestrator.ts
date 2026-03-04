import type { AgentRole, Result, ReviewResult } from './types.js';

interface ReviewOrchestratorError {
  message: string;
  details?: string;
}

interface ReviewOrchestratorConfig {
  maxRounds: number;
}

interface RoundContext {
  round: number;
  role: AgentRole;
  previousReview?: ReviewResult;
}

type RoundHandler = (context: RoundContext) => Result<ReviewResult, ReviewOrchestratorError>;

interface OrchestratorResult {
  approved: boolean;
  rounds: number;
  history: Array<{ role: AgentRole; result: ReviewResult }>;
}

export function orchestrateReview(
  config: ReviewOrchestratorConfig,
  handler: RoundHandler,
): Result<OrchestratorResult, ReviewOrchestratorError> {
  const history: Array<{ role: AgentRole; result: ReviewResult }> = [];
  let previousReview: ReviewResult | undefined;

  for (let round = 1; round <= config.maxRounds; round += 1) {
    const role: AgentRole = round % 2 === 1 ? 'fixer' : 'reviewer';
    const result = handler({ round, role, previousReview });
    if (!result.ok) {
      return result;
    }

    history.push({ role, result: result.value });
    previousReview = result.value;

    if (role === 'reviewer' && result.value.approved) {
      return {
        ok: true,
        value: {
          approved: true,
          rounds: round,
          history,
        },
      };
    }
  }

  return {
    ok: true,
    value: {
      approved: false,
      rounds: config.maxRounds,
      history,
    },
  };
}
