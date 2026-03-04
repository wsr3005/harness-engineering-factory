import type { CleanupPR, Deviation, DocGardenResult } from './types.js';

const asDateToken = (date: Date): string => date.toISOString().slice(0, 10);

export const generateCleanupPR = (
  deviations: Deviation[],
  docIssues: DocGardenResult,
): CleanupPR => {
  const grouped = deviations.reduce<Record<string, Deviation[]>>((acc, deviation) => {
    const current = acc[deviation.principle] ?? [];
    current.push(deviation);
    acc[deviation.principle] = current;
    return acc;
  }, {});

  const files = [
    ...new Set([
      ...deviations.map((deviation) => deviation.file),
      ...docIssues.staleDocuments.map((document) => document.file),
    ]),
  ].sort((left, right) => left.localeCompare(right));

  const tableRows = Object.entries(grouped)
    .sort((left, right) => right[1].length - left[1].length)
    .map(([principle, entries]) => `| ${principle} | ${entries.length} |`)
    .join('\n');

  const details = Object.entries(grouped)
    .sort((left, right) => right[1].length - left[1].length)
    .map(([principle, entries]) => {
      const sample = entries
        .slice(0, 5)
        .map(
          (entry) => `- ${entry.file}${entry.line ? `:${entry.line}` : ''} - ${entry.description}`,
        )
        .join('\n');
      return `### ${principle}\n${sample}`;
    })
    .join('\n\n');

  const docDetails = docIssues.staleDocuments.length
    ? docIssues.staleDocuments
        .map(
          (document) =>
            `- ${document.file}: ${document.brokenLinks
              .map((link) => `${link.targetPath} (line ${link.lineNumber})`)
              .join(', ')}`,
        )
        .join('\n')
    : '- No broken documentation links detected.';

  return {
    title: `chore: cleanup ${deviations.length} golden principle deviations`,
    branch: `cleanup/entropy-scan-${asDateToken(new Date())}`,
    files,
    deviations,
    body: [
      '## Summary',
      `Detected ${deviations.length} deviations across ${Object.keys(grouped).length} principles.`,
      '',
      '## Deviation Counts',
      '| Principle | Count |',
      '| --- | ---: |',
      tableRows || '| none | 0 |',
      '',
      '## Deviation Details',
      details || 'No deviations found.',
      '',
      '## Documentation Issues',
      `- Files with broken links: ${docIssues.staleDocuments.length}`,
      `- Total broken links: ${docIssues.totalBrokenLinks}`,
      '- Broken links:',
      docDetails,
    ].join('\n'),
  };
};
