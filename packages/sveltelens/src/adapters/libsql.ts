import type { Client } from '@libsql/client';
import { wrapPromiseQuery } from './shared.js';

/**
 * Wraps a `@libsql/client` `Client` (libSQL / Turso) so every `execute()` call
 * is timed and recorded: `libsql(createClient({ url }))`.
 *
 * `batch()` and interactive transactions aren't wrapped — only the single-statement
 * `execute(sql, args?)` / `execute({ sql, args })` forms.
 */
export function libsql<T extends Client>(client: T): T {
  const originalExecute = client.execute.bind(client) as (...args: unknown[]) => unknown;
  (client.execute as unknown) = wrapPromiseQuery(originalExecute, parseArgs);
  return client;
}

function parseArgs(args: unknown[]): { sql: string; params: unknown[] } | null {
  const [first, second] = args;
  if (typeof first === 'string') {
    return { sql: first, params: Array.isArray(second) ? second : [] };
  }
  if (first && typeof first === 'object' && 'sql' in first) {
    const stmt = first as { sql: string; args?: unknown[] | Record<string, unknown> };
    return { sql: stmt.sql, params: Array.isArray(stmt.args) ? stmt.args : [] };
  }
  return null;
}
