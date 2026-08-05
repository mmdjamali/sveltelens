import { wrapStatement } from './shared.js';

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
