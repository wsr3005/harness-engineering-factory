export interface AccessibilityNode {
  role: string;
  name: string;
  value?: string;
  description?: string;
  children: AccessibilityNode[];
  states?: Record<string, string | number | boolean>;
  properties?: Record<string, string | number | boolean>;
}

export interface DOMSnapshotResult {
  url: string;
  title: string;
  timestamp: number;
  accessibilityTree: AccessibilityNode;
  nodeCount: number;
}

export interface ScreenshotResult {
  before: Buffer;
  after: Buffer;
  diff?: Buffer;
  beforePath?: string;
  afterPath?: string;
  diffPath?: string;
}

export interface ConsoleEntry {
  type: 'log' | 'info' | 'warn' | 'error' | 'debug';
  text: string;
  timestamp: number;
  location?: string;
  stackTrace?: string;
}

export interface ConsoleCollectionResult {
  entries: ConsoleEntry[];
  errorCount: number;
  warningCount: number;
  totalCount: number;
}

export interface NavigationResult {
  url: string;
  status: number;
  loadTime: number;
  title: string;
}

export interface UIValidationResult {
  snapshot?: DOMSnapshotResult;
  screenshots?: ScreenshotResult;
  console?: ConsoleCollectionResult;
  navigation?: NavigationResult;
  timestamp: number;
  duration: number;
}

export interface ValidationOptions {
  captureSnapshot?: boolean;
  captureScreenshots?: boolean;
  captureConsole?: boolean;
  screenshotDir?: string;
  timeout?: number;
}
