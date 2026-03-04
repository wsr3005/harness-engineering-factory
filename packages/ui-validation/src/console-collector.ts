import type { ConsoleMessage, Page } from 'playwright';

import type { ConsoleCollectionResult, ConsoleEntry } from './types.js';

type ConsoleType = ConsoleEntry['type'];

const mapConsoleType = (messageType: string): ConsoleType => {
  if (messageType === 'warning') {
    return 'warn';
  }

  if (
    messageType === 'log' ||
    messageType === 'info' ||
    messageType === 'warn' ||
    messageType === 'error' ||
    messageType === 'debug'
  ) {
    return messageType;
  }

  return 'log';
};

const formatLocation = (message: ConsoleMessage): string | undefined => {
  const location = message.location();
  if (!location.url) {
    return undefined;
  }

  return `${location.url}:${location.lineNumber}:${location.columnNumber}`;
};

export interface ConsoleCollector {
  start: () => void;
  stop: () => void;
  getResults: () => ConsoleCollectionResult;
  clear: () => void;
}

export const createConsoleCollector = (page: Page): ConsoleCollector => {
  const entries: ConsoleEntry[] = [];
  let active = false;

  const onConsole = (message: ConsoleMessage): void => {
    entries.push({
      type: mapConsoleType(message.type()),
      text: message.text(),
      timestamp: Date.now(),
      location: formatLocation(message),
    });
  };

  const onPageError = (error: Error): void => {
    entries.push({
      type: 'error',
      text: error.message,
      timestamp: Date.now(),
      stackTrace: error.stack,
    });
  };

  return {
    start() {
      if (active) {
        return;
      }

      page.on('console', onConsole);
      page.on('pageerror', onPageError);
      active = true;
    },
    stop() {
      if (!active) {
        return;
      }

      page.off('console', onConsole);
      page.off('pageerror', onPageError);
      active = false;
    },
    getResults() {
      const errorCount = entries.filter((entry) => entry.type === 'error').length;
      const warningCount = entries.filter((entry) => entry.type === 'warn').length;
      return {
        entries: [...entries],
        errorCount,
        warningCount,
        totalCount: entries.length,
      };
    },
    clear() {
      entries.length = 0;
    },
  };
};
