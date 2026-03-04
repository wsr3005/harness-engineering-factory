export interface RemediationOptions {
  rule: string;
  message: string;
  fix: string;
  example: string;
  docPath: string;
}

export const buildRemediation = (options: RemediationOptions): string => {
  const docs = options.docPath.startsWith('docs/') ? options.docPath : `docs/${options.docPath}`;
  return [
    `[VIOLATION] ${options.rule}: ${options.message}`,
    `REMEDIATION: ${options.fix}`,
    `EXAMPLE: ${options.example}`,
    `DOCS: ${docs}`,
  ].join('\n');
};
