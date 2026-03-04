import { spawn } from 'node:child_process';

import type { ScorerResult, Violation } from '../types.js';

type EslintMessage = {
  line?: number;
  ruleId?: string | null;
  message?: string;
  severity?: number;
};

type EslintFileResult = {
  filePath?: string;
  messages?: EslintMessage[];
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function runEslint(domainPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn('pnpm', ['eslint', '--format', 'json', domainPath], {
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

    child.on('close', (code) => {
      if (stdout.trim().length > 0) {
        resolve(stdout);
        return;
      }

      reject(new Error(stderr || `eslint exited with code ${code ?? 'unknown'}`));
    });
  });
}

function parseViolations(results: EslintFileResult[]): Violation[] {
  const violations: Violation[] = [];

  for (const result of results) {
    const file = result.filePath ?? 'unknown';
    for (const message of result.messages ?? []) {
      const severity = message.severity === 2 ? 'error' : 'warning';
      violations.push({
        file,
        line: message.line,
        rule: message.ruleId ?? 'unknown',
        message: message.message ?? '',
        severity,
      });
    }
  }

  return violations;
}

export async function scoreLint(domainPath: string): Promise<ScorerResult> {
  try {
    const output = await runEslint(domainPath);
    const parsed = JSON.parse(output) as unknown;
    if (!Array.isArray(parsed)) {
      throw new Error('eslint output is not an array');
    }

    const violations = parseViolations(parsed as EslintFileResult[]);
    const errors = violations.filter((item) => item.severity === 'error').length;
    const warnings = violations.filter((item) => item.severity === 'warning').length;
    const score = clamp(100 - errors * 5 - warnings, 0, 100);

    return {
      name: 'lint',
      score,
      weight: 0.25,
      details: `ESLint results for ${domainPath}: ${errors} errors, ${warnings} warnings`,
      violations,
    };
  } catch (error: unknown) {
    return {
      name: 'lint',
      score: 0,
      weight: 0.25,
      details: `Unable to run ESLint for ${domainPath}: ${error instanceof Error ? error.message : String(error)}`,
      violations: [],
    };
  }
}
