import { beforeEach, describe, expect, it, vi } from 'vitest';

const { execFileSyncMock } = vi.hoisted(() => ({
  execFileSyncMock: vi.fn(),
}));

vi.mock('node:child_process', () => ({
  execFileSync: execFileSyncMock,
}));

import { GhClient } from './gh-client.js';

describe('GhClient', () => {
  beforeEach(() => {
    execFileSyncMock.mockReset();
  });

  it('creates PR and maps fields', () => {
    execFileSyncMock.mockReturnValue(
      JSON.stringify({
        number: 42,
        url: 'https://github.com/org/repo/pull/42',
        title: 'Test PR',
        body: 'Body',
        state: 'OPEN',
        headRefName: 'agent/test',
        baseRefName: 'main',
        isDraft: false,
        labels: [{ name: 'automation' }],
        reviewDecision: 'REVIEW_REQUIRED',
      }),
    );

    const client = new GhClient();
    const result = client.createPR({
      title: 'Test PR',
      body: 'Body',
      head: 'agent/test',
      base: 'main',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.number).toBe(42);
    expect(result.value.state).toBe('open');
    expect(result.value.labels).toEqual(['automation']);
  });

  it('returns parse failure on invalid JSON', () => {
    execFileSyncMock.mockReturnValue('not-json');
    const client = new GhClient();

    const result = client.getPR(12);
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error.code).toBe('JSON_PARSE_FAILED');
  });

  it('returns GH_NOT_FOUND when gh missing', () => {
    const missingError = Object.assign(new Error('spawn gh ENOENT'), { code: 'ENOENT' });
    execFileSyncMock.mockImplementation(() => {
      throw missingError;
    });

    const client = new GhClient();
    const result = client.getPR(1);
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error.code).toBe('GH_NOT_FOUND');
  });

  it('lists and flattens review comments', () => {
    execFileSyncMock.mockReturnValue(
      JSON.stringify({
        comments: [
          {
            id: 'issue-1',
            body: 'FYI',
            author: { login: 'alice' },
            createdAt: '2025-01-01T00:00:00Z',
          },
        ],
        reviews: [
          {
            id: 'review-1',
            body: 'Looks good',
            author: { login: 'bob' },
            createdAt: '2025-01-02T00:00:00Z',
            comments: [
              {
                id: 'review-comment-1',
                body: 'Please change',
                author: { login: 'bob' },
                path: 'src/a.ts',
                line: 10,
                createdAt: '2025-01-02T00:00:00Z',
                isResolved: false,
              },
            ],
          },
        ],
      }),
    );

    const client = new GhClient();
    const result = client.listPRComments(10);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value).toHaveLength(2);
    expect(result.value[1]?.path).toBe('src/a.ts');
  });

  it('addComment returns posted true', () => {
    execFileSyncMock.mockReturnValue('');
    const client = new GhClient();

    const result = client.addComment(99, 'hello');
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.posted).toBe(true);
  });

  it('requestReview returns no-op when no reviewers', () => {
    const client = new GhClient();
    const result = client.requestReview({ prNumber: 1, reviewers: [] });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.requested).toEqual([]);
    expect(execFileSyncMock).not.toHaveBeenCalled();
  });

  it('addLabels no-op when labels empty', () => {
    const client = new GhClient();
    const result = client.addLabels(1, []);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.labels).toEqual([]);
  });

  it('maps checks with unknown state fallback', () => {
    execFileSyncMock.mockReturnValue(JSON.stringify([{ state: 'SUCCESS' }, {}]));
    const client = new GhClient();
    const result = client.getPRChecks(8);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value).toEqual([{ state: 'SUCCESS' }, { state: 'UNKNOWN' }]);
  });
});
