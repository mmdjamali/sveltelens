import { describe, it, expect } from 'vitest';
import { MemoryStorage } from '../src/storage/memory.js';
import type { Entry } from '../src/types.js';

function makeEntry(overrides: Partial<Entry> = {}): Entry {
  return {
    id: overrides.id ?? Math.random().toString(36).slice(2),
    requestId: overrides.requestId ?? null,
    timestamp: overrides.timestamp ?? Date.now(),
    durationMs: overrides.durationMs ?? null,
    offsetMs: overrides.offsetMs ?? null,
    type: overrides.type ?? 'log',
    payload: overrides.payload ?? { level: 'log', message: 'hi' },
  } as Entry;
}

describe('MemoryStorage', () => {
  it('adds and retrieves entries by id', () => {
    const storage = new MemoryStorage(10);
    const entry = makeEntry({ id: 'a' });
    storage.add(entry);
    expect(storage.get('a')).toEqual(entry);
    expect(storage.get('missing')).toBeNull();
  });

  it('evicts oldest entries once maxEntries is exceeded', () => {
    const storage = new MemoryStorage(3);
    for (const id of ['a', 'b', 'c', 'd']) storage.add(makeEntry({ id }));
    expect(storage.get('a')).toBeNull();
    expect(storage.get('d')).not.toBeNull();
    expect(storage.list().entries).toHaveLength(3);
  });

  it('lists newest first and filters by type and requestId', () => {
    const storage = new MemoryStorage(10);
    storage.add(makeEntry({ id: 'a', type: 'log', requestId: 'r1' }));
    storage.add(makeEntry({ id: 'b', type: 'query', requestId: 'r1', payload: { sql: 'select 1', params: [], connection: null } }));
    storage.add(makeEntry({ id: 'c', type: 'log', requestId: 'r2' }));

    const all = storage.list();
    expect(all.entries.map((e) => e.id)).toEqual(['c', 'b', 'a']);

    const onlyLogs = storage.list({ type: 'log' });
    expect(onlyLogs.entries.map((e) => e.id)).toEqual(['c', 'a']);

    const onlyR1 = storage.list({ requestId: 'r1' });
    expect(onlyR1.entries.map((e) => e.id)).toEqual(['b', 'a']);
  });

  it('paginates via cursor', () => {
    const storage = new MemoryStorage(10);
    for (const id of ['a', 'b', 'c', 'd', 'e']) storage.add(makeEntry({ id }));

    const page1 = storage.list({ limit: 2 });
    expect(page1.entries.map((e) => e.id)).toEqual(['e', 'd']);
    expect(page1.nextCursor).toBe('d');

    const page2 = storage.list({ limit: 2, cursor: page1.nextCursor! });
    expect(page2.entries.map((e) => e.id)).toEqual(['c', 'b']);
  });

  it('clears all entries', () => {
    const storage = new MemoryStorage(10);
    storage.add(makeEntry());
    storage.clear();
    expect(storage.list().entries).toHaveLength(0);
  });

  it('counts entries per type', () => {
    const storage = new MemoryStorage(10);
    storage.add(makeEntry({ type: 'log' }));
    storage.add(makeEntry({ type: 'log' }));
    storage.add(makeEntry({ type: 'exception', payload: { message: 'x', stack: null, name: 'Error' } }));
    const counts = storage.counts();
    expect(counts.log).toBe(2);
    expect(counts.exception).toBe(1);
    expect(counts.request).toBe(0);
  });
});
