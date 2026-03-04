import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

type Result =
  | { status: 'success'; data: Record<string, unknown> }
  | { status: 'error'; message: string; data?: Record<string, unknown> };

const composeFile = path.resolve('docker/observability/docker-compose.yml');

function printResult(result: Result): void {
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

function helpText(): string {
  return [
    'Usage: npx tsx scripts/obs-down.ts',
    '',
    'Options:',
    '  --help    Show this help message',
  ].join('\n');
}

function resolveBranchName(): string {
  const branch = spawnSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
    encoding: 'utf8',
  });

  if (branch.status !== 0) {
    return 'detached';
  }

  return branch.stdout.trim() || 'detached';
}

function toWorktreeName(branch: string): string {
  return (
    branch
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'default'
  );
}

function main(): void {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    process.stdout.write(`${helpText()}\n`);
    return;
  }

  const dockerInfo = spawnSync('docker', ['info'], { encoding: 'utf8' });
  if (dockerInfo.status !== 0) {
    printResult({
      status: 'success',
      data: {
        skipped: true,
        reason: 'docker_unavailable',
      },
    });
    process.exit(0);
  }

  const branch = resolveBranchName();
  const worktree = toWorktreeName(branch);
  const composeProjectName = `harness-${worktree}`;

  const down = spawnSync('docker', ['compose', '-f', composeFile, 'down', '-v'], {
    env: {
      ...process.env,
      COMPOSE_PROJECT_NAME: composeProjectName,
      HARNESS_WORKTREE: worktree,
    },
    encoding: 'utf8',
  });

  if (down.status !== 0) {
    printResult({
      status: 'error',
      message: 'failed_to_stop_observability_stack',
      data: {
        stderr: down.stderr.trim(),
      },
    });
    process.exit(1);
  }

  printResult({
    status: 'success',
    data: {
      worktree,
      branch,
      composeProjectName,
      removedVolumes: true,
    },
  });
}

main();
