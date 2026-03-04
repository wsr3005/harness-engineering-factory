import { rm } from 'node:fs/promises';
import type { Page } from 'playwright';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { captureBeforeAfter } from './screenshot.js';

const tempDir = 'E:/Project/harness/packages/ui-validation/.tmp-test-shots';

interface MockPage {
  screenshot: (options?: object) => Promise<Buffer>;
}

describe('captureBeforeAfter', () => {
  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('returns before and after buffers', async () => {
    const screenshot = vi
      .fn<MockPage['screenshot']>()
      .mockResolvedValueOnce(Buffer.from('before'))
      .mockResolvedValueOnce(Buffer.from('after'));

    const page: MockPage = { screenshot };

    const result = await captureBeforeAfter(page as unknown as Page, async () => Promise.resolve());

    expect(Buffer.isBuffer(result.before)).toBe(true);
    expect(Buffer.isBuffer(result.after)).toBe(true);
    expect(result.before.toString()).toBe('before');
    expect(result.after.toString()).toBe('after');
  });

  it('runs the action between screenshots', async () => {
    const screenshot = vi
      .fn<MockPage['screenshot']>()
      .mockResolvedValueOnce(Buffer.from('before'))
      .mockResolvedValueOnce(Buffer.from('after'));
    const action = vi.fn(async () => Promise.resolve());

    const page: MockPage = { screenshot };

    await captureBeforeAfter(page as unknown as Page, action);

    expect(screenshot).toHaveBeenCalledTimes(2);
    expect(action).toHaveBeenCalledTimes(1);
    const firstShotOrder = screenshot.mock.invocationCallOrder[0];
    const actionOrder = action.mock.invocationCallOrder[0];
    const secondShotOrder = screenshot.mock.invocationCallOrder[1];

    expect(firstShotOrder).toBeDefined();
    expect(actionOrder).toBeDefined();
    expect(secondShotOrder).toBeDefined();

    if (!firstShotOrder || !actionOrder || !secondShotOrder) {
      throw new Error('Expected invocation order to be populated');
    }

    expect(firstShotOrder).toBeLessThan(actionOrder);
    expect(actionOrder).toBeLessThan(secondShotOrder);
  });

  it('writes screenshots to disk when directory is provided', async () => {
    const screenshot = vi
      .fn<MockPage['screenshot']>()
      .mockResolvedValueOnce(Buffer.from('before-file'))
      .mockResolvedValueOnce(Buffer.from('after-file'));

    const page: MockPage = { screenshot };

    const result = await captureBeforeAfter(
      page as unknown as Page,
      async () => Promise.resolve(),
      {
        screenshotDir: tempDir,
        beforeFileName: 'before.png',
        afterFileName: 'after.png',
      },
    );

    expect(result.beforePath).toContain('before.png');
    expect(result.afterPath).toContain('after.png');
  });
});
