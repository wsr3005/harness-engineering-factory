import type { Page } from 'playwright';

import { createConsoleCollector } from './console-collector.js';
import { captureDOMSnapshot } from './dom-snapshot.js';
import { captureBeforeAfter } from './screenshot.js';
import type { UIValidationResult, ValidationOptions } from './types.js';

export const clickElement = async (page: Page, selector: string): Promise<void> => {
  await page.click(selector);
};

export const fillInput = async (page: Page, selector: string, value: string): Promise<void> => {
  await page.fill(selector, value);
};

export const selectOption = async (page: Page, selector: string, value: string): Promise<void> => {
  await page.selectOption(selector, value);
};

export const submitForm = async (page: Page, formSelector: string): Promise<void> => {
  await page.locator(formSelector).evaluate((formElement) => {
    if (formElement instanceof HTMLFormElement) {
      formElement.requestSubmit();
    }
  });
};

const resolveBoolean = (value: boolean | undefined, fallback: boolean): boolean => {
  return value === undefined ? fallback : value;
};

export const validateUIState = async (
  page: Page,
  options: ValidationOptions = {},
): Promise<UIValidationResult> => {
  const startedAt = Date.now();
  const captureSnapshot = resolveBoolean(options.captureSnapshot, true);
  const captureScreenshots = resolveBoolean(options.captureScreenshots, true);
  const captureConsole = resolveBoolean(options.captureConsole, true);

  const collector = createConsoleCollector(page);
  if (captureConsole) {
    collector.start();
  }

  let snapshotsPromise:
    | Promise<ReturnType<typeof captureDOMSnapshot> extends Promise<infer T> ? T : never>
    | undefined;
  if (captureSnapshot) {
    snapshotsPromise = captureDOMSnapshot(page);
  }

  let screenshotsPromise:
    | Promise<ReturnType<typeof captureBeforeAfter> extends Promise<infer T> ? T : never>
    | undefined;
  if (captureScreenshots) {
    screenshotsPromise = captureBeforeAfter(page, async () => Promise.resolve(), {
      screenshotDir: options.screenshotDir,
    });
  }

  const [snapshot, screenshots] = await Promise.all([
    snapshotsPromise ?? Promise.resolve(undefined),
    screenshotsPromise ?? Promise.resolve(undefined),
  ]);

  if (captureConsole) {
    collector.stop();
  }

  return {
    snapshot,
    screenshots,
    console: captureConsole ? collector.getResults() : undefined,
    navigation: {
      url: page.url(),
      status: 0,
      loadTime: 0,
      title: await page.title(),
    },
    timestamp: startedAt,
    duration: Date.now() - startedAt,
  };
};
