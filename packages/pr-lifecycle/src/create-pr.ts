import { GhClient } from './gh-client.js';
import type { GhError, PRInfo, Result } from './types.js';

interface CreatePullRequestInput {
  title: string;
  summary: string[];
  changes: string[];
  testResults: string[];
  metadata: Record<string, string>;
  branch: string;
  baseBranch: string;
  draft?: boolean;
}

function toBulletList(items: string[]): string {
  if (items.length === 0) {
    return '- None';
  }
  return items.map((item) => `- ${item}`).join('\n');
}

function toMetadataBlock(metadata: Record<string, string>): string {
  const entries = Object.entries(metadata);
  if (entries.length === 0) {
    return '- none: true';
  }
  return entries.map(([key, value]) => `- ${key}: ${value}`).join('\n');
}

export function buildPRBody(input: CreatePullRequestInput): string {
  return [
    '## Summary',
    toBulletList(input.summary),
    '',
    '## Changes',
    toBulletList(input.changes),
    '',
    '## Test Results',
    toBulletList(input.testResults),
    '',
    '## Agent Metadata',
    toMetadataBlock(input.metadata),
  ].join('\n');
}

export function createPullRequest(
  input: CreatePullRequestInput,
  ghClient: GhClient,
): Result<PRInfo, GhError> {
  const body = buildPRBody(input);
  return ghClient.createPR({
    title: input.title,
    body,
    head: input.branch,
    base: input.baseBranch,
    draft: input.draft,
  });
}
