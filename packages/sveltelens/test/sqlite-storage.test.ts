import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { SqliteStorage } from '../src/storage/sqlite.js';
import type { Entry } from '../src/types.js';

function makeEntry(id: string, overrides: Partial<Entry> = {}): Entry {
  return {
    id,
    requestId: 'r1',
    timestamp: Date.now(),
    durationMs: null,
    offsetMs: null,
    type: 'log',
    payload: { level: 'log', message: `msg-${id}` },
    ...overrides,
  } as Entry;
}

describe('SqliteStorage', () => {
  let dir: string;

  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true });
  });

  it('persists, lists, and clears entries on disk', () => {
    dir = mkdtempSync(path.join(tmpdir(), 'sveltelens-sqlite-'));
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
    dir = mkdtempSync(path.join(tmpdir(), 'sveltelens-sqlite-'));
    const storage = new SqliteStorage(path.join(dir, 'db.sqlite'), 2);
    storage.add(makeEntry('a'));
    storage.add(makeEntry('b'));
    storage.add(makeEntry('c'));
    expect(storage.get('a')).toBeNull();
    expect(storage.list().entries).toHaveLength(2);
  });

  it('does not prune by age when maxAgeMs is unset', () => {
    dir = mkdtempSync(path.join(tmpdir(), 'sveltelens-sqlite-'));
    const storage = new SqliteStorage(path.join(dir, 'db.sqlite'), 1000, null);
    storage.add(makeEntry('old', { timestamp: Date.now() - 1000 * 60 * 60 * 24 * 365 }));
    for (let i = 0; i < 150; i++) {
      storage.add(makeEntry(`fresh-${i}`));
    }
    expect(storage.get('old')).not.toBeNull();
  });

  it('prunes entries older than maxAgeMs once the 100-insert check fires', () => {
    dir = mkdtempSync(path.join(tmpdir(), 'sveltelens-sqlite-'));
    const storage = new SqliteStorage(path.join(dir, 'db.sqlite'), 1000, 1000);
    storage.add(makeEntry('old', { timestamp: Date.now() - 10_000 }));
    for (let i = 0; i < 100; i++) {
      storage.add(makeEntry(`fresh-${i}`));
    }
    expect(storage.get('old')).toBeNull();
  });

  it('does not prune by age before the 100-insert threshold is reached', () => {
    dir = mkdtempSync(path.join(tmpdir(), 'sveltelens-sqlite-'));
    const storage = new SqliteStorage(path.join(dir, 'db.sqlite'), 1000, 1000);
    storage.add(makeEntry('old', { timestamp: Date.now() - 10_000 }));
    for (let i = 0; i < 50; i++) {
      storage.add(makeEntry(`fresh-${i}`));
    }
    expect(storage.get('old')).not.toBeNull();
  });
});
