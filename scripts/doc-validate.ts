import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

type Issue = {
  file: string;
  issue: string;
};

const root = process.cwd();

const exists = async (targetPath: string): Promise<boolean> => {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
};

const walkMarkdownFiles = async (dir: string): Promise<string[]> => {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return walkMarkdownFiles(fullPath);
      }
      return entry.name.endsWith('.md') ? [fullPath] : [];
    }),
  );
  return files.flat();
};

const checkDocsStructure = async (issues: Issue[]): Promise<void> => {
  const requiredDirs = ['design-docs', 'exec-plans', 'product-specs', 'generated', 'references'];
  await Promise.all(
    requiredDirs.map(async (dir) => {
      const target = path.join(root, 'docs', dir);
      if (!(await exists(target))) {
        issues.push({ file: 'docs', issue: `Missing required directory: ${dir}` });
      }
    }),
  );
};

const checkDomainAgentDocs = async (issues: Issue[]): Promise<void> => {
  const appsRoot = path.join(root, 'apps');
  if (!(await exists(appsRoot))) {
    return;
  }

  const apps = await readdir(appsRoot, { withFileTypes: true });
  for (const app of apps) {
    if (!app.isDirectory()) {
      continue;
    }

    const domainsRoot = path.join(appsRoot, app.name, 'src', 'domains');
    if (!(await exists(domainsRoot))) {
      continue;
    }

    const domains = await readdir(domainsRoot, { withFileTypes: true });
    for (const domain of domains) {
      if (!domain.isDirectory()) {
        continue;
      }

      const agentsPath = path.join(domainsRoot, domain.name, 'AGENTS.md');
      if (!(await exists(agentsPath))) {
        issues.push({
          file: path.relative(root, path.join(domainsRoot, domain.name)),
          issue: 'Missing AGENTS.md for domain',
        });
      }
    }
  }
};

const getLocalLinkTarget = (link: string, filePath: string): string | null => {
  const normalized = link.trim();
  if (
    normalized.length === 0 ||
    normalized.startsWith('#') ||
    normalized.startsWith('http://') ||
    normalized.startsWith('https://') ||
    normalized.startsWith('mailto:')
  ) {
    return null;
  }

  const [target] = normalized.split('#');
  const cleanTarget = target.split('?')[0];
  if (cleanTarget.length === 0) {
    return null;
  }

  if (cleanTarget.startsWith('/')) {
    return path.resolve(root, cleanTarget.slice(1));
  }

  return path.resolve(path.dirname(filePath), cleanTarget);
};

const checkMarkdownLinks = async (issues: Issue[]): Promise<void> => {
  const docsMarkdown = await walkMarkdownFiles(path.join(root, 'docs'));
  const rootEntries = await readdir(root, { withFileTypes: true });
  const rootMarkdown = rootEntries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => path.join(root, entry.name));
  const markdownFiles = [...docsMarkdown, ...rootMarkdown];

  const linkRegex = /\[[^\]]+\]\(([^)]+)\)/g;

  for (const markdownFile of markdownFiles) {
    const content = await readFile(markdownFile, 'utf8');
    const matches = Array.from(content.matchAll(linkRegex));

    for (const match of matches) {
      const rawLink = match[1] ?? '';
      const target = getLocalLinkTarget(rawLink, markdownFile);
      if (!target) {
        continue;
      }

      if (!(await exists(target))) {
        issues.push({
          file: path.relative(root, markdownFile),
          issue: `Broken local link: ${rawLink}`,
        });
      }
    }
  }
};

const checkPlansIndexReferences = async (issues: Issue[]): Promise<void> => {
  const plansPath = path.join(root, 'docs', 'PLANS.md');
  if (!(await exists(plansPath))) {
    issues.push({ file: 'docs/PLANS.md', issue: 'Missing plans index file' });
    return;
  }

  const plansContent = await readFile(plansPath, 'utf8');
  const referenced = new Set<string>();
  const referenceRegex = /\((exec-plans\/(?:active|completed)\/[^)#\s]+\.md)\)/g;
  for (const match of plansContent.matchAll(referenceRegex)) {
    const reference = match[1];
    if (reference) {
      referenced.add(reference.replaceAll('\\', '/'));
    }
  }

  const activeDir = path.join(root, 'docs', 'exec-plans', 'active');
  const completedDir = path.join(root, 'docs', 'exec-plans', 'completed');
  const activePlans = (await readdir(activeDir, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => `exec-plans/active/${entry.name}`);
  const completedPlans = (await readdir(completedDir, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => `exec-plans/completed/${entry.name}`);
  const actual = new Set([...activePlans, ...completedPlans]);

  for (const plan of actual) {
    if (!referenced.has(plan)) {
      issues.push({ file: 'docs/PLANS.md', issue: `Plan not referenced: ${plan}` });
    }
  }

  for (const plan of referenced) {
    if (!actual.has(plan)) {
      issues.push({ file: 'docs/PLANS.md', issue: `Reference does not exist: ${plan}` });
    }
  }
};

const main = async (): Promise<void> => {
  const strictMode = process.argv.includes('--strict');
  const issues: Issue[] = [];

  await checkDocsStructure(issues);
  await checkDomainAgentDocs(issues);
  await checkMarkdownLinks(issues);
  await checkPlansIndexReferences(issues);

  const result = {
    valid: issues.length === 0,
    issues,
  };

  process.stdout.write(`Doc validation complete. Issues: ${issues.length}\n`);
  process.stdout.write(`${JSON.stringify(result)}\n`);

  if (strictMode && issues.length > 0) {
    process.exit(1);
  }
};

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  const result = {
    valid: false,
    issues: [{ file: 'scripts/doc-validate.ts', issue: message }],
  };
  process.stdout.write(`${JSON.stringify(result)}\n`);
  process.exit(1);
});
