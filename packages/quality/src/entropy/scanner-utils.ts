import { access, readdir } from 'node:fs/promises';
import path from 'node:path';

export const toPosix = (value: string): string => value.replaceAll('\\', '/');

export const lineNumberAt = (content: string, index: number): number =>
  content.slice(0, index).split('\n').length;

export const isDomainFile = (filePath: string): boolean =>
  /\/domains\/[^/]+\//.test(toPosix(filePath));

export const domainNameFromPath = (filePath: string): string | null => {
  const match = /\/domains\/([^/]+)\//.exec(toPosix(filePath));
  return match?.[1] ?? null;
};

export const fileExists = async (filePath: string): Promise<boolean> => {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
};

export const walkTsFiles = async (rootDir: string): Promise<string[]> => {
  const entries = await readdir(rootDir, { withFileTypes: true });
  const nested = await Promise.all(
    entries
      .filter((entry) => !entry.name.startsWith('.'))
      .filter((entry) => !['node_modules', 'dist', 'coverage'].includes(entry.name))
      .map(async (entry) => {
        const fullPath = path.join(rootDir, entry.name);
        if (entry.isDirectory()) {
          return walkTsFiles(fullPath);
        }
        return entry.name.endsWith('.ts') ? [fullPath] : [];
      }),
  );
  return nested.flat();
};
