import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';

import type { Result, WorktreeInfo } from './types.js';

interface WorktreeManagerError {
  message: string;
  details?: string;
}

interface WorktreeManagerOptions {
  repoRoot?: string;
  baseBranch?: string;
}

function parseWorktreeListOutput(output: string): WorktreeInfo[] {
  const lines = output.split('\n');
  const entries: WorktreeInfo[] = [];

  let currentPath = '';
  let currentBranch = '';

  for (const line of lines) {
    if (line.startsWith('worktree ')) {
      currentPath = line.replace('worktree ', '').trim();
      continue;
    }

    if (line.startsWith('branch ')) {
      currentBranch = line.replace('branch ', '').trim().replace('refs/heads/', '');
      const name = path.basename(currentPath);
      if (name.length > 0) {
        entries.push({
          name,
          path: currentPath,
          branch: currentBranch,
          createdAt: new Date().toISOString(),
        });
      }
    }
  }

  return entries;
}

export class WorktreeManager {
  private readonly repoRoot: string;

  private readonly worktreesRoot: string;

  private readonly baseBranch: string;

  public constructor(options: WorktreeManagerOptions = {}) {
    this.repoRoot = options.repoRoot ?? process.cwd();
    this.worktreesRoot = path.join(this.repoRoot, '.worktrees');
    this.baseBranch = options.baseBranch ?? 'main';
  }

  public create(branchName: string): Result<WorktreeInfo, WorktreeManagerError> {
    try {
      if (!existsSync(this.worktreesRoot)) {
        mkdirSync(this.worktreesRoot, { recursive: true });
      }

      const safeName = branchName.replaceAll('/', '-');
      const worktreePath = path.join(this.worktreesRoot, safeName);
      execFileSync(
        'git',
        ['-C', this.repoRoot, 'worktree', 'add', '-b', branchName, worktreePath, this.baseBranch],
        { encoding: 'utf8', stdio: 'pipe' },
      );

      return {
        ok: true,
        value: {
          name: safeName,
          path: worktreePath,
          branch: branchName,
          createdAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        ok: false,
        error: {
          message: 'Failed to create git worktree',
          details: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  public remove(name: string): Result<true, WorktreeManagerError> {
    try {
      const worktreePath = path.join(this.worktreesRoot, name);
      execFileSync('git', ['-C', this.repoRoot, 'worktree', 'remove', '--force', worktreePath], {
        encoding: 'utf8',
        stdio: 'pipe',
      });

      if (existsSync(worktreePath)) {
        rmSync(worktreePath, { recursive: true, force: true });
      }

      return { ok: true, value: true };
    } catch (error) {
      return {
        ok: false,
        error: {
          message: 'Failed to remove git worktree',
          details: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  public list(): Result<WorktreeInfo[], WorktreeManagerError> {
    try {
      const output = execFileSync('git', ['-C', this.repoRoot, 'worktree', 'list', '--porcelain'], {
        encoding: 'utf8',
        stdio: 'pipe',
      });
      const parsed = parseWorktreeListOutput(output);
      const filtered = parsed.filter((worktree) => worktree.path.startsWith(this.worktreesRoot));
      return { ok: true, value: filtered };
    } catch (error) {
      return {
        ok: false,
        error: {
          message: 'Failed to list git worktrees',
          details: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  public cleanup(): Result<number, WorktreeManagerError> {
    const listed = this.list();
    if (!listed.ok) {
      return listed;
    }

    let removed = 0;
    for (const worktree of listed.value) {
      const removeResult = this.remove(worktree.name);
      if (removeResult.ok) {
        removed += 1;
      }
    }

    return { ok: true, value: removed };
  }
}
