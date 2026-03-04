export interface ObservabilityConfig {
  serviceName: string;
  otlpEndpoint?: string;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  enabled?: boolean;
}

export type QueryResult<T> =
  | {
      status: 'success';
      data: T;
    }
  | {
      status: 'error';
      message: string;
    };

export interface WorktreeInfo {
  name: string;
  path: string;
  branch: string;
}
