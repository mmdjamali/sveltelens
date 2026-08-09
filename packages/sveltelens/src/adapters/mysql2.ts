import type { Connection, Pool } from 'mysql2/promise';
import { wrapPromiseQuery } from './shared.js';

const TIMED_METHODS = ['query', 'execute'] as const;

/**
 * Wraps a `mysql2/promise` `Pool` or `Connection` so every `query()`/`execute()`
 * call is timed and recorded: `mysql2(await createPool(...))`.
 *
 * Only the promise API (`mysql2/promise`) is supported — the callback-style
 * `mysql2` client isn't wrapped, since it has no return value to attach timing to.
 */
export function mysql2<T extends Pool | Connection>(client: T): T {
  for (const method of TIMED_METHODS) {
    const original = client[method].bind(client) as (...args: unknown[]) => unknown;
    (client[method] as unknown) = wrapPromiseQuery(original, parseArgs);
  }
  return client;
}

function parseArgs(args: unknown[]): { sql: string; params: unknown[] } | null {
  const [first, second] = args;
  if (typeof first === 'string') {
    return { sql: first, params: Array.isArray(second) ? second : [] };
  }
  if (first && typeof first === 'object' && 'sql' in first) {
    const options = first as { sql: string; values?: unknown };
    const params = Array.isArray(second)
      ? second
      : Array.isArray(options.values)
        ? options.values
        : [];
    return { sql: options.sql, params };
  }
  return null;
}
