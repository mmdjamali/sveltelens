import type Database from 'better-sqlite3';
import { recordQuery } from '../record.js';

const TIMED_STATEMENT_METHODS = ['run', 'get', 'all'] as const;

/**
 * Wraps a better-sqlite3 `Database` so every prepared statement's run/get/all is timed
 * and recorded: `betterSqlite3(new Database('app.db'))`.
 *
 * This sits at the driver, below whatever query builder you use, so it works the same
 * with Drizzle, Kysely, or raw SQL — and unlike an ORM's logger hook, it sees the query
 * finish and can report a real `durationMs`.
 */
export function betterSqlite3<T extends Database.Database>(db: T): T {
  const originalPrepare = db.prepare.bind(db);
  db.prepare = ((sql: string) => wrapStatement(originalPrepare(sql), sql)) as T['prepare'];
  return db;
}

function wrapStatement<S extends Database.Statement>(stmt: S, sql: string): S {
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
