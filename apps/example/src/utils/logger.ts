type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}

export interface LoggerContext {
  service: string;
}

const emit = (
  level: LogLevel,
  message: string,
  service: string,
  meta: Record<string, unknown> | undefined,
): void => {
  const payload = {
    ts: new Date().toISOString(),
    level,
    service,
    message,
    ...(meta ?? {}),
  };
  process.stdout.write(`${JSON.stringify(payload)}\n`);
};

export const createLogger = (context: LoggerContext): Logger => ({
  debug: (message, meta) => emit('debug', message, context.service, meta),
  info: (message, meta) => emit('info', message, context.service, meta),
  warn: (message, meta) => emit('warn', message, context.service, meta),
  error: (message, meta) => emit('error', message, context.service, meta),
});
