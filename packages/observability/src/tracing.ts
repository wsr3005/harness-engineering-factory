import { context, SpanStatusCode, trace } from '@opentelemetry/api';

import type { Attributes, Span } from '@opentelemetry/api';

const tracer = trace.getTracer('@harness/observability', '0.1.0');

export async function createSpan<T>(name: string, fn: (span: Span) => Promise<T> | T): Promise<T> {
  return tracer.startActiveSpan(name, async (span) => {
    try {
      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error: unknown) {
      recordException(span, error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    } finally {
      span.end();
    }
  });
}

export function withSpanAttributes(span: Span, attrs: Attributes): void {
  span.setAttributes(attrs);
}

export function recordException(span: Span, error: unknown): void {
  if (error instanceof Error) {
    span.recordException(error);
    return;
  }

  span.recordException(new Error(String(error)));
}

export function getActiveTraceId(): string | undefined {
  const activeSpan = trace.getSpan(context.active());
  return activeSpan?.spanContext().traceId;
}
