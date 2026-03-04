import { describe, expect, it, vi } from 'vitest';

import { GhClient } from './gh-client.js';
import { runRalphLoop } from './ralph-loop.js';
import type { RalphLoopConfig, Result, WorktreeInfo } from './types.js';
import { WorktreeManager } from './worktree-manager.js';

function ok<T>(value: T): Result<T, string> {
  return { ok: true, value };
}

function makeConfig(partial?: Partial<RalphLoopConfig>): RalphLoopConfig {
  return {
    maxAttempts: 3,
    taskDescription: 'Implement feature',
    baseBranch: 'main',
    branchPrefix: 'agent/',
    agentCommand: 'agent-run',
    reviewers: ['human1'],
    autoMerge: false,
    qualityGates: {
      requireCIPass: false,
      requireReviewApproval: false,
      requireNoLintErrors: false,
      requireTypeCheck: false,
    },
    ...partial,
  };
}

function setupWorktreeManager(): WorktreeManager {
  const manager = new WorktreeManager({ repoRoot: 'C:/repo', baseBranch: 'main' });
  vi.spyOn(manager, 'create').mockReturnValue({
    ok: true,
    value: {
      name: 'agent-test',
      path: 'C:/repo/.worktrees/agent-test',
      branch: 'agent/test',
      createdAt: new Date(0).toISOString(),
    },
  });
  vi.spyOn(manager, 'remove').mockReturnValue({ ok: true, value: true });
  return manager;
}

function setupGhClient(overrides?: Partial<GhClient>): GhClient {
  const client = new GhClient();

  vi.spyOn(client, 'createPR').mockReturnValue({
    ok: true,
    value: {
      number: 100,
      url: 'https://example/pr/100',
      title: 'title',
      body: 'body',
      state: 'open',
      branch: 'agent/test',
      baseBranch: 'main',
      isDraft: false,
      labels: [],
      reviewDecision: 'APPROVED',
    },
  });
  vi.spyOn(client, 'requestReview').mockReturnValue({ ok: true, value: { requested: ['human1'] } });
  vi.spyOn(client, 'addLabels').mockReturnValue({ ok: true, value: { labels: [] } });
  vi.spyOn(client, 'listPRComments').mockReturnValue({ ok: true, value: [] });
  vi.spyOn(client, 'addComment').mockReturnValue({ ok: true, value: { posted: true } });
  vi.spyOn(client, 'getPR').mockReturnValue({
    ok: true,
    value: {
      number: 100,
      url: 'https://example/pr/100',
      title: 'title',
      body: 'body',
      state: 'open',
      branch: 'agent/test',
      baseBranch: 'main',
      isDraft: false,
      labels: [],
      reviewDecision: 'APPROVED',
    },
  });
  vi.spyOn(client, 'getPRChecks').mockReturnValue({ ok: true, value: [{ state: 'SUCCESS' }] });
  vi.spyOn(client, 'approvePR').mockReturnValue({ ok: true, value: { approved: true } });
  vi.spyOn(client, 'mergePR').mockReturnValue({ ok: true, value: { merged: true } });

  if (overrides) {
    Object.assign(client, overrides);
  }

  return client;
}

describe('runRalphLoop', () => {
  it('completes in single attempt success', () => {
    const gh = setupGhClient();
    const worktree = setupWorktreeManager();
    const runCommand = vi.fn<(command: string, cwd: string) => Result<string, string>>(() =>
      ok('done'),
    );

    const state = runRalphLoop(makeConfig(), {
      ghClient: gh,
      worktreeManager: worktree,
      runCommand,
    });

    expect(state.status).toBe('success');
    expect(state.attempt).toBe(1);
    expect(state.prNumber).toBe(100);
  });

  it('retries after CI failure and then succeeds', () => {
    const gh = setupGhClient();
    const worktree = setupWorktreeManager();
    let invocation = 0;
    const runCommand = vi.fn<(command: string, cwd: string) => Result<string, string>>(
      (command) => {
        invocation += 1;
        if (command.includes('typecheck') && invocation < 4) {
          return { ok: false, error: 'typecheck error' };
        }
        return ok('pass');
      },
    );

    const state = runRalphLoop(makeConfig(), {
      ghClient: gh,
      worktreeManager: worktree,
      runCommand,
    });

    expect(state.status).toBe('success');
    expect(state.attempt).toBeGreaterThan(1);
    expect(state.errors.some((entry) => entry.includes('typecheck'))).toBe(true);
  });

  it('marks max_attempts_reached when agent fails repeatedly', () => {
    const gh = setupGhClient();
    const worktree = setupWorktreeManager();
    const runCommand = vi.fn<(command: string, cwd: string) => Result<string, string>>(() => ({
      ok: false,
      error: 'agent command failed',
    }));

    const state = runRalphLoop(makeConfig({ maxAttempts: 2 }), {
      ghClient: gh,
      worktreeManager: worktree,
      runCommand,
    });

    expect(state.status).toBe('max_attempts_reached');
    expect(state.attempt).toBe(2);
    expect(state.prNumber).toBe(100);
  });

  it('retries when review has actionable feedback', () => {
    const gh = setupGhClient();
    vi.spyOn(gh, 'listPRComments')
      .mockReturnValueOnce({
        ok: true,
        value: [
          {
            id: 'c1',
            author: 'reviewer',
            body: 'Please fix naming',
            createdAt: '2025-01-01T00:00:00Z',
            isResolved: false,
          },
        ],
      })
      .mockReturnValueOnce({ ok: true, value: [] });
    const worktree = setupWorktreeManager();
    const runCommand = vi.fn<(command: string, cwd: string) => Result<string, string>>(() =>
      ok('pass'),
    );

    const state = runRalphLoop(makeConfig(), {
      ghClient: gh,
      worktreeManager: worktree,
      runCommand,
    });

    expect(state.status).toBe('success');
    expect(state.attempt).toBe(2);
    expect(gh.addComment).toHaveBeenCalledTimes(1);
  });

  it('fails immediately when worktree creation fails', () => {
    const gh = setupGhClient();
    const manager = new WorktreeManager({ repoRoot: 'C:/repo', baseBranch: 'main' });
    vi.spyOn(manager, 'create').mockReturnValue({
      ok: false,
      error: { message: 'cannot create' },
    });

    const state = runRalphLoop(makeConfig(), { ghClient: gh, worktreeManager: manager });

    expect(state.status).toBe('failed');
    expect(state.errors[0]).toContain('cannot create');
  });

  it('cleans up worktree after run', () => {
    const gh = setupGhClient();
    const worktreeInfo: WorktreeInfo = {
      name: 'agent-test',
      path: 'C:/repo/.worktrees/agent-test',
      branch: 'agent/test',
      createdAt: new Date(0).toISOString(),
    };
    const manager = new WorktreeManager({ repoRoot: 'C:/repo', baseBranch: 'main' });
    vi.spyOn(manager, 'create').mockReturnValue({ ok: true, value: worktreeInfo });
    const removeSpy = vi.spyOn(manager, 'remove').mockReturnValue({ ok: true, value: true });
    const runCommand = vi.fn<(command: string, cwd: string) => Result<string, string>>(() =>
      ok('pass'),
    );

    runRalphLoop(makeConfig(), { ghClient: gh, worktreeManager: manager, runCommand });

    expect(removeSpy).toHaveBeenCalledWith('agent-test');
  });
});
