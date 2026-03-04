import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

import type { ScorerResult, Violation } from '../types.js';

function hasExport(content: string): boolean {
  return /\bexport\b/.test(content);
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function scoreDocCoverage(domainPath: string, domain: string): Promise<ScorerResult> {
  const violations: Violation[] = [];
  let score = 0;

  const agentsPath = path.join(domainPath, 'AGENTS.md');
  if (await pathExists(agentsPath)) {
    score += 30;
  } else {
    violations.push({
      file: agentsPath,
      rule: 'docs.agents.missing',
      message: 'Missing AGENTS.md in domain root',
      severity: 'warning',
    });
  }

  let layerDirectories: string[] = [];
  try {
    const entries = await readdir(domainPath, { withFileTypes: true });
    layerDirectories = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => path.join(domainPath, entry.name));
  } catch {
    layerDirectories = [];
  }

  if (layerDirectories.length === 0) {
    violations.push({
      file: domainPath,
      rule: 'docs.layers.missing',
      message: 'No layer directories found in domain',
      severity: 'warning',
    });
  } else {
    let completeLayers = 0;
    for (const layerPath of layerDirectories) {
      const indexPath = path.join(layerPath, 'index.ts');
      const exists = await pathExists(indexPath);
      if (!exists) {
        violations.push({
          file: indexPath,
          rule: 'docs.layer-index.missing',
          message: `Missing index.ts for layer ${path.basename(layerPath)}`,
          severity: 'warning',
        });
        continue;
      }

      try {
        const content = await readFile(indexPath, 'utf8');
        if (hasExport(content)) {
          completeLayers += 1;
        } else {
          violations.push({
            file: indexPath,
            rule: 'docs.layer-index.no-export',
            message: `Layer ${path.basename(layerPath)} index.ts does not export symbols`,
            severity: 'warning',
          });
        }
      } catch {
        violations.push({
          file: indexPath,
          rule: 'docs.layer-index.unreadable',
          message: `Unable to read index.ts for layer ${path.basename(layerPath)}`,
          severity: 'warning',
        });
      }
    }

    score += Math.round((completeLayers / layerDirectories.length) * 40);
  }

  const productSpecPath = path.join(process.cwd(), 'docs', 'product-specs', `${domain}-domain.md`);
  if (await pathExists(productSpecPath)) {
    score += 30;
  } else {
    violations.push({
      file: productSpecPath,
      rule: 'docs.product-spec.missing',
      message: `Missing product spec for ${domain}`,
      severity: 'warning',
    });
  }

  return {
    name: 'doc-coverage',
    score,
    weight: 0.25,
    details: `Documentation score for ${domain}: ${score}/100`,
    violations,
  };
}
