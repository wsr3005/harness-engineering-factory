import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Page } from 'playwright';

import { captureDOMSnapshot } from './dom-snapshot.js';

const getAccessibilityTree = vi.fn();

vi.mock('./cdp-client.js', () => {
  return {
    createCDPClient: () => ({
      getAccessibilityTree,
    }),
  };
});

interface MockPage {
  url: () => string;
  title: () => Promise<string>;
}

const createPage = (): MockPage => {
  return {
    url: () => 'https://example.test',
    title: async () => 'Example',
  };
};

describe('captureDOMSnapshot', () => {
  beforeEach(() => {
    getAccessibilityTree.mockReset();
  });

  it('builds a rooted accessibility tree', async () => {
    getAccessibilityTree.mockResolvedValue([
      {
        nodeId: '1',
        role: { value: 'RootWebArea' },
        name: { value: 'Root' },
        childIds: ['2'],
      },
      {
        nodeId: '2',
        role: { value: 'button' },
        name: { value: 'Submit' },
      },
    ]);

    const result = await captureDOMSnapshot(createPage() as unknown as Page);
    expect(result.accessibilityTree.role).toBe('RootWebArea');
    expect(result.accessibilityTree.children[0]?.role).toBe('button');
    expect(result.nodeCount).toBe(2);
  });

  it('filters ignored invisible nodes', async () => {
    getAccessibilityTree.mockResolvedValue([
      {
        nodeId: '1',
        role: { value: 'RootWebArea' },
        childIds: ['2', '3'],
      },
      {
        nodeId: '2',
        ignored: true,
        role: { value: 'generic' },
        name: { value: 'Hidden' },
      },
      {
        nodeId: '3',
        role: { value: 'heading' },
        name: { value: 'Visible' },
      },
    ]);

    const result = await captureDOMSnapshot(createPage() as unknown as Page);
    expect(result.accessibilityTree.children).toHaveLength(1);
    expect(result.accessibilityTree.children[0]?.name).toBe('Visible');
  });

  it('filters nodes marked hidden property', async () => {
    getAccessibilityTree.mockResolvedValue([
      {
        nodeId: '1',
        role: { value: 'RootWebArea' },
        childIds: ['2'],
      },
      {
        nodeId: '2',
        role: { value: 'generic' },
        name: { value: 'Hidden' },
        properties: [{ name: 'hidden', value: { value: true } }],
      },
    ]);

    const result = await captureDOMSnapshot(createPage() as unknown as Page);
    expect(result.accessibilityTree.children).toHaveLength(0);
    expect(result.nodeCount).toBe(1);
  });

  it('prefers RootWebArea as tree root', async () => {
    getAccessibilityTree.mockResolvedValue([
      {
        nodeId: '10',
        role: { value: 'generic' },
        childIds: ['11'],
      },
      {
        nodeId: '11',
        role: { value: 'RootWebArea' },
        name: { value: 'Actual Root' },
      },
    ]);

    const result = await captureDOMSnapshot(createPage() as unknown as Page);
    expect(result.accessibilityTree.role).toBe('RootWebArea');
    expect(result.accessibilityTree.name).toBe('Actual Root');
  });

  it('returns fallback tree when cdp is empty', async () => {
    getAccessibilityTree.mockResolvedValue([]);
    const result = await captureDOMSnapshot(createPage() as unknown as Page);
    expect(result.accessibilityTree.role).toBe('RootWebArea');
    expect(result.nodeCount).toBe(1);
  });
});
