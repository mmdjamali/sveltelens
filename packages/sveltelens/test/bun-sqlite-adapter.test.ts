import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryStorage } from '../src/storage/memory.js';
import { Recorder } from '../src/recorder.js';
import { setSveltelensState } from '../src/state.js';
import { resolveConfig } from '../src/config.js';
import { bunSqlite } from '../src/adapters/bun-sqlite.js';
import type { QueryPayload } from '../src/types.js';

/** A fake `bun:sqlite` `Database` — keeps the test portable to non-Bun runtimes. */
function makeFakeDb() {
  const rows: unknown[][] = [];
  return {
    prepare: (_sql: string) => ({
      run: (...params: unknown[]) => {
        rows.push(params);
        return { changes: 1, lastInsertRowid: rows.length };
      },
      get: (..._params: unknown[]) => rows[0] ?? null,
      all: (..._params: unknown[]) => rows,
    }),
  };
}

describe('bunSqlite', () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage(50);
    setSveltelensState({ recorder: new Recorder(storage), config: resolveConfig() });
  });

  it('records run/all/get with a real durationMs', () => {
    const db = bunSqlite(makeFakeDb());
    db.prepare('INSERT INTO todos (title) VALUES (?)').run('write docs');
    db.prepare('SELECT * FROM todos').all();
    db.prepare('SELECT * FROM todos WHERE id = ?').get(1);

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
    const db = bunSqlite(makeFakeDb());
    db.prepare('SELECT 1').get();
    expect(storage.list({ type: 'query' }).entries).toHaveLength(0);
  });
});
