import process from 'node:process';

type QueryResult<T> = { status: 'success'; data: T } | { status: 'error'; message: string };

type Args = {
  query?: string;
  from?: string;
  to?: string;
  help: boolean;
};

function print(result: QueryResult<unknown>): void {
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

function helpText(): string {
  return [
    'Usage: npx tsx scripts/query-logs.ts --query <LogQL> --from <ISO> --to <ISO>',
    '',
    'Options:',
    '  --query   LogQL query expression',
    '  --from    Start time in ISO-8601 format',
    '  --to      End time in ISO-8601 format',
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

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write(`${helpText()}\n`);
    return;
  }

  if (!args.query || !args.from || !args.to) {
    print({
      status: 'error',
      message: 'missing_required_args',
    });
    process.exitCode = 1;
    return;
  }

  const baseUrl = process.env.VICTORIA_LOGS_URL ?? 'http://localhost:9428';
  const url = new URL('/select/logsql/query', baseUrl);
  url.searchParams.set('query', args.query);
  url.searchParams.set('start', args.from);
  url.searchParams.set('end', args.to);

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
        query: args.query,
        from: args.from,
        to: args.to,
        source: baseUrl,
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
