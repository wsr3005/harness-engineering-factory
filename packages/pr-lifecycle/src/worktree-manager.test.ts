import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { execFileSyncMock } = vi.hoisted(() => ({
  execFileSyncMock: vi.fn(),
}));

vi.mock('node:child_process', () => ({
  execFileSync: execFileSyncMock,
}));

import { WorktreeManager } from './worktree-manager.js';

describe('WorktreeManager', () => {
  let repoRoot: string;

  beforeEach(() => {
    execFileSyncMock.mockReset();
    repoRoot = mkdtempSync(path.join(tmpdir(), 'pr-lifecycle-'));
  });

  afterEach(() => {
    rmSync(repoRoot, { recursive: true, force: true });
  });

  it('creates a worktree', () => {
    execFileSyncMock.mockReturnValue('');
    const manager = new WorktreeManager({ repoRoot, baseBranch: 'main' });
    const result = manager.create('agent/test');

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.name).toBe('agent-test');
    expect(execFileSyncMock).toHaveBeenCalledWith(
      'git',
      [
        '-C',
        repoRoot,
        'worktree',
        'add',
        '-b',
        'agent/test',
        expect.stringContaining('agent-test'),
        'main',
      ],
      expect.any(Object),
    );
  });

  it('returns error when create fails', () => {
    execFileSyncMock.mockImplementation(() => {
      throw new Error('failed create');
    });
    const manager = new WorktreeManager({ repoRoot, baseBranch: 'main' });

    const result = manager.create('agent/test');
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error.message).toContain('create');
  });

  it('lists only managed worktrees', () => {
    execFileSyncMock.mockReturnValue(
      [
        `worktree ${repoRoot}`,
        'branch refs/heads/main',
        `worktree ${path.join(repoRoot, '.worktrees', 'agent-test')}`,
        'branch refs/heads/agent/test',
      ].join('\n'),
    );
    const manager = new WorktreeManager({ repoRoot, baseBranch: 'main' });
    const result = manager.list();

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value).toHaveLength(1);
    expect(result.value[0]?.name).toBe('agent-test');
  });

  it('removes worktree', () => {
    execFileSyncMock.mockReturnValue('');
    const manager = new WorktreeManager({ repoRoot, baseBranch: 'main' });
    const result = manager.remove('agent-test');

    expect(result.ok).toBe(true);
    expect(execFileSyncMock).toHaveBeenCalledWith(
      'git',
      [
        '-C',
        repoRoot,
        'worktree',
        'remove',
        '--force',
        path.join(repoRoot, '.worktrees', 'agent-test'),
      ],
      expect.any(Object),
    );
  });

  it('cleanup removes all listed worktrees', () => {
    execFileSyncMock
      .mockReturnValueOnce(
        [
          `worktree ${path.join(repoRoot, '.worktrees', 'one')}`,
          'branch refs/heads/agent/one',
          `worktree ${path.join(repoRoot, '.worktrees', 'two')}`,
          'branch refs/heads/agent/two',
        ].join('\n'),
      )
      .mockReturnValue('');

    const manager = new WorktreeManager({ repoRoot, baseBranch: 'main' });
    const result = manager.cleanup();

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value).toBe(2);
  });
});
