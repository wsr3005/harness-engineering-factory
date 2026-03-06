import { execFileSync } from 'node:child_process';

import type { AttemptRecord, Result } from './types.js';

export function emitProgress(event: string, payload: Record<string, unknown>): void {
  const line = JSON.stringify({ event, timestamp: new Date().toISOString(), ...payload });
  process.stdout.write(`${line}\n`);
}

export function defaultRunCommand(command: string, cwd: string): Result<string, string> {
  try {
    const output = execFileSync(command, {
      cwd,
      shell: true,
      encoding: 'utf8',
      stdio: 'pipe',
    });
    return { ok: true, value: output };
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    return { ok: false, error: details };
  }
}

export function toAttemptRecord(
  attempt: number,
  action: string,
  result: 'success' | 'failure',
  duration: number,
  now: Date,
  errorContext?: string,
): AttemptRecord {
  return {
    attempt,
    timestamp: now.toISOString(),
    action,
    result,
    errorContext,
    duration,
  };
}

export function runCiChecks(
  runCommand: (command: string, cwd: string) => Result<string, string>,
  cwd: string,
): Result<true, string> {
  const checks = ['pnpm run typecheck', 'pnpm run lint', 'pnpm run test'];
  for (const check of checks) {
    const result = runCommand(check, cwd);
    if (!result.ok) {
      return {
        ok: false,
        error: `${check} failed: ${result.error}`,
      };
    }
  }
  return { ok: true, value: true };
}
