import type { Page } from 'playwright';

import { createCDPClient, type AXNode } from './cdp-client.js';
import type { AccessibilityNode, DOMSnapshotResult } from './types.js';

interface AXPropertyValue {
  value?: string | number | boolean;
}

interface AXProperty {
  name?: string;
  value?: AXPropertyValue;
}

interface AXNodeRecord {
  raw: AXNode;
  children: AXNodeRecord[];
}

const asText = (value?: string | number | boolean): string | undefined => {
  if (value === undefined) {
    return undefined;
  }

  return String(value);
};

const propMap = (
  properties?: AXProperty[],
): Record<string, string | number | boolean> | undefined => {
  if (!properties || properties.length === 0) {
    return undefined;
  }

  const mapped: Record<string, string | number | boolean> = {};
  for (const property of properties) {
    if (!property.name) {
      continue;
    }

    const propertyValue = property.value?.value;
    if (propertyValue !== undefined) {
      mapped[property.name] = propertyValue;
    }
  }

  return Object.keys(mapped).length > 0 ? mapped : undefined;
};

const isInvisible = (node: AXNode): boolean => {
  if (node.ignored) {
    return true;
  }

  const properties = node.properties;
  if (!properties) {
    return false;
  }

  return properties.some((property) => {
    if (!property.name) {
      return false;
    }

    const name = property.name.toLowerCase();
    const value = property.value?.value;
    return (name === 'hidden' || name === 'invisible') && value === true;
  });
};

const toAccessibilityTree = (record: AXNodeRecord): AccessibilityNode | null => {
  const visibleChildren = record.children
    .map((child) => toAccessibilityTree(child))
    .filter((child): child is AccessibilityNode => child !== null);

  if (isInvisible(record.raw) && visibleChildren.length === 0) {
    return null;
  }

  const role = asText(record.raw.role?.value) ?? 'unknown';
  const name = asText(record.raw.name?.value) ?? '';
  const value = asText(record.raw.value?.value);
  const description = asText(record.raw.description?.value);
  const properties = propMap(record.raw.properties as AXProperty[] | undefined);

  return {
    role,
    name,
    value,
    description,
    children: visibleChildren,
    properties,
  };
};

const countNodes = (node: AccessibilityNode): number => {
  return 1 + node.children.reduce((sum, child) => sum + countNodes(child), 0);
};

const buildTreeRecords = (nodes: AXNode[]): AXNodeRecord[] => {
  const records = new Map<string, AXNodeRecord>();
  for (const node of nodes) {
    records.set(node.nodeId, { raw: node, children: [] });
  }

  const childIds = new Set<string>();
  for (const node of nodes) {
    const parent = records.get(node.nodeId);
    if (!parent || !node.childIds) {
      continue;
    }

    for (const childId of node.childIds) {
      const child = records.get(childId);
      if (!child) {
        continue;
      }

      parent.children.push(child);
      childIds.add(childId);
    }
  }

  const roots: AXNodeRecord[] = [];
  for (const node of nodes) {
    if (!childIds.has(node.nodeId)) {
      const record = records.get(node.nodeId);
      if (record) {
        roots.push(record);
      }
    }
  }

  return roots;
};

const findRecordByRole = (records: AXNodeRecord[], role: string): AXNodeRecord | undefined => {
  for (const record of records) {
    if (record.raw.role?.value === role) {
      return record;
    }

    const fromChild = findRecordByRole(record.children, role);
    if (fromChild) {
      return fromChild;
    }
  }

  return undefined;
};

export const captureDOMSnapshot = async (page: Page): Promise<DOMSnapshotResult> => {
  const cdp = createCDPClient(page);
  const axNodes = await cdp.getAccessibilityTree();
  const records = buildTreeRecords(axNodes);

  const preferredRoot = findRecordByRole(records, 'RootWebArea') ?? records[0];
  const fallbackRoot: AccessibilityNode = {
    role: 'RootWebArea',
    name: '',
    children: [],
  };

  const accessibilityTree = preferredRoot
    ? (toAccessibilityTree(preferredRoot) ?? fallbackRoot)
    : fallbackRoot;

  return {
    url: page.url(),
    title: await page.title(),
    timestamp: Date.now(),
    accessibilityTree,
    nodeCount: countNodes(accessibilityTree),
  };
};
