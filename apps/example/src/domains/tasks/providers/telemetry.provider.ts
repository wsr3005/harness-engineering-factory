export interface TelemetryProvider {
  record(event: string, attributes?: Record<string, string | number | boolean>): void;
}

export class NoopTelemetryProvider implements TelemetryProvider {
  record(_event: string, _attributes?: Record<string, string | number | boolean>): void {
    return;
  }
}
