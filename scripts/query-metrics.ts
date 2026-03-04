import process from 'node:process';

type QueryResult<T> = { status: 'success'; data: T } | { status: 'error'; message: string };

type Args = {
  query?: string;
  time?: string;
  from?: string;
  to?: string;
  help: boolean;
};

function print(result: QueryResult<unknown>): void {
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

function helpText(): string {
  return [
    'Usage:',
    '  npx tsx scripts/query-metrics.ts --query <PromQL> --time <ISO>',
    '  npx tsx scripts/query-metrics.ts --query <PromQL> --from <ISO> --to <ISO>',
    '',
    'Options:',
    '  --query   PromQL query expression',
    '  --time    Instant query time in ISO-8601 format',
    '  --from    Range query start in ISO-8601 format',
    '  --to      Range query end in ISO-8601 format',
    '  --help    Show this help message',
  ].join('\n');
}

function parseArgs(argv: string[]): Args {
  const args: Args = { help: false };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const next = argv[index + 1];

    if (token === '--help' || token === '-h') {
      args.help = true;
    } else if (token === '--query' && next) {
      args.query = next;
      index += 1;
    } else if (token === '--time' && next) {
      args.time = next;
      index += 1;
    } else if (token === '--from' && next) {
      args.from = next;
      index += 1;
    } else if (token === '--to' && next) {
      args.to = next;
      index += 1;
    }
  }

  return args;
}

function buildUrl(baseUrl: string, args: Required<Pick<Args, 'query'>> & Args): URL {
  if (args.time) {
    const instantUrl = new URL('/api/v1/query', baseUrl);
    instantUrl.searchParams.set('query', args.query);
    instantUrl.searchParams.set('time', args.time);
    return instantUrl;
  }

  const rangeUrl = new URL('/api/v1/query_range', baseUrl);
  rangeUrl.searchParams.set('query', args.query);
  rangeUrl.searchParams.set('start', args.from ?? '');
  rangeUrl.searchParams.set('end', args.to ?? '');
  rangeUrl.searchParams.set('step', process.env.VICTORIA_METRICS_STEP ?? '30s');
  return rangeUrl;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write(`${helpText()}\n`);
    return;
  }

  const isInstant = Boolean(args.time);
  const isRange = Boolean(args.from && args.to);

  if (!args.query || (!isInstant && !isRange)) {
    print({
      status: 'error',
      message: 'missing_required_args',
    });
    process.exitCode = 1;
    return;
  }

  const baseUrl = process.env.VICTORIA_METRICS_URL ?? 'http://localhost:8428';
  const url = buildUrl(baseUrl, args);

  try {
    const response = await fetch(url);
    const text = await response.text();
    const data: unknown = text.length > 0 ? JSON.parse(text) : null;

    if (!response.ok) {
      print({
        status: 'error',
        message: `query_failed_${response.status}`,
      });
      process.exitCode = 1;
      return;
    }

    print({
      status: 'success',
      data: {
        source: baseUrl,
        mode: isInstant ? 'instant' : 'range',
        result: data,
      },
    });
  } catch (error: unknown) {
    print({
      status: 'error',
      message: error instanceof Error ? error.message : String(error),
    });
    process.exitCode = 1;
  }
}

void main();
