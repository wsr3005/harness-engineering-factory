import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type NodeSdkMockOptions = {
  resource?: { attributes?: Record<string, unknown> };
};

const state = vi.hoisted(() => {
  return {
    start: vi.fn<() => void>(),
    shutdown: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
    ctorOptions: null as NodeSdkMockOptions | null,
    traceExporterConfig: null as Record<string, unknown> | null,
    metricExporterConfig: null as Record<string, unknown> | null,
    metricReaderConfig: null as Record<string, unknown> | null,
  };
});

vi.mock('@opentelemetry/exporter-trace-otlp-proto', () => {
  return {
    OTLPTraceExporter: vi.fn().mockImplementation((config: Record<string, unknown>) => {
      state.traceExporterConfig = config;
      return { config };
    }),
  };
});

vi.mock('@opentelemetry/exporter-metrics-otlp-proto', () => {
  return {
    OTLPMetricExporter: vi.fn().mockImplementation((config: Record<string, unknown>) => {
      state.metricExporterConfig = config;
      return { config };
    }),
  };
});

vi.mock('@opentelemetry/sdk-metrics', () => {
  return {
    PeriodicExportingMetricReader: vi.fn().mockImplementation((config: Record<string, unknown>) => {
      state.metricReaderConfig = config;
      return { config };
    }),
  };
});

vi.mock('@opentelemetry/sdk-node', () => {
  return {
    NodeSDK: vi.fn().mockImplementation((options: NodeSdkMockOptions) => {
      state.ctorOptions = options;
      return {
        start: state.start,
        shutdown: state.shutdown,
      };
    }),
  };
});

describe('initObservability', () => {
  const originalSigtermHandlers = process.listeners('SIGTERM');

  beforeEach(() => {
    state.start.mockClear();
    state.shutdown.mockClear();
    state.ctorOptions = null;
    state.traceExporterConfig = null;
    state.metricExporterConfig = null;
    state.metricReaderConfig = null;
  });

  afterEach(() => {
    const currentHandlers = process.listeners('SIGTERM');
    for (const handler of currentHandlers) {
      process.off('SIGTERM', handler);
    }
    for (const handler of originalSigtermHandlers) {
      process.on('SIGTERM', handler);
    }
  });

  it('starts NodeSDK and configures default OTLP endpoints', async () => {
    const { initObservability } = await import('./sdk.js');

    initObservability({ serviceName: 'svc-a' });

    expect(state.start).toHaveBeenCalledTimes(1);
    expect(state.traceExporterConfig).toEqual({
      url: 'http://localhost:4318/v1/traces',
    });
    expect(state.metricExporterConfig).toEqual({
      url: 'http://localhost:4318/v1/metrics',
    });
    expect(state.metricReaderConfig).toMatchObject({
      exportIntervalMillis: 10000,
    });
  });

  it('sets service resource attributes', async () => {
    const { initObservability } = await import('./sdk.js');

    initObservability({ serviceName: 'svc-b', enabled: false });

    expect(state.ctorOptions?.resource?.attributes?.['service.name']).toBe('svc-b');
    expect(state.ctorOptions?.resource?.attributes?.['service.version']).toBeTypeOf('string');
    expect(state.start).not.toHaveBeenCalled();
  });

  it('registers graceful SIGTERM shutdown', async () => {
    const { initObservability } = await import('./sdk.js');

    initObservability({ serviceName: 'svc-c' });

    process.emit('SIGTERM');
    await Promise.resolve();

    expect(state.shutdown).toHaveBeenCalledTimes(1);
  });
});
