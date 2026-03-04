import process from 'node:process';

type QueryResult<T> = { status: 'success'; data: T } | { status: 'error'; message: string };

type Args = {
  traceId?: string;
  query?: string;
  help: boolean;
};

function print(result: QueryResult<unknown>): void {
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

function helpText(): string {
  return [
    'Usage:',
    '  npx tsx scripts/query-traces.ts --trace-id <id>',
    '  npx tsx scripts/query-traces.ts --query <search>',
    '',
    'Options:',
    '  --trace-id  Trace identifier to fetch',
    '  --query     Trace search query expression',
    '  --help      Show this help message',
  ].join('\n');
}

function parseArgs(argv: string[]): Args {
  const args: Args = { help: false };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const next = argv[index + 1];

    if (token === '--help' || token === '-h') {
      args.help = true;
    } else if (token === '--trace-id' && next) {
      args.traceId = next;
      index += 1;
    } else if (token === '--query' && next) {
      args.query = next;
      index += 1;
    }
  }

  return args;
}

function buildUrl(baseUrl: string, args: Args): URL {
  if (args.traceId) {
    const traceUrl = new URL('/api/v1/trace', baseUrl);
    traceUrl.searchParams.set('trace_id', args.traceId);
    return traceUrl;
  }

  const searchUrl = new URL('/api/v1/search', baseUrl);
  searchUrl.searchParams.set('query', args.query ?? '');
  return searchUrl;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write(`${helpText()}\n`);
    return;
  }

  if (!args.traceId && !args.query) {
    print({
      status: 'error',
      message: 'missing_required_args',
    });
    process.exitCode = 1;
    return;
  }

  const baseUrl = process.env.VICTORIA_TRACES_URL ?? 'http://localhost:8429';
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
        mode: args.traceId ? 'trace-id' : 'search',
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
