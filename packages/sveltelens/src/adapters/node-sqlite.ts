import type { DatabaseSync } from 'node:sqlite';
import { wrapStatement } from './shared.js';

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
