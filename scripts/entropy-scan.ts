import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { gardenDocuments, generateCleanupPR, scanForDeviations } from '@harness/quality';

type EntropyOutput = {
  scan: Awaited<ReturnType<typeof scanForDeviations>>;
  docs: Awaited<ReturnType<typeof gardenDocuments>>;
  cleanupPR?: ReturnType<typeof generateCleanupPR>;
};

const main = async (): Promise<void> => {
  const scan = await scanForDeviations('.');
  const docs = await gardenDocuments('./docs', '.');
  const shouldGeneratePR = process.argv.includes('--generate-pr');

  const output: EntropyOutput = {
    scan,
    docs,
    cleanupPR: shouldGeneratePR ? generateCleanupPR(scan.deviations, docs) : undefined,
  };

  const generatedDir = path.join('docs', 'generated');
  await mkdir(generatedDir, { recursive: true });
  await writeFile(
    path.join(generatedDir, 'entropy-scan.json'),
    JSON.stringify(output, null, 2),
    'utf8',
  );

  console.log('Entropy scan complete');
  console.log(`- Deviations: ${scan.summary.total}`);
  console.log(`- Broken doc links: ${docs.totalBrokenLinks}`);
  console.log(`- Files checked: ${docs.totalFilesChecked}`);
  if (shouldGeneratePR && output.cleanupPR) {
    console.log(`- Suggested branch: ${output.cleanupPR.branch}`);
    console.log(`- Suggested title: ${output.cleanupPR.title}`);
  }
};

void main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Entropy scan failed: ${message}`);
  })
  .finally(() => {
    process.exitCode = 0;
  });
