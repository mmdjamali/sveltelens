import type { Client, Pool, QueryConfig } from 'pg';
import { recordQuery } from '../record.js';

/**
 * Wraps a node-postgres `Pool` or `Client` so every `query()` call is timed and
 * recorded: `pg(new Pool())`.
 *
 * Only the promise-returning call forms are covered — `query(text, params?)` and
 * `query(config)` — since that's how virtually everything built on top of `pg`
 * (Drizzle, Kysely, raw SQL) calls it. The callback form and query streams
 * (`pg-query-stream`) pass through unwrapped rather than being misrecorded.
 */
export function pg<T extends Pool | Client>(client: T): T {
  const originalQuery = client.query.bind(client) as (...args: unknown[]) => unknown;

  (client.query as unknown) = (...args: unknown[]) => {
    const parsed = parseArgs(args);
    const start = performance.now();
    const result = originalQuery(...args);
    if (!parsed || typeof (result as Promise<unknown>)?.then !== 'function') return result;

    return (result as Promise<unknown>).then(
      (value) => {
        recordQuery({ ...parsed, durationMs: Math.round(performance.now() - start) });
        return value;
      },
      (err) => {
        recordQuery({ ...parsed, durationMs: Math.round(performance.now() - start) });
        throw err;
      },
    );
  };

  return client;
}

function parseArgs(args: unknown[]): { sql: string; params: unknown[] } | null {
  const [first, second] = args;
  if (typeof first === 'string') {
    return { sql: first, params: Array.isArray(second) ? second : [] };
  }
  if (first && typeof first === 'object' && 'text' in first) {
    const config = first as QueryConfig;
    return { sql: config.text, params: config.values ?? [] };
  }
  return null;
}
