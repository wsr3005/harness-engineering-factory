import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';

import { afterEach, describe, expect, it } from 'vitest';

import { scanForDeviations } from './deviation-scanner.js';

const tempRoots: string[] = [];

const createTempRoot = async (): Promise<string> => {
  const root = await mkdtemp(path.join(tmpdir(), 'entropy-scan-'));
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

describe('scanForDeviations', () => {
  it('returns a ScanResult shape', async () => {
    const root = await createTempRoot();
    await writeFixture(
      root,
      'apps/example/src/domains/tasks/service/handler.ts',
      'export function handler(): void {}\n',
    );
    await writeFixture(
      root,
      'apps/example/src/domains/tasks/service/handler.test.ts',
      'import { describe, it } from "vitest";\ndescribe("x", () => { it("y", () => {}); });\n',
    );
    await writeFixture(
      root,
      'apps/example/src/domains/tasks/service/index.ts',
      'export * from "./handler.js";\n',
    );

    const result = await scanForDeviations(root);

    expect(result.timestamp).toMatch(/\d{4}-\d{2}-\d{2}T/);
    expect(Array.isArray(result.deviations)).toBe(true);
    expect(typeof result.summary.total).toBe('number');
    expect(typeof result.summary.byPrinciple).toBe('object');
    expect(typeof result.summary.bySeverity).toBe('object');
  });

  it('summary counts match deviations array', async () => {
    const root = await createTempRoot();
    await writeFixture(
      root,
      'apps/example/src/domains/tasks/service/unsafe.ts',
      'export function unsafe(input: string): unknown {\n  return JSON.parse(input);\n}\n',
    );

    const result = await scanForDeviations(root);
    const counted = result.deviations.reduce<Record<string, number>>((acc, deviation) => {
      acc[deviation.principle] = (acc[deviation.principle] ?? 0) + 1;
      return acc;
    }, {});

    expect(result.summary.total).toBe(result.deviations.length);
    expect(result.summary.byPrinciple).toEqual(counted);
  });

  it('sorts deviations by severity high then medium then low', async () => {
    const root = await createTempRoot();
    await writeFixture(
      root,
      'apps/example/src/domains/tasks/service/handler.ts',
      'export function handler(value: string): unknown {\n  console.log(value);\n  return JSON.parse(value);\n}\n',
    );
    await writeFixture(root, 'docs/links.md', '[broken](./missing.ts)\n');

    const result = await scanForDeviations(root);
    const order: Record<'high' | 'medium' | 'low', number> = { high: 0, medium: 1, low: 2 };
    const sequence = result.deviations.map((deviation) => order[deviation.severity]);

    for (let index = 1; index < sequence.length; index += 1) {
      const previous = sequence[index - 1] ?? Number.POSITIVE_INFINITY;
      const current = sequence[index] ?? Number.POSITIVE_INFINITY;
      expect(previous).toBeLessThanOrEqual(current);
    }
  });

  it('detects console.log in domain code', async () => {
    const root = await createTempRoot();
    await writeFixture(
      root,
      'apps/example/src/domains/tasks/service/logger.ts',
      'export const run = (): void => {\n  console.log("bad");\n};\n',
    );

    const result = await scanForDeviations(root);

    expect(
      result.deviations.some(
        (deviation) =>
          deviation.principle === 'Structured Logging Only' &&
          deviation.file.endsWith(path.join('service', 'logger.ts')),
      ),
    ).toBe(true);
  });

  it('detects missing barrel exports for layer directories', async () => {
    const root = await createTempRoot();
    await writeFixture(
      root,
      'apps/example/src/domains/tasks/service/handler.ts',
      'export function handler(): void {}\n',
    );

    const result = await scanForDeviations(root);

    expect(
      result.deviations.some(
        (deviation) =>
          deviation.principle === 'Barrel Exports at Every Boundary' &&
          deviation.file.endsWith(path.join('domains', 'tasks', 'service')),
      ),
    ).toBe(true);
  });

  it('detects missing co-located test files', async () => {
    const root = await createTempRoot();
    await writeFixture(
      root,
      'apps/example/src/domains/tasks/service/index.ts',
      'export * from "./worker.js";\n',
    );
    await writeFixture(
      root,
      'apps/example/src/domains/tasks/service/worker.ts',
      'export function worker(): void {}\n',
    );

    const result = await scanForDeviations(root);

    expect(
      result.deviations.some(
        (deviation) =>
          deviation.principle === 'Tests Co-Located with Source' &&
          deviation.file.endsWith(path.join('service', 'worker.ts')),
      ),
    ).toBe(true);
  });
});
