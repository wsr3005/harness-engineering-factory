import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

type Args = {
  plan: string;
  step: number;
  status: string;
  notes: string;
};

const ROOT = process.cwd();
const ACTIVE_DIR = path.join(ROOT, 'docs', 'exec-plans', 'active');

function getArgValue(args: string[], name: string): string | undefined {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : undefined;
}

function parseArgs(argv: string[]): Args {
  const plan = getArgValue(argv, 'plan');
  const stepRaw = getArgValue(argv, 'step');
  const status = getArgValue(argv, 'status');
  const notes = getArgValue(argv, 'notes');

  if (!plan || !stepRaw || !status || notes === undefined) {
    process.stderr.write(
      'Usage: npx tsx scripts/exec-plan-update.ts --plan <slug> --step <N> --status done --notes "Verification passed"\n',
    );
    process.exit(1);
  }

  const step = Number(stepRaw);
  if (!Number.isInteger(step) || step <= 0) {
    process.stderr.write('Step must be a positive integer.\n');
    process.exit(1);
  }

  return { plan, step, status, notes };
}

function markStepComplete(lines: string[], stepNumber: number): boolean {
  const targetPattern = new RegExp(`^- \\[([ x])\\] Step ${stepNumber}:`);

  for (let index = 0; index < lines.length; index += 1) {
    if (targetPattern.test(lines[index])) {
      lines[index] = lines[index].replace('- [ ]', '- [x]');
      return true;
    }
  }

  return false;
}

function appendVerificationLog(lines: string[], step: number, status: string, notes: string): void {
  let headerIndex = lines.findIndex((line) => line.startsWith('## Verification Log'));

  if (headerIndex < 0) {
    lines.push(
      '',
      '## Verification Log',
      '| Date | Step | Result | Notes |',
      '|------|------|--------|-------|',
    );
    headerIndex = lines.findIndex((line) => line.startsWith('## Verification Log'));
  }

  let insertIndex = lines.findIndex(
    (line, index) =>
      index > headerIndex && line.startsWith('## ') && !line.startsWith('## Verification Log'),
  );

  if (insertIndex < 0) {
    insertIndex = lines.length;
  }

  const timestamp = new Date().toISOString();
  const safeNotes = notes.replace(/\|/g, '/');
  const row = `| ${timestamp} | ${step} | ${status} | ${safeNotes} |`;

  lines.splice(insertIndex, 0, row);
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const planPath = path.join(ACTIVE_DIR, `${args.plan}.md`);

  if (!existsSync(planPath)) {
    process.stderr.write(`Plan not found: docs/exec-plans/active/${args.plan}.md\n`);
    process.exit(1);
  }

  const content = readFileSync(planPath, 'utf8');
  const lines = content.split('\n');

  const updated = markStepComplete(lines, args.step);
  if (!updated) {
    process.stderr.write(`Step not found: ${args.step}\n`);
    process.exit(1);
  }

  appendVerificationLog(lines, args.step, args.status, args.notes);
  writeFileSync(planPath, `${lines.join('\n').replace(/\n+$/g, '')}\n`, 'utf8');

  process.stdout.write(`Updated: docs/exec-plans/active/${args.plan}.md\n`);
}

main();
