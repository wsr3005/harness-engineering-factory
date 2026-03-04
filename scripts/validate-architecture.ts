import process from 'node:process';

type Violation = {
  rule?: { name?: string };
  from?: string;
  to?: string;
  severity?: string;
};

type CruiseOutput = {
  summary?: {
    error?: number;
    warn?: number;
    violations?: number;
  };
  violations?: Violation[];
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const getCruiseOutput = (value: unknown): CruiseOutput => {
  if (!isObject(value) || !('output' in value) || !isObject(value.output)) {
    return {};
  }

  const output = value.output;
  const summary = isObject(output.summary) ? output.summary : undefined;
  const violations = Array.isArray(output.violations) ? output.violations : undefined;

  return {
    summary: summary
      ? {
          error: typeof summary.error === 'number' ? summary.error : 0,
          warn: typeof summary.warn === 'number' ? summary.warn : 0,
          violations: typeof summary.violations === 'number' ? summary.violations : 0,
        }
      : undefined,
    violations: violations?.filter((item): item is Violation => isObject(item)),
  };
};

async function main(): Promise<void> {
  const dependencyCruiser = await import('dependency-cruiser');
  const configModule = await import('../.dependency-cruiser.cjs');

  if (!('cruise' in dependencyCruiser) || typeof dependencyCruiser.cruise !== 'function') {
    throw new Error('dependency-cruiser API is unavailable');
  }

  const config = 'default' in configModule ? configModule.default : configModule;
  if (!isObject(config)) {
    throw new Error('dependency-cruiser config is invalid');
  }

  const result = dependencyCruiser.cruise(['apps', 'packages', 'scripts'], config);
  const output = getCruiseOutput(result);
  const violations = output.violations ?? [];
  const errorCount = violations.filter((item) => item.severity === 'error').length;

  const payload = {
    valid: errorCount === 0,
    violations: violations.map((item) => ({
      rule: item.rule?.name ?? 'unknown',
      from: item.from ?? '',
      to: item.to ?? '',
      severity: item.severity ?? 'unknown',
    })),
    summary: output.summary ?? {
      error: errorCount,
      warn: violations.filter((item) => item.severity === 'warn').length,
      violations: violations.length,
    },
  };

  process.stdout.write(`${JSON.stringify(payload)}\n`);

  if (!payload.valid) {
    process.exit(1);
  }
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${JSON.stringify({ valid: false, error: message })}\n`);
  process.exit(1);
});
