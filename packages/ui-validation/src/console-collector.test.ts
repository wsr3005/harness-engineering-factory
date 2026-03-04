import { describe, expect, it, vi } from 'vitest';
import type { Page } from 'playwright';

import { createConsoleCollector } from './console-collector.js';

type Listener = (...args: unknown[]) => void;

interface EventMap {
  console: Listener[];
  pageerror: Listener[];
}

interface MockConsoleMessage {
  type: () => string;
  text: () => string;
  location: () => { url: string; lineNumber: number; columnNumber: number };
}

const createPage = () => {
  const events: EventMap = {
    console: [],
    pageerror: [],
  };

  return {
    on: vi.fn((event: keyof EventMap, listener: Listener) => {
      events[event].push(listener);
    }),
    off: vi.fn((event: keyof EventMap, listener: Listener) => {
      events[event] = events[event].filter((existing) => existing !== listener);
    }),
    emit(event: keyof EventMap, payload: unknown) {
      for (const listener of events[event]) {
        listener(payload);
      }
    },
  };
};

const message = (type: string, text: string): MockConsoleMessage => ({
  type: () => type,
  text: () => text,
  location: () => ({
    url: 'https://example.test/app.js',
    lineNumber: 10,
    columnNumber: 2,
  }),
});

describe('createConsoleCollector', () => {
  it('captures console entries while started', () => {
    const page = createPage();
    const collector = createConsoleCollector(page as unknown as Page);
    collector.start();

    page.emit('console', message('log', 'hello'));

    const result = collector.getResults();
    expect(result.totalCount).toBe(1);
    expect(result.entries[0]?.text).toBe('hello');
  });

  it('maps warning type to warn', () => {
    const page = createPage();
    const collector = createConsoleCollector(page as unknown as Page);
    collector.start();

    page.emit('console', message('warning', 'careful'));

    const result = collector.getResults();
    expect(result.entries[0]?.type).toBe('warn');
    expect(result.warningCount).toBe(1);
  });

  it('captures page errors as error entries', () => {
    const page = createPage();
    const collector = createConsoleCollector(page as unknown as Page);
    collector.start();

    page.emit('pageerror', new Error('boom'));

    const result = collector.getResults();
    expect(result.errorCount).toBe(1);
    expect(result.entries[0]?.type).toBe('error');
  });

  it('stops and clears collector state', () => {
    const page = createPage();
    const collector = createConsoleCollector(page as unknown as Page);
    collector.start();
    collector.stop();

    page.emit('console', message('log', 'ignored'));
    expect(collector.getResults().totalCount).toBe(0);

    collector.start();
    page.emit('console', message('info', 'kept'));
    expect(collector.getResults().totalCount).toBe(1);

    collector.clear();
    expect(collector.getResults().totalCount).toBe(0);
  });
});
