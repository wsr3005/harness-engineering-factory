import { metrics } from '@opentelemetry/api';

import type { Attributes } from '@opentelemetry/api';

const meter = metrics.getMeter('@harness/observability', '0.1.0');

export interface CounterMetric {
  add(value: number, attributes?: Attributes): void;
}

export interface HistogramMetric {
  record(value: number, attributes?: Attributes): void;
}

export interface GaugeMetric {
  set(value: number, attributes?: Attributes): void;
}

export function createCounter(name: string, description: string): CounterMetric {
  const counter = meter.createCounter(name, { description });

  return {
    add(value, attributes): void {
      counter.add(value, attributes);
    },
  };
}

export function createHistogram(
  name: string,
  description: string,
  boundaries?: number[],
): HistogramMetric {
  const histogram = meter.createHistogram(name, {
    description,
    advice: boundaries ? { explicitBucketBoundaries: boundaries } : undefined,
  });

  return {
    record(value, attributes): void {
      histogram.record(value, attributes);
    },
  };
}

export function createGauge(name: string, description: string): GaugeMetric {
  let currentValue = 0;
  let currentAttributes: Attributes | undefined;

  const gauge = meter.createObservableGauge(name, {
    description,
  });

  gauge.addCallback((observableResult) => {
    observableResult.observe(currentValue, currentAttributes);
  });

  return {
    set(value, attributes): void {
      currentValue = value;
      currentAttributes = attributes;
    },
  };
}
