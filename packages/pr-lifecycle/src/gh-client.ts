import { execFileSync } from 'node:child_process';

import { mapComment, mapPRInfo, parseJson, toGhError } from './gh-helpers.js';
import type { GhError, PRInfo, Result, ReviewComment } from './types.js';

interface CreatePROptions {
  title: string;
  body: string;
  head: string;
  base: string;
  draft?: boolean;
}

interface RequestReviewOptions {
  prNumber: number;
  reviewers: string[];
}

interface CheckItem {
  state?: string;
}

export class GhClient {
  private readonly cwd?: string;

  public constructor(cwd?: string) {
    this.cwd = cwd;
  }

  private execGh(args: string[]): Result<string, GhError> {
    try {
      const output = execFileSync('gh', args, {
        cwd: this.cwd,
        encoding: 'utf8',
      });
      return { ok: true, value: output };
    } catch (error) {
      return { ok: false, error: toGhError(error) };
    }
  }

  public createPR(options: CreatePROptions): Result<PRInfo, GhError> {
    const args = [
      'pr',
      'create',
      '--title',
      options.title,
      '--body',
      options.body,
      '--head',
      options.head,
      '--base',
      options.base,
      '--json',
      'number,url,title,body,state,headRefName,baseRefName,isDraft,labels,reviewDecision',
    ];
    if (options.draft) {
      args.push('--draft');
    }

    const raw = this.execGh(args);
    if (!raw.ok) {
      return raw;
    }

    const parsed = parseJson<{
      number: number;
      url: string;
      title: string;
      body: string;
      state: string;
      headRefName: string;
      baseRefName: string;
      isDraft: boolean;
      labels: Array<{ name: string }>;
      reviewDecision: PRInfo['reviewDecision'];
    }>(raw.value);
    if (!parsed.ok) {
      return parsed;
    }

    return { ok: true, value: mapPRInfo(parsed.value) };
  }

  public getPR(prNumber: number): Result<PRInfo, GhError> {
    const raw = this.execGh([
      'pr',
      'view',
      String(prNumber),
      '--json',
      'number,url,title,body,state,headRefName,baseRefName,isDraft,labels,reviewDecision',
    ]);
    if (!raw.ok) {
      return raw;
    }
    const parsed = parseJson<{
      number: number;
      url: string;
      title: string;
      body: string;
      state: string;
      headRefName: string;
      baseRefName: string;
      isDraft: boolean;
      labels: Array<{ name: string }>;
      reviewDecision: PRInfo['reviewDecision'];
    }>(raw.value);
    if (!parsed.ok) {
      return parsed;
    }
    return { ok: true, value: mapPRInfo(parsed.value) };
  }

  public listPRComments(prNumber: number): Result<ReviewComment[], GhError> {
    const raw = this.execGh(['pr', 'view', String(prNumber), '--json', 'comments,reviews']);
    if (!raw.ok) {
      return raw;
    }

    const parsed = parseJson<{
      comments: Array<{
        id: string;
        body: string;
        author?: { login?: string };
        createdAt: string;
      }>;
      reviews: Array<{
        id: string;
        body: string;
        author?: { login?: string };
        createdAt: string;
        comments?: Array<{
          id: string;
          body: string;
          author?: { login?: string };
          path?: string;
          line?: number;
          createdAt: string;
          isResolved?: boolean;
        }>;
      }>;
    }>(raw.value);
    if (!parsed.ok) {
      return parsed;
    }

    const issueComments = parsed.value.comments.map((comment) =>
      mapComment({ ...comment, isResolved: false }),
    );
    const reviewComments = parsed.value.reviews.flatMap((review) =>
      (review.comments ?? []).map((comment) => mapComment(comment)),
    );
    return { ok: true, value: [...issueComments, ...reviewComments] };
  }

  public addComment(prNumber: number, body: string): Result<{ posted: true }, GhError> {
    const result = this.execGh(['pr', 'comment', String(prNumber), '--body', body]);
    if (!result.ok) {
      return result;
    }
    return { ok: true, value: { posted: true } };
  }

  public requestReview(options: RequestReviewOptions): Result<{ requested: string[] }, GhError> {
    if (options.reviewers.length === 0) {
      return { ok: true, value: { requested: [] } };
    }

    const result = this.execGh([
      'pr',
      'edit',
      String(options.prNumber),
      '--add-reviewer',
      options.reviewers.join(','),
    ]);
    if (!result.ok) {
      return result;
    }
    return { ok: true, value: { requested: options.reviewers } };
  }

  public approvePR(prNumber: number, body: string): Result<{ approved: true }, GhError> {
    const result = this.execGh(['pr', 'review', String(prNumber), '--approve', '--body', body]);
    if (!result.ok) {
      return result;
    }
    return { ok: true, value: { approved: true } };
  }

  public mergePR(prNumber: number): Result<{ merged: true }, GhError> {
    const result = this.execGh([
      'pr',
      'merge',
      String(prNumber),
      '--merge',
      '--delete-branch',
      '--auto',
    ]);
    if (!result.ok) {
      return result;
    }
    return { ok: true, value: { merged: true } };
  }

  public closePR(prNumber: number, comment?: string): Result<{ closed: true }, GhError> {
    const args = ['pr', 'close', String(prNumber)];
    if (comment) {
      args.push('--comment', comment);
    }
    const result = this.execGh(args);
    if (!result.ok) {
      return result;
    }
    return { ok: true, value: { closed: true } };
  }

  public addLabels(prNumber: number, labels: string[]): Result<{ labels: string[] }, GhError> {
    if (labels.length === 0) {
      return { ok: true, value: { labels: [] } };
    }
    const result = this.execGh(['pr', 'edit', String(prNumber), '--add-label', labels.join(',')]);
    if (!result.ok) {
      return result;
    }
    return { ok: true, value: { labels } };
  }

  public getPRChecks(prNumber: number): Result<Array<{ state: string }>, GhError> {
    const raw = this.execGh(['pr', 'checks', String(prNumber), '--json', 'state']);
    if (!raw.ok) {
      return raw;
    }
    const parsed = parseJson<CheckItem[]>(raw.value);
    if (!parsed.ok) {
      return parsed;
    }
    const normalized = parsed.value.map((item) => ({ state: item.state ?? 'UNKNOWN' }));
    return { ok: true, value: normalized };
  }
}
