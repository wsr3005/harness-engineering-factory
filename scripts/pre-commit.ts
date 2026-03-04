import { execSync } from 'node:child_process';
import process from 'node:process';

type CommandResult = {
  ok: boolean;
  output: string;
};

const runCommand = (command: string): CommandResult => {
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    return { ok: true, output };
  } catch (error: unknown) {
    if (error instanceof Error && 'stdout' in error && 'stderr' in error) {
      const stdout = typeof error.stdout === 'string' ? error.stdout : '';
      const stderr = typeof error.stderr === 'string' ? error.stderr : '';
      return { ok: false, output: `${stdout}${stderr}`.trim() };
    }

    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, output: message };
  }
};

const getStagedTsFiles = (): string[] => {
  const staged = runCommand("git diff --cached --name-only --diff-filter=ACM -- '*.ts'");
  if (!staged.ok) {
    process.stderr.write(`${staged.output}\n`);
    process.exit(1);
  }

  return staged.output
    .split('\n')
    .map((file) => file.trim())
    .filter((file) => file.length > 0);
};

const main = (): void => {
  const stagedTsFiles = getStagedTsFiles();

  if (stagedTsFiles.length === 0) {
    process.stdout.write('No staged TypeScript files. Skipping pre-commit checks.\n');
    process.exit(0);
  }

  const lintTargets = stagedTsFiles.map((file) => JSON.stringify(file)).join(' ');
  const lint = runCommand(`pnpm eslint --cache ${lintTargets}`);
  if (!lint.ok) {
    process.stderr.write(`ESLint failed on staged files.\n${lint.output}\n`);
    process.exit(1);
  }

  const typecheck = runCommand('npx tsc --noEmit');
  if (!typecheck.ok) {
    process.stderr.write(`TypeScript check failed.\n${typecheck.output}\n`);
    process.exit(1);
  }

  process.stdout.write('Pre-commit checks passed.\n');
};

main();
