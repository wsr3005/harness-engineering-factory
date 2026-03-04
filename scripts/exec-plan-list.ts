import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

type PlanStatus = 'active' | 'completed';

type PlanListItem = {
  slug: string;
  title: string;
  status: PlanStatus;
  domain: string;
  created: string;
  checkedSteps: number;
  totalSteps: number;
};

type Args = {
  format: 'json' | 'table';
};

const ROOT = process.cwd();
const EXEC_PLANS_DIR = path.join(ROOT, 'docs', 'exec-plans');
const ACTIVE_DIR = path.join(EXEC_PLANS_DIR, 'active');
const COMPLETED_DIR = path.join(EXEC_PLANS_DIR, 'completed');

function parseArgs(argv: string[]): Args {
  let format: 'json' | 'table' = 'table';

  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--format') {
      const value = argv[index + 1];
      if (value === 'json' || value === 'table') {
        format = value;
        index += 1;
      }
    }
  }

  return { format };
}

function firstMatch(content: string, expression: RegExp): string {
  const match = content.match(expression);
  return match?.[1]?.trim() ?? 'unknown';
}

function parseSteps(content: string): { checked: number; total: number } {
  const stepMatches = content.match(/^- \[[ x]\] Step \d+:/gm) ?? [];
  const checkedMatches = content.match(/^- \[x\] Step \d+:/gm) ?? [];

  return {
    checked: checkedMatches.length,
    total: stepMatches.length,
  };
}

function parsePlan(filePath: string, status: PlanStatus): PlanListItem {
  const content = readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath);
  const slug = fileName.replace(/\.md$/, '');
  const steps = parseSteps(content);

  return {
    slug,
    title: firstMatch(content, /^#\s+(.+)$/m),
    status,
    domain: firstMatch(content, /^\*\*Domain:\*\*\s+(.+)$/m),
    created: firstMatch(content, /^\*\*Created:\*\*\s+(.+)$/m),
    checkedSteps: steps.checked,
    totalSteps: steps.total,
  };
}

function readPlans(directoryPath: string, status: PlanStatus): PlanListItem[] {
  if (!existsSync(directoryPath)) {
    return [];
  }

  return readdirSync(directoryPath)
    .filter((name) => name.endsWith('.md') && name !== '.gitkeep')
    .map((name) => path.join(directoryPath, name))
    .filter((filePath) => statSync(filePath).isFile())
    .map((filePath) => parsePlan(filePath, status))
    .sort((left, right) => left.title.localeCompare(right.title));
}

function pad(value: string, width: number): string {
  return value.length >= width ? value : `${value}${' '.repeat(width - value.length)}`;
}

function renderTable(active: PlanListItem[], completed: PlanListItem[]): string {
  const rows = [...active, ...completed];
  const headers = ['Status', 'Slug', 'Title', 'Domain', 'Created', 'Steps'];

  const matrix = rows.map((item) => [
    item.status,
    item.slug,
    item.title,
    item.domain,
    item.created,
    `${item.checkedSteps}/${item.totalSteps}`,
  ]);

  const widths = headers.map((header, columnIndex) => {
    const rowWidth = matrix.reduce((max, row) => {
      const value = row[columnIndex] ?? '';
      return Math.max(max, value.length);
    }, 0);
    return Math.max(header.length, rowWidth);
  });

  const line = headers.map((header, columnIndex) => pad(header, widths[columnIndex])).join(' | ');

  const divider = widths.map((width) => '-'.repeat(width)).join('-|-');
  const body = matrix.map((row) =>
    row.map((value, columnIndex) => pad(value, widths[columnIndex])).join(' | '),
  );

  const stats = `Total: ${rows.length} (active: ${active.length}, completed: ${completed.length})`;

  return [line, divider, ...body, '', stats].join('\n');
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const activePlans = readPlans(ACTIVE_DIR, 'active');
  const completedPlans = readPlans(COMPLETED_DIR, 'completed');

  if (args.format === 'json') {
    const payload = {
      active: activePlans,
      completed: completedPlans,
      stats: {
        total: activePlans.length + completedPlans.length,
        active: activePlans.length,
        completed: completedPlans.length,
      },
    };

    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    return;
  }

  process.stdout.write(`${renderTable(activePlans, completedPlans)}\n`);
}

main();
