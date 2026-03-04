import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const args = process.argv.slice(2);

const getArgValue = (name: string): string | undefined => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : undefined;
};

const domainName = getArgValue('name');
const appName = getArgValue('app');

if (!domainName || !appName) {
  process.stderr.write('Usage: npx tsx scripts/create-domain.ts --name <name> --app <app>\n');
  process.exit(1);
}

const root = process.cwd();
const domainRoot = path.join(root, 'apps', appName, 'src', 'domains', domainName);

const layerDirs = ['types', 'config', 'repo', 'service', 'runtime', 'ui', 'providers'];

const files: Array<{ relativePath: string; content: string }> = [
  {
    relativePath: 'AGENTS.md',
    content: `# ${domainName} Domain\n\n- Purpose: add domain-level intent and boundaries.\n- Keep strict layered dependencies.\n`,
  },
  ...layerDirs.flatMap((layer) => [
    {
      relativePath: `${layer}/index.ts`,
      content: `// ${layer} barrel\nexport {};\n`,
    },
  ]),
];

const run = async (): Promise<void> => {
  await mkdir(domainRoot, { recursive: true });

  for (const layer of layerDirs) {
    await mkdir(path.join(domainRoot, layer), { recursive: true });
  }

  for (const file of files) {
    const targetPath = path.join(domainRoot, file.relativePath);
    await writeFile(targetPath, file.content, 'utf8');
  }

  process.stdout.write(
    `Created domain '${domainName}' in apps/${appName}/src/domains/${domainName}\n`,
  );
};

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown error';
  process.stderr.write(`Failed to create domain: ${message}\n`);
  process.exit(1);
});
