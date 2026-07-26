import type Database from 'better-sqlite3';
import { getTelescopeState } from '../state.js';

interface DrizzleLogger {
  logQuery(query: string, params: unknown[]): void;
}

/**
 * Pass to Drizzle's `logger` option: `drizzle(client, { logger: telescopeDrizzleLogger() })`.
 *
 * Drizzle calls `logQuery` synchronously before the driver runs the query, and there's no
 * matching "query finished" hook in the Logger interface — so entries recorded this way never
 * get a real `durationMs`. Prefer `telescopeBetterSqlite3` (better-sqlite3 driver) when you want
 * timed query entries; only fall back to this for drivers without a wrapper.
 */
export function telescopeDrizzleLogger(): DrizzleLogger {
  return {
    logQuery(query: string, params: unknown[]) {
      const state = getTelescopeState();
      if (!state || !state.config.enabled) return;
      state.recorder.record({
        type: 'query',
        payload: { sql: query, params, connection: null },
      });
    },
  };
}

const TIMED_STATEMENT_METHODS = ['run', 'get', 'all'] as const;

/**
 * Wraps a better-sqlite3 `Database` so every prepared statement's run/get/all is timed and
 * recorded with a real `durationMs`: `drizzle(telescopeBetterSqlite3(sqlite))`.
 *
 * Don't also pass `telescopeDrizzleLogger()` as the drizzle `logger` — this records the same
 * query entries itself, with accurate timing the logger hook can't provide.
 */
export function telescopeBetterSqlite3<T extends Database.Database>(db: T): T {
  const originalPrepare = db.prepare.bind(db);
  db.prepare = ((sql: string) => wrapStatement(originalPrepare(sql), sql)) as T['prepare'];
  return db;
}

function wrapStatement<S extends Database.Statement>(stmt: S, sql: string): S {
  for (const method of TIMED_STATEMENT_METHODS) {
    const original = stmt[method].bind(stmt) as (...params: unknown[]) => unknown;
    (stmt[method] as unknown) = (...params: unknown[]) => {
      const state = getTelescopeState();
      if (!state || !state.config.enabled) return original(...params);

      const start = performance.now();
      try {
        return original(...params);
      } finally {
        state.recorder.record({
          type: 'query',
          durationMs: Math.round(performance.now() - start),
          payload: { sql, params, connection: null },
        });
      }
    };
  }
  return stmt;
}
