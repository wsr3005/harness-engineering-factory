import { spawn } from 'node:child_process';

import type { ScorerResult, Violation } from '../types.js';

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function runTypeCheck(): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn('npx', ['tsc', '--noEmit', '--pretty', 'false'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk: Buffer | string) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk: Buffer | string) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      reject(error);
    });

    child.on('close', () => {
      resolve({ stdout, stderr });
    });
  });
}

function parseTypeErrors(output: string): Violation[] {
  const violations: Violation[] = [];
  const lines = output.split(/\r?\n/);

  for (const line of lines) {
    const match = line.match(/^(.*)\((\d+),(\d+)\):\s+error\s+(TS\d+):\s+(.*)$/);
    if (!match) {
      continue;
    }

    violations.push({
      file: match[1] ?? '',
      line: Number(match[2]),
      rule: match[4] ?? '',
      message: match[5] ?? '',
      severity: 'error',
    });
  }

  return violations;
}

export async function scoreTypeSafety(domainPath: string): Promise<ScorerResult> {
  try {
    const { stdout, stderr } = await runTypeCheck();
    const compilerOutput = [stdout, stderr].filter((item) => item.length > 0).join('\n');
    const allViolations = parseTypeErrors(compilerOutput);
    const normalizedDomain = domainPath.replaceAll('\\', '/').toLowerCase();
    const violations = allViolations.filter((item) =>
      item.file.replaceAll('\\', '/').toLowerCase().includes(normalizedDomain),
    );

    const errors = violations.length;
    const score = errors === 0 ? 100 : clamp(100 - errors * 10, 0, 100);

    return {
      name: 'type-safety',
      score,
      weight: 0.25,
      details: `Type-check results for ${domainPath}: ${errors} errors`,
      violations,
    };
  } catch (error: unknown) {
    return {
      name: 'type-safety',
      score: 0,
      weight: 0.25,
      details: `Unable to run TypeScript compiler: ${error instanceof Error ? error.message : String(error)}`,
      violations: [],
    };
  }
}
