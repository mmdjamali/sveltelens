import type { Entry, EntryType, ListFilter, Storage } from '../types.js';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const ENTRY_TYPES: EntryType[] = ['request', 'client-request', 'query', 'log', 'exception'];

interface Row {
  id: string;
  type: EntryType;
  requestId: string | null;
  timestamp: number;
  durationMs: number | null;
  payload: string;
}

/** better-sqlite3 is an optional dependency — only required when storage: 'sqlite' is configured. */
export class SqliteStorage implements Storage {
  private db: import('better-sqlite3').Database;
  private maxEntries: number;

  constructor(path: string, maxEntries: number = 1000) {
    this.maxEntries = maxEntries;
    mkdirSync(dirname(path), { recursive: true });
    const Database = require('better-sqlite3') as typeof import('better-sqlite3');
    this.db = new Database(path);
    this.db.pragma('journal_mode = WAL');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS entries (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        requestId TEXT,
        timestamp INTEGER NOT NULL,
        durationMs INTEGER,
        payload TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_entries_type ON entries(type);
      CREATE INDEX IF NOT EXISTS idx_entries_requestId ON entries(requestId);
      CREATE INDEX IF NOT EXISTS idx_entries_timestamp ON entries(timestamp);
    `);
  }

  add(entry: Entry): void {
    const { id, type, requestId, timestamp, durationMs, ...rest } = entry;
    this.db
      .prepare(
        'INSERT OR REPLACE INTO entries (id, type, requestId, timestamp, durationMs, payload) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .run(id, type, requestId, timestamp, durationMs, JSON.stringify(rest.payload));

    const count = (this.db.prepare('SELECT COUNT(*) as c FROM entries').get() as { c: number }).c;
    if (count > this.maxEntries) {
      this.db
        .prepare(
          'DELETE FROM entries WHERE id IN (SELECT id FROM entries ORDER BY timestamp ASC LIMIT ?)'
        )
        .run(count - this.maxEntries);
    }
  }

  list(filter: ListFilter = {}): { entries: Entry[]; nextCursor: string | null } {
    const { type, requestId, cursor, limit = 50 } = filter;
    const clauses: string[] = [];
    const params: unknown[] = [];
    if (type) {
      clauses.push('type = ?');
      params.push(type);
    }
    if (requestId) {
      clauses.push('requestId = ?');
      params.push(requestId);
    }
    if (cursor) {
      const cursorRow = this.db.prepare('SELECT timestamp FROM entries WHERE id = ?').get(cursor) as
        | { timestamp: number }
        | undefined;
      if (cursorRow) {
        clauses.push('timestamp < ?');
        params.push(cursorRow.timestamp);
      }
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const rows = this.db
      .prepare(`SELECT * FROM entries ${where} ORDER BY timestamp DESC LIMIT ?`)
      .all(...params, limit + 1) as Row[];

    const hasMore = rows.length > limit;
    const page = rows.slice(0, limit);
    const entries = page.map(rowToEntry);
    return { entries, nextCursor: hasMore ? entries[entries.length - 1]?.id ?? null : null };
  }

  get(id: string): Entry | null {
    const row = this.db.prepare('SELECT * FROM entries WHERE id = ?').get(id) as Row | undefined;
    return row ? rowToEntry(row) : null;
  }

  clear(): void {
    this.db.exec('DELETE FROM entries');
  }

  counts(): Record<EntryType, number> {
    const result = Object.fromEntries(ENTRY_TYPES.map((t) => [t, 0])) as Record<EntryType, number>;
    const rows = this.db.prepare('SELECT type, COUNT(*) as c FROM entries GROUP BY type').all() as {
      type: EntryType;
      c: number;
    }[];
    for (const row of rows) result[row.type] = row.c;
    return result;
  }
}

function rowToEntry(row: Row): Entry {
  return {
    id: row.id,
    type: row.type,
    requestId: row.requestId,
    timestamp: row.timestamp,
    durationMs: row.durationMs,
    payload: JSON.parse(row.payload),
  } as Entry;
}
