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

  it('caps at maxEntries when inserting many entries one at a time (cached-count eviction path)', () => {
    dir = mkdtempSync(path.join(tmpdir(), 'sveltelens-sqlite-'));
    const maxEntries = 5;
    const storage = new SqliteStorage(path.join(dir, 'db.sqlite'), maxEntries);

    for (let i = 0; i < maxEntries + 5; i++) {
      storage.add(makeEntry(`e${i}`));
    }

    expect(storage.list({ limit: maxEntries + 10 }).entries).toHaveLength(maxEntries);
  });

  it('reads the correct row count from an existing database on construct, so eviction still triggers at the right threshold', () => {
    dir = mkdtempSync(path.join(tmpdir(), 'sveltelens-sqlite-'));
    const dbPath = path.join(dir, 'db.sqlite');
    const maxEntries = 3;

    // Simulate a prior dev-server session: populate the DB, then drop the
    // in-memory instance without exceeding maxEntries.
    const first = new SqliteStorage(dbPath, maxEntries);
    first.add(makeEntry('a'));
    first.add(makeEntry('b'));
    first.add(makeEntry('c'));
    expect(first.list().entries).toHaveLength(3);

    // Re-open against the same file — the constructor's one-time COUNT(*)
    // read must seed entryCount to 3, not 0.
    const second = new SqliteStorage(dbPath, maxEntries);
    second.add(makeEntry('d'));

    expect(second.get('a')).toBeNull(); // oldest row evicted
    expect(second.list().entries).toHaveLength(maxEntries);
  });

  it('resets the eviction threshold after clear(), not just the table contents', () => {
    dir = mkdtempSync(path.join(tmpdir(), 'sveltelens-sqlite-'));
    const maxEntries = 3;
    const storage = new SqliteStorage(path.join(dir, 'db.sqlite'), maxEntries);

    storage.add(makeEntry('a'));
    storage.add(makeEntry('b'));
    storage.add(makeEntry('c'));
    expect(storage.list().entries).toHaveLength(3);

    storage.clear();

    // If entryCount weren't reset, the cached count would still be 3 here,
    // and this single add would immediately trigger eviction.
    storage.add(makeEntry('x'));
    expect(storage.get('x')).not.toBeNull();
    expect(storage.list().entries).toHaveLength(1);

    // Fill back up to maxEntries — still no eviction until the count
    // actually reaches maxEntries again.
    storage.add(makeEntry('y'));
    storage.add(makeEntry('z'));
    expect(storage.list().entries).toHaveLength(maxEntries);
    expect(storage.get('x')).not.toBeNull();

    // One more push past the cap now evicts the oldest post-clear row.
    storage.add(makeEntry('w'));
    expect(storage.get('x')).toBeNull();
    expect(storage.list().entries).toHaveLength(maxEntries);
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
