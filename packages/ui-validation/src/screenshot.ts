import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { Page, PageScreenshotOptions } from 'playwright';

import type { ScreenshotResult } from './types.js';

export interface BeforeAfterOptions {
  screenshotDir?: string;
  beforeFileName?: string;
  afterFileName?: string;
  screenshotOptions?: Omit<PageScreenshotOptions, 'path'>;
}

const writeIfNeeded = async (
  screenshotDir: string | undefined,
  fileName: string,
  data: Buffer,
): Promise<string | undefined> => {
  if (!screenshotDir) {
    return undefined;
  }

  await mkdir(screenshotDir, { recursive: true });
  const targetPath = path.join(screenshotDir, fileName);
  await writeFile(targetPath, data);
  return targetPath;
};

export const captureBeforeAfter = async (
  page: Page,
  action: () => Promise<void>,
  options?: BeforeAfterOptions,
): Promise<ScreenshotResult> => {
  const before = await page.screenshot(options?.screenshotOptions);
  await action();
  const after = await page.screenshot(options?.screenshotOptions);

  const beforeFileName = options?.beforeFileName ?? `before-${Date.now()}.png`;
  const afterFileName = options?.afterFileName ?? `after-${Date.now()}.png`;

  const beforePath = await writeIfNeeded(options?.screenshotDir, beforeFileName, before);
  const afterPath = await writeIfNeeded(options?.screenshotDir, afterFileName, after);

  return {
    before,
    after,
    beforePath,
    afterPath,
  };
};
