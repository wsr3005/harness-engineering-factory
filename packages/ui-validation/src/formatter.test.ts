import { describe, expect, it } from 'vitest';

import { formatAccessibilityTree, formatConsoleSummary, formatForAgent } from './formatter.js';
import type { AccessibilityNode, UIValidationResult } from './types.js';

const tree: AccessibilityNode = {
  role: 'RootWebArea',
  name: 'Homepage',
  children: [
    {
      role: 'heading',
      name: 'Welcome',
      children: [],
    },
    {
      role: 'button',
      name: 'Continue',
      value: 'enabled',
      children: [],
    },
  ],
};

describe('formatter', () => {
  it('produces valid JSON for agent output', () => {
    const result: UIValidationResult = {
      timestamp: 100,
      duration: 20,
    };

    const formatted = formatForAgent(result);
    expect(() => JSON.parse(formatted)).not.toThrow();
    expect(JSON.parse(formatted)).toMatchObject({ timestamp: 100, duration: 20 });
  });

  it('serializes screenshot buffers as friendly tokens', () => {
    const result: UIValidationResult = {
      timestamp: 1,
      duration: 1,
      screenshots: {
        before: Buffer.from('abc'),
        after: Buffer.from('abcd'),
      },
    };

    const formatted = formatForAgent(result);
    const parsed = JSON.parse(formatted) as { screenshots: { before: string; after: string } };
    expect(parsed.screenshots.before).toBe('<Buffer 3 bytes>');
    expect(parsed.screenshots.after).toBe('<Buffer 4 bytes>');
  });

  it('formats accessibility tree as indented text', () => {
    const text = formatAccessibilityTree(tree);
    expect(text).toContain('- RootWebArea "Homepage"');
    expect(text).toContain('  - heading "Welcome"');
    expect(text).toContain('  - button "Continue" value="enabled"');
  });

  it('formats console summary with counts and entries', () => {
    const summary = formatConsoleSummary({
      entries: [
        { type: 'warn', text: 'deprecated', timestamp: 1 },
        { type: 'error', text: 'failed', timestamp: 2, location: 'file.ts:1:1' },
      ],
      errorCount: 1,
      warningCount: 1,
      totalCount: 2,
    });

    expect(summary).toContain('total=2, errors=1, warnings=1');
    expect(summary).toContain('[warn] deprecated');
    expect(summary).toContain('[error] failed @ file.ts:1:1');
  });
});
