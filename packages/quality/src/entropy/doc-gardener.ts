import { access, readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

import type { DocGardenResult, StaleDoc } from './types.js';

const IGNORED_DIRS = new Set(['node_modules', 'dist', 'coverage', '.git']);

const fileExists = async (filePath: string): Promise<boolean> => {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
};

const lineNumberAt = (content: string, index: number): number =>
  content.slice(0, index).split('\n').length;

const walkMarkdownFiles = async (rootDir: string): Promise<string[]> => {
  const entries = await readdir(rootDir, { withFileTypes: true }).catch(() => []);
  const nested = await Promise.all(
    entries
      .filter((entry) => !entry.name.startsWith('.'))
      .filter((entry) => !IGNORED_DIRS.has(entry.name))
      .map(async (entry) => {
        const fullPath = path.join(rootDir, entry.name);
        if (entry.isDirectory()) {
          return walkMarkdownFiles(fullPath);
        }
        return entry.name.endsWith('.md') ? [fullPath] : [];
      }),
  );
  return nested.flat();
};

const checkedExtension = (targetPath: string): boolean => {
  const ext = path.extname(targetPath).toLowerCase();
  return ext === '.ts' || ext === '.js' || ext === '.md';
};

export const gardenDocuments = async (
  docsDir: string,
  rootDir: string,
): Promise<DocGardenResult> => {
  const resolvedDocsDir = path.resolve(docsDir);
  const resolvedRootDir = path.resolve(rootDir);
  const docsFiles = await walkMarkdownFiles(resolvedDocsDir);
  const rootEntries = await readdir(resolvedRootDir, { withFileTypes: true }).catch(() => []);
  const rootFiles = rootEntries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => path.join(resolvedRootDir, entry.name));

  const markdownFiles = [...new Set([...docsFiles, ...rootFiles])];
  const staleDocuments: StaleDoc[] = [];
  let totalBrokenLinks = 0;

  for (const file of markdownFiles) {
    const content = await readFile(file, 'utf8');
    const brokenLinks: StaleDoc['brokenLinks'] = [];

    for (const match of content.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)) {
      const linkText = (match[1] ?? '').trim();
      const rawTarget = (match[2] ?? '').trim();
      if (!rawTarget || /^https?:\/\//.test(rawTarget) || rawTarget.startsWith('#')) {
        continue;
      }

      const targetPath = (rawTarget.split('#')[0] ?? '').trim();
      if (!targetPath || !checkedExtension(targetPath)) {
        continue;
      }

      const resolvedTarget = targetPath.startsWith('/')
        ? path.join(resolvedRootDir, targetPath.replace(/^\/+/, ''))
        : path.resolve(path.dirname(file), targetPath);

      if (!(await fileExists(resolvedTarget))) {
        brokenLinks.push({
          linkText,
          targetPath,
          lineNumber: lineNumberAt(content, match.index ?? 0),
        });
      }
    }

    if (brokenLinks.length > 0) {
      const metadata = await stat(file);
      staleDocuments.push({
        file,
        brokenLinks,
        lastModified: metadata.mtime.toISOString(),
      });
      totalBrokenLinks += brokenLinks.length;
    }
  }

  return {
    timestamp: new Date().toISOString(),
    staleDocuments,
    totalBrokenLinks,
    totalFilesChecked: markdownFiles.length,
  };
};
