import type { Storage, SveltelensConfig } from '../types.js';
import { MemoryStorage } from './memory.js';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export { MemoryStorage } from './memory.js';
export type { Storage };

export function createStorage(config: SveltelensConfig): Storage {
  if (config.storage === 'sqlite') {
    // lazy required so better-sqlite3 stays an optional dep
    const { SqliteStorage } = require('./sqlite.js') as typeof import('./sqlite.js');
    return new SqliteStorage(config.sqlitePath ?? '.sveltelens/db.sqlite', config.maxEntries ?? 1000);
  }
  return new MemoryStorage(config.maxEntries ?? 1000);
}
