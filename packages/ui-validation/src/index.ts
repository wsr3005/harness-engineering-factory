export type {
  AccessibilityNode,
  ConsoleCollectionResult,
  ConsoleEntry,
  DOMSnapshotResult,
  NavigationResult,
  ScreenshotResult,
  UIValidationResult,
  ValidationOptions,
} from './types.js';

export { createCDPClient } from './cdp-client.js';
export { captureDOMSnapshot } from './dom-snapshot.js';
export { captureBeforeAfter } from './screenshot.js';
export { createConsoleCollector } from './console-collector.js';
export { getCurrentUrl, getPageTitle, navigateTo, waitForSelector } from './navigation.js';
export {
  clickElement,
  fillInput,
  selectOption,
  submitForm,
  validateUIState,
} from './interaction.js';
export { formatAccessibilityTree, formatConsoleSummary, formatForAgent } from './formatter.js';
