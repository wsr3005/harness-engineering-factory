import type { Page } from 'playwright';

import type { NavigationResult } from './types.js';

export const navigateTo = async (page: Page, url: string): Promise<NavigationResult> => {
  const startedAt = Date.now();
  const response = await page.goto(url, { waitUntil: 'load' });
  const loadTime = Date.now() - startedAt;

  return {
    url: page.url(),
    status: response?.status() ?? 0,
    loadTime,
    title: await page.title(),
  };
};

export const waitForSelector = async (
  page: Page,
  selector: string,
  timeout?: number,
): Promise<void> => {
  await page.waitForSelector(selector, {
    state: 'visible',
    timeout,
  });
};

export const getCurrentUrl = (page: Page): string => {
  return page.url();
};

export const getPageTitle = async (page: Page): Promise<string> => {
  return page.title();
};
