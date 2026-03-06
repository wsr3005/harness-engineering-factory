import { spawnSync } from 'node:child_process';
import process from 'node:process';

type Check = {
  name: string;
  bin: string;
  args: string[];
};

type CheckResult = {
  name: string;
  passed: boolean;
};

const checks: Check[] = [
  { name: 'typecheck', bin: 'pnpm', args: ['-r', 'run', 'typecheck'] },
  { name: 'lint', bin: 'pnpm', args: ['eslint', '.', '--max-warnings', '0'] },
  { name: 'architecture', bin: 'pnpm', args: ['exec', 'tsx', 'scripts/validate-architecture.ts'] },
];

const results: CheckResult[] = [];

for (const check of checks) {
  process.stdout.write(`\n--- [RUN] ${check.name}: ${check.bin} ${check.args.join(' ')} ---\n`);
  const result = spawnSync(check.bin, check.args, { stdio: 'inherit' });
  const passed = result.status === 0;
  process.stdout.write(`--- [${passed ? 'PASS' : 'FAIL'}] ${check.name} ---\n`);
  results.push({ name: check.name, passed });
}

const failed = results.filter((r) => !r.passed);
if (failed.length > 0) {
  process.stdout.write(
    `\nCI quality gate FAILED. ${failed.length} check(s): ${failed.map((r) => r.name).join(', ')}\n`,
  );
  process.exit(1);
}

process.stdout.write('\nCI quality gate passed. All checks green.\n');
