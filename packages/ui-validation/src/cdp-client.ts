import type { CDPSession, Page } from 'playwright';

interface AXValue {
  value?: string | number | boolean;
}

interface AXProperty {
  name?: string;
  value?: AXValue;
}

export interface AXNode {
  nodeId: string;
  childIds?: string[];
  ignored?: boolean;
  role?: AXValue;
  name?: AXValue;
  value?: AXValue;
  description?: AXValue;
  properties?: AXProperty[];
}

interface AXTreeResponse {
  nodes: AXNode[];
}

export interface CDPClient {
  getAccessibilityTree: () => Promise<AXNode[]>;
  captureScreenshot: () => Promise<Buffer>;
  enableConsole: () => Promise<void>;
  disableConsole: () => Promise<void>;
}

const isAXTreeResponse = (value: unknown): value is AXTreeResponse => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const maybe = value as { nodes?: unknown };
  return Array.isArray(maybe.nodes);
};

export const createCDPClient = (page: Page): CDPClient => {
  let sessionPromise: Promise<CDPSession> | undefined;

  const getSession = (): Promise<CDPSession> => {
    if (!sessionPromise) {
      sessionPromise = page.context().newCDPSession(page);
    }

    return sessionPromise;
  };

  return {
    async getAccessibilityTree() {
      const session = await getSession();
      const response = await session.send('Accessibility.getFullAXTree');
      if (!isAXTreeResponse(response)) {
        return [];
      }

      return response.nodes;
    },
    async captureScreenshot() {
      return page.screenshot();
    },
    async enableConsole() {
      const session = await getSession();
      await session.send('Runtime.enable');
    },
    async disableConsole() {
      const session = await getSession();
      await session.send('Runtime.disable');
    },
  };
};
