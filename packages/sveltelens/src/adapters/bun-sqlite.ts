import { recordQuery } from '../record.js';

const TIMED_STATEMENT_METHODS = ['run', 'get', 'all'] as const;

/**
 * Structural stand-in for `bun:sqlite`'s `Database`/`Statement` — kept local so this
 * adapter doesn't need `bun-types` as a devDependency just to type-check.
 */
interface BunStatement {
  run(...params: unknown[]): unknown;
  get(...params: unknown[]): unknown;
  all(...params: unknown[]): unknown;
}
interface BunDatabase {
  prepare(sql: string, ...params: unknown[]): BunStatement;
}

/**
 * Wraps a `bun:sqlite` `Database` so every prepared statement's run/get/all is
 * timed and recorded: `bunSqlite(new Database('app.db'))`. Only runs under Bun.
 */
export function bunSqlite<T extends BunDatabase>(db: T): T {
  const originalPrepare = db.prepare.bind(db);
  db.prepare = ((sql: string, ...params: unknown[]) => wrapStatement(originalPrepare(sql, ...params), sql, params)) as T['prepare'];
  return db;
}

function wrapStatement<S extends BunStatement>(stmt: S, sql: string, prepareParams: unknown[]): S {
  for (const method of TIMED_STATEMENT_METHODS) {
    const original = stmt[method].bind(stmt) as (...params: unknown[]) => unknown;
    (stmt[method] as unknown) = (...params: unknown[]) => {
      const start = performance.now();
      try {
        return original(...params);
      } finally {
        recordQuery({ sql, params: params.length ? params : prepareParams, durationMs: Math.round(performance.now() - start) });
      }
    };
  }
  return stmt;
}
