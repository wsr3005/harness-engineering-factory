import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';

import { afterEach, describe, expect, it } from 'vitest';

import { gardenDocuments } from './doc-gardener.js';

const tempRoots: string[] = [];

const createTempRoot = async (): Promise<string> => {
  const root = await mkdtemp(path.join(tmpdir(), 'doc-garden-'));
  tempRoots.push(root);
  return root;
};

const writeFixture = async (root: string, filePath: string, content: string): Promise<void> => {
  const fullPath = path.join(root, filePath);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, content, 'utf8');
};

afterEach(async () => {
  await Promise.all(
    tempRoots.splice(0).map(async (root) => {
      await rm(root, { recursive: true, force: true });
    }),
  );
});

describe('gardenDocuments', () => {
  it('does not flag valid links', async () => {
    const root = await createTempRoot();
    await writeFixture(root, 'docs/guide.md', '[service](../apps/example/src/file.ts)\n');
    await writeFixture(root, 'apps/example/src/file.ts', 'export const file = 1;\n');

    const result = await gardenDocuments(path.join(root, 'docs'), root);

    expect(result.staleDocuments).toHaveLength(0);
    expect(result.totalBrokenLinks).toBe(0);
  });

  it('detects broken links', async () => {
    const root = await createTempRoot();
    await writeFixture(root, 'docs/guide.md', '[missing](./nope.ts)\n');

    const result = await gardenDocuments(path.join(root, 'docs'), root);

    expect(result.staleDocuments).toHaveLength(1);
    expect(result.staleDocuments[0]?.brokenLinks[0]?.targetPath).toBe('./nope.ts');
  });

  it('skips external URLs', async () => {
    const root = await createTempRoot();
    await writeFixture(root, 'docs/guide.md', '[external](https://example.com/path.ts)\n');

    const result = await gardenDocuments(path.join(root, 'docs'), root);

    expect(result.staleDocuments).toHaveLength(0);
    expect(result.totalBrokenLinks).toBe(0);
  });

  it('returns correct totalBrokenLinks count', async () => {
    const root = await createTempRoot();
    await writeFixture(root, 'docs/guide.md', '[one](./missing-one.ts)\n[two](./missing-two.md)\n');
    await writeFixture(root, 'README.md', '[three](./missing-three.js)\n');

    const result = await gardenDocuments(path.join(root, 'docs'), root);

    expect(result.totalBrokenLinks).toBe(3);
    expect(result.totalFilesChecked).toBe(2);
  });
});
