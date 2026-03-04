import { context, trace } from '@opentelemetry/api';
import pino from 'pino';

import type { ObservabilityConfig } from './types.js';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogMetadata {
  [key: string]: unknown;
}

export interface Logger {
  debug(message: string, meta?: LogMetadata): void;
  info(message: string, meta?: LogMetadata): void;
  warn(message: string, meta?: LogMetadata): void;
  error(message: string, meta?: LogMetadata): void;
}

export interface LoggerConfig extends Partial<ObservabilityConfig> {
  destination?: pino.DestinationStream;
}

function withTraceContext(meta: LogMetadata): LogMetadata {
  const span = trace.getSpan(context.active());
  const spanContext = span?.spanContext();

  if (!spanContext) {
    return meta;
  }

  return {
    ...meta,
    traceId: spanContext.traceId,
    spanId: spanContext.spanId,
  };
}

export function createLogger(config: LoggerConfig = {}): Logger {
  const level = config.logLevel ?? 'info';

  const baseLogger = pino(
    {
      level,
      base: undefined,
      messageKey: 'msg',
      formatters: {
        level(label): { level: string } {
          return { level: label };
        },
      },
      timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
    },
    config.destination,
  );

  return {
    debug(message, meta = {}): void {
      baseLogger.debug(withTraceContext(meta), message);
    },
    info(message, meta = {}): void {
      baseLogger.info(withTraceContext(meta), message);
    },
    warn(message, meta = {}): void {
      baseLogger.warn(withTraceContext(meta), message);
    },
    error(message, meta = {}): void {
      baseLogger.error(withTraceContext(meta), message);
    },
  };
}
