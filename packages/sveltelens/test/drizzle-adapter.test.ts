import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { MemoryStorage } from '../src/storage/memory.js';
import { Recorder } from '../src/recorder.js';
import { setSveltelensState } from '../src/state.js';
import { resolveConfig } from '../src/config.js';
import { sveltelensBetterSqlite3 } from '../src/adapters/drizzle.js';
import type { QueryPayload } from '../src/types.js';

describe('sveltelensBetterSqlite3', () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage(50);
    setSveltelensState({ recorder: new Recorder(storage), config: resolveConfig() });
  });

  function makeDb() {
    const sqlite = sveltelensBetterSqlite3(new Database(':memory:'));
    sqlite.exec('CREATE TABLE todos (id INTEGER PRIMARY KEY, title TEXT NOT NULL)');
    return sqlite;
  }

  it('records run/all/get with a real durationMs', () => {
    const sqlite = makeDb();
    sqlite.prepare('INSERT INTO todos (title) VALUES (?)').run('write docs');
    sqlite.prepare('SELECT * FROM todos').all();
    sqlite.prepare('SELECT * FROM todos WHERE id = ?').get(1);

    const entries = storage.list({ type: 'query' }).entries;
    expect(entries).toHaveLength(3);
    for (const entry of entries) {
      expect(entry.durationMs).not.toBeNull();
      expect(entry.durationMs).toBeGreaterThanOrEqual(0);
    }
    const insertPayload = entries[2].payload as QueryPayload;
    expect(insertPayload.sql).toBe('INSERT INTO todos (title) VALUES (?)');
    expect(insertPayload.params).toEqual(['write docs']);
  });

  it('does not record once sveltelens is disabled', () => {
    setSveltelensState({ recorder: new Recorder(storage), config: resolveConfig({ enabled: false }) });
    const sqlite = makeDb();
    sqlite.prepare('SELECT 1').get();
    expect(storage.list({ type: 'query' }).entries).toHaveLength(0);
  });
});
