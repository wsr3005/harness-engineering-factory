import type {
  AccessibilityNode,
  ConsoleCollectionResult,
  ConsoleEntry,
  UIValidationResult,
} from './types.js';

const serializeResult = (result: UIValidationResult): unknown => {
  return {
    ...result,
    screenshots: result.screenshots
      ? {
          ...result.screenshots,
          before: `<Buffer ${result.screenshots.before.length} bytes>`,
          after: `<Buffer ${result.screenshots.after.length} bytes>`,
          diff: result.screenshots.diff
            ? `<Buffer ${result.screenshots.diff.length} bytes>`
            : undefined,
        }
      : undefined,
  };
};

export const formatForAgent = (result: UIValidationResult): string => {
  return JSON.stringify(serializeResult(result), null, 2);
};

export const formatAccessibilityTree = (tree: AccessibilityNode, indent = 0): string => {
  const linePrefix = '  '.repeat(indent);
  const chunks = [tree.role];
  if (tree.name) {
    chunks.push(`\"${tree.name}\"`);
  }

  if (tree.value) {
    chunks.push(`value=\"${tree.value}\"`);
  }

  if (tree.description) {
    chunks.push(`description=\"${tree.description}\"`);
  }

  const currentLine = `${linePrefix}- ${chunks.join(' ')}`;
  if (tree.children.length === 0) {
    return currentLine;
  }

  const childLines = tree.children.map((child) => formatAccessibilityTree(child, indent + 1));
  return [currentLine, ...childLines].join('\n');
};

const formatEntry = (entry: ConsoleEntry): string => {
  const locationText = entry.location ? ` @ ${entry.location}` : '';
  return `[${entry.type}] ${entry.text}${locationText}`;
};

export const formatConsoleSummary = (collection: ConsoleCollectionResult): string => {
  const header = `Console: total=${collection.totalCount}, errors=${collection.errorCount}, warnings=${collection.warningCount}`;
  if (collection.entries.length === 0) {
    return `${header}\n(no console output captured)`;
  }

  const lines = collection.entries.map((entry) => formatEntry(entry));
  return [header, ...lines].join('\n');
};
