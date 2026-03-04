import { trace } from '@opentelemetry/api';
import { describe, expect, it, vi } from 'vitest';

import type { Span } from '@opentelemetry/api';

import { createLogger } from './logger.js';

type JsonLine = Record<string, unknown>;

function createDestination(lines: string[]): { write: (chunk: string) => boolean } {
  return {
    write(chunk: string): boolean {
      lines.push(chunk.trim());
      return true;
    },
  };
}

function parseLine(line: string): JsonLine {
  return JSON.parse(line) as JsonLine;
}

describe('createLogger', () => {
  it('outputs valid JSON logs with expected base fields', () => {
    const lines: string[] = [];
    const logger = createLogger({ destination: createDestination(lines) });

    logger.info('hello world', { requestId: 'req-1' });

    expect(lines).toHaveLength(1);
    const firstLine = lines[0];
    expect(firstLine).toBeDefined();
    const parsed = parseLine(firstLine ?? '');
    expect(parsed.level).toBe('info');
    expect(parsed.msg).toBe('hello world');
    expect(parsed.timestamp).toBeTypeOf('string');
    expect(parsed.requestId).toBe('req-1');
  });

  it('includes active OpenTelemetry trace context', () => {
    const lines: string[] = [];
    const getSpanSpy = vi.spyOn(trace, 'getSpan').mockReturnValue({
      spanContext(): { traceId: string; spanId: string; traceFlags: 1 } {
        return {
          traceId: 'trace-123',
          spanId: 'span-456',
          traceFlags: 1,
        };
      },
    } as unknown as Span);

    const logger = createLogger({ destination: createDestination(lines) });
    logger.info('with trace');

    const firstLine = lines[0];
    expect(firstLine).toBeDefined();
    const parsed = parseLine(firstLine ?? '');
    expect(parsed.traceId).toBe('trace-123');
    expect(parsed.spanId).toBe('span-456');

    getSpanSpy.mockRestore();
  });

  it('respects configured log level', () => {
    const lines: string[] = [];
    const logger = createLogger({
      logLevel: 'warn',
      destination: createDestination(lines),
    });

    logger.info('suppressed');
    logger.warn('visible');

    expect(lines).toHaveLength(1);
    const firstLine = lines[0];
    expect(firstLine).toBeDefined();
    const parsed = parseLine(firstLine ?? '');
    expect(parsed.level).toBe('warn');
    expect(parsed.msg).toBe('visible');
  });
});
