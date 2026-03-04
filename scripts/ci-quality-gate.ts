import { execSync } from 'node:child_process';
import process from 'node:process';

type CheckResult = {
  name: string;
  command: string;
  passed: boolean;
  output: string;
};

const runCheck = (name: string, command: string): CheckResult => {
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    return { name, command, passed: true, output };
  } catch (error: unknown) {
    if (error instanceof Error && 'stdout' in error && 'stderr' in error) {
      const stdout = typeof error.stdout === 'string' ? error.stdout : '';
      const stderr = typeof error.stderr === 'string' ? error.stderr : '';
      return {
        name,
        command,
        passed: false,
        output: `${stdout}${stderr}`.trim(),
      };
    }

    const message = error instanceof Error ? error.message : String(error);
    return { name, command, passed: false, output: message };
  }
};

const checks: Array<{ name: string; command: string }> = [
  { name: 'typecheck', command: 'pnpm -r run typecheck' },
  { name: 'lint', command: 'pnpm eslint . --max-warnings 0' },
  { name: 'architecture', command: 'npx tsx scripts/validate-architecture.ts' },
];

const results = checks.map((check) => runCheck(check.name, check.command));

for (const result of results) {
  const status = result.passed ? 'PASS' : 'FAIL';
  process.stdout.write(`[${status}] ${result.name}: ${result.command}\n`);
  if (!result.passed && result.output.length > 0) {
    process.stdout.write(`${result.output}\n`);
  }
}

const failed = results.filter((result) => !result.passed);
if (failed.length > 0) {
  process.stdout.write(`CI quality gate failed. Failed checks: ${failed.length}\n`);
  process.stdout.write(`${failed.map((result) => result.name).join(', ')}\n`);
  process.exit(1);
}

process.stdout.write('CI quality gate passed.\n');
