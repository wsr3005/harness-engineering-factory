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
    'Usage: npx tsx scripts/obs-up.ts',
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

async function waitForEndpoint(url: string, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { method: 'GET' });
      if (response.status >= 200 && response.status < 500) {
        return true;
      }
    } catch {
      // no-op
    }

    await new Promise<void>((resolve) => {
      setTimeout(resolve, 1000);
    });
  }

  return false;
}

async function main(): Promise<void> {
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

  const env = {
    ...process.env,
    COMPOSE_PROJECT_NAME: composeProjectName,
    HARNESS_WORKTREE: worktree,
  };

  const up = spawnSync('docker', ['compose', '-f', composeFile, 'up', '-d'], {
    env,
    encoding: 'utf8',
  });

  if (up.status !== 0) {
    printResult({
      status: 'error',
      message: 'failed_to_start_observability_stack',
      data: {
        stderr: up.stderr.trim(),
      },
    });
    process.exit(1);
  }

  const logsPort = process.env.VICTORIA_LOGS_PORT ?? '9428';
  const metricsPort = process.env.VICTORIA_METRICS_PORT ?? '8428';
  const tracesPort = process.env.VICTORIA_TRACES_PORT ?? '8429';
  const otlpPort = process.env.OTLP_HTTP_PORT ?? '4318';

  const health = await Promise.all([
    waitForEndpoint(`http://localhost:${logsPort}`, 20000),
    waitForEndpoint(`http://localhost:${metricsPort}`, 20000),
    waitForEndpoint(`http://localhost:${tracesPort}`, 20000),
  ]);

  printResult({
    status: 'success',
    data: {
      worktree,
      branch,
      composeProjectName,
      healthy: health.every(Boolean),
      endpoints: {
        otlpHttp: `http://localhost:${otlpPort}`,
        logs: `http://localhost:${logsPort}`,
        metrics: `http://localhost:${metricsPort}`,
        traces: `http://localhost:${tracesPort}`,
      },
    },
  });
}

void main();
