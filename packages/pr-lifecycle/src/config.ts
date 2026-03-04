import { z } from 'zod';

import type { RalphLoopConfig } from './types.js';

const qualityGateSchema = z.object({
  requireCIPass: z.boolean(),
  requireReviewApproval: z.boolean(),
  requireNoLintErrors: z.boolean(),
  requireTypeCheck: z.boolean(),
  minTestCoverage: z.number().min(0).max(100).optional(),
});

const ralphLoopConfigSchema = z.object({
  maxAttempts: z.number().int().min(1),
  taskDescription: z.string().min(1),
  baseBranch: z.string().min(1),
  branchPrefix: z.string().min(1),
  agentCommand: z.string().min(1),
  reviewers: z.array(z.string().min(1)),
  autoMerge: z.boolean(),
  qualityGates: qualityGateSchema,
});

export const defaultRalphLoopConfig: RalphLoopConfig = {
  maxAttempts: 5,
  taskDescription: '',
  baseBranch: 'main',
  branchPrefix: 'agent/',
  agentCommand: '',
  reviewers: [],
  autoMerge: true,
  qualityGates: {
    requireCIPass: true,
    requireReviewApproval: true,
    requireNoLintErrors: true,
    requireTypeCheck: true,
  },
};

export function validateRalphLoopConfig(config: RalphLoopConfig): RalphLoopConfig {
  return ralphLoopConfigSchema.parse(config);
}

export function parseRalphLoopConfig(partial: Partial<RalphLoopConfig>): RalphLoopConfig {
  const merged = {
    ...defaultRalphLoopConfig,
    ...partial,
    qualityGates: {
      ...defaultRalphLoopConfig.qualityGates,
      ...partial.qualityGates,
    },
  } satisfies RalphLoopConfig;

  return validateRalphLoopConfig(merged);
}

export { qualityGateSchema, ralphLoopConfigSchema };
