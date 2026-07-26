import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { SqliteStorage } from '../src/storage/sqlite.js';
import type { Entry } from '../src/types.js';

function makeEntry(id: string): Entry {
  return {
    id,
    requestId: 'r1',
    timestamp: Date.now(),
    durationMs: null,
    offsetMs: null,
    type: 'log',
    payload: { level: 'log', message: `msg-${id}` },
  } as Entry;
}

describe('SqliteStorage', () => {
  let dir: string;

  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true });
  });

  it('persists, lists, and clears entries on disk', () => {
    dir = mkdtempSync(path.join(tmpdir(), 'telescope-sqlite-'));
    const dbPath = path.join(dir, 'db.sqlite');
    const storage = new SqliteStorage(dbPath, 10);

    storage.add(makeEntry('a'));
    storage.add(makeEntry('b'));

    expect(storage.get('a')?.payload).toEqual({ level: 'log', message: 'msg-a' });
    expect(storage.list().entries.map((e) => e.id)).toEqual(['b', 'a']);
    expect(storage.counts().log).toBe(2);

    storage.clear();
    expect(storage.list().entries).toHaveLength(0);
  });

  it('evicts oldest rows once maxEntries is exceeded', () => {
    dir = mkdtempSync(path.join(tmpdir(), 'telescope-sqlite-'));
    const storage = new SqliteStorage(path.join(dir, 'db.sqlite'), 2);
    storage.add(makeEntry('a'));
    storage.add(makeEntry('b'));
    storage.add(makeEntry('c'));
    expect(storage.get('a')).toBeNull();
    expect(storage.list().entries).toHaveLength(2);
  });
});
