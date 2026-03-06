import { spawnSync } from 'node:child_process';
import process from 'node:process';

type CheckResult = {
  name: string;
  command: string;
  passed: boolean;
};

const runCheck = (name: string, command: string): CheckResult => {
  process.stdout.write(`\n--- [RUN] ${name}: ${command} ---\n`);
  const result = spawnSync(command, {
    shell: true,
    stdio: 'inherit',
  });
  const passed = result.status === 0;
  process.stdout.write(`--- [${passed ? 'PASS' : 'FAIL'}] ${name} ---\n`);
  return { name, command, passed };
};

const checks: Array<{ name: string; command: string }> = [
  { name: 'typecheck', command: 'pnpm -r run typecheck' },
  { name: 'lint', command: 'pnpm eslint . --max-warnings 0' },
  { name: 'architecture', command: 'npx tsx scripts/validate-architecture.ts' },
];

const results = checks.map((check) => runCheck(check.name, check.command));

const failed = results.filter((result) => !result.passed);
if (failed.length > 0) {
  process.stdout.write(
    `\nCI quality gate FAILED. ${failed.length} check(s): ${failed.map((r) => r.name).join(', ')}\n`,
  );
  process.exit(1);
}

process.stdout.write('\nCI quality gate passed. All checks green.\n');
