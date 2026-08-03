import type { DatabaseSync, StatementSync } from 'node:sqlite';
import { recordQuery } from '../record.js';

const TIMED_STATEMENT_METHODS = ['run', 'get', 'all'] as const;

/**
 * Wraps a `node:sqlite` `DatabaseSync` so every prepared statement's run/get/all
 * is timed and recorded: `nodeSqlite(new DatabaseSync('app.db'))`.
 *
 * Requires Node's `node:sqlite` module (Node 22.5+, still experimental on some
 * versions — pass `--experimental-sqlite` if your runtime needs it).
 */
export function nodeSqlite<T extends DatabaseSync>(db: T): T {
  const originalPrepare = db.prepare.bind(db);
  db.prepare = ((sql: string) => wrapStatement(originalPrepare(sql), sql)) as T['prepare'];
  return db;
}

function wrapStatement<S extends StatementSync>(stmt: S, sql: string): S {
  for (const method of TIMED_STATEMENT_METHODS) {
    const original = stmt[method].bind(stmt) as (...params: unknown[]) => unknown;
    (stmt[method] as unknown) = (...params: unknown[]) => {
      const start = performance.now();
      try {
        return original(...params);
      } finally {
        recordQuery({ sql, params, durationMs: Math.round(performance.now() - start) });
      }
    };
  }
  return stmt;
}
