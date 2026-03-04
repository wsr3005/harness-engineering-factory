import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import {
  SEMRESATTRS_SERVICE_NAME,
  SEMRESATTRS_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';

import type { ObservabilityConfig } from './types.js';

const DEFAULT_OTLP_ENDPOINT = 'http://localhost:4318';
const DEFAULT_SERVICE_VERSION = '0.1.0';

export function initObservability(config: ObservabilityConfig): NodeSDK {
  const endpoint = config.otlpEndpoint ?? DEFAULT_OTLP_ENDPOINT;
  const isEnabled = config.enabled ?? true;

  const resource = resourceFromAttributes({
    [SEMRESATTRS_SERVICE_NAME]: config.serviceName,
    [SEMRESATTRS_SERVICE_VERSION]: process.env.npm_package_version ?? DEFAULT_SERVICE_VERSION,
  });

  const traceExporter = new OTLPTraceExporter({
    url: `${endpoint}/v1/traces`,
  });

  const metricExporter = new OTLPMetricExporter({
    url: `${endpoint}/v1/metrics`,
  });

  const metricReader = new PeriodicExportingMetricReader({
    exporter: metricExporter,
    exportIntervalMillis: 10000,
  });

  const sdk = new NodeSDK({
    resource,
    traceExporter,
    metricReader,
  });

  if (isEnabled) {
    void Promise.resolve(sdk.start());
  }

  process.once('SIGTERM', () => {
    void Promise.resolve(sdk.shutdown());
  });

  return sdk;
}
