import { describe, it, expect, beforeEach, vi } from 'vitest';
import { store } from '../src/lib/store.svelte';
import type { Entry } from '../src/lib/types';
import * as api from '../src/lib/api';

vi.mock('../src/lib/api');

function entry(id: string, type: Entry['type'], payload: unknown): Entry {
  return { id, timestamp: 0, durationMs: null, offsetMs: null, requestId: null, type, payload } as Entry;
}

function emptyCounts(): Record<Entry['type'], number> {
  return { request: 0, 'client-request': 0, 'browser-request': 0, query: 0, log: 0, exception: 0, action: 0 };
}

describe('store.filtered', () => {
  beforeEach(() => {
    store.search = '';
    store.entries = [
      entry('1', 'request', { path: '/todos', method: 'GET' }),
      entry('2', 'query', { sql: 'select * from todos', params: [] }),
      entry('3', 'log', { level: 'log', message: 'hello world' }),
    ];
  });

  it('keeps only the requested type', () => {
    expect(store.filtered('query').map((e) => e.id)).toEqual(['2']);
    expect(store.filtered('all')).toHaveLength(3);
  });

  it('searches the whole entry, not just one field', () => {
    store.search = 'todos';
    // Matches the request's path and the query's sql, but not the log.
    expect(store.filtered('all').map((e) => e.id)).toEqual(['1', '2']);
  });

  it('ignores case and surrounding whitespace in the search', () => {
    store.search = '  HELLO  ';
    expect(store.filtered('all').map((e) => e.id)).toEqual(['3']);
  });

  it('applies the type and the search together', () => {
    store.search = 'todos';
    expect(store.filtered('log')).toHaveLength(0);
  });

  it('does not return stale cached results when an id is reused with new content', () => {
    store.entries = [entry('1', 'log', { level: 'log', message: 'first message' })];
    store.search = 'first';
    expect(store.filtered('all')).toHaveLength(1);

    // Same id, brand new object, unrelated content.
    store.entries = [entry('1', 'log', { level: 'log', message: 'second message' })];
    expect(store.filtered('all')).toHaveLength(0); // 'first' no longer matches

    store.search = 'second';
    expect(store.filtered('all')).toHaveLength(1);
  });
});

describe('store async methods', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    store.entries = [];
    store.counts = emptyCounts();
    store.paused = false;
  });

  it('refresh() loads entries and counts from the API', async () => {
    vi.mocked(api.fetchEntries).mockResolvedValue({
      entries: [entry('1', 'log', { level: 'log', message: 'hi' })],
      nextCursor: null,
    });
    vi.mocked(api.fetchCounts).mockResolvedValue({ ...emptyCounts(), log: 1 });

    await store.refresh();

    expect(store.entries).toHaveLength(1);
    expect(store.counts.log).toBe(1);
  });

  it('togglePause() flips local state and calls setPaused', () => {
    vi.mocked(api.setPaused).mockResolvedValue(undefined);
    store.paused = false;

    store.togglePause();

    expect(store.paused).toBe(true);
    expect(api.setPaused).toHaveBeenCalledWith(true);
  });

  it('clear() empties entries/counts and calls clearEntries', async () => {
    vi.mocked(api.clearEntries).mockResolvedValue(undefined);
    store.entries = [entry('1', 'log', { level: 'log', message: 'hi' })];

    await store.clear();

    expect(store.entries).toHaveLength(0);
    expect(api.clearEntries).toHaveBeenCalled();
  });

  describe('connect() push callback', () => {
    it('appends a new entry and increments its type count when not paused', () => {
      let pushEntry: ((e: Entry) => void) | undefined;
      vi.mocked(api.connectStream).mockImplementation((onEntry) => {
        pushEntry = onEntry;
        return { close: vi.fn() } as unknown as WebSocket;
      });
      store.paused = false;
      store.entries = [];
      store.counts = emptyCounts();

      store.connect();
      pushEntry?.(entry('new', 'log', { level: 'log', message: 'pushed' }));

      expect(store.entries.map((e) => e.id)).toEqual(['new']);
      expect(store.counts.log).toBe(1);
    });

    it('drops a pushed entry when paused', () => {
      let pushEntry: ((e: Entry) => void) | undefined;
      vi.mocked(api.connectStream).mockImplementation((onEntry) => {
        pushEntry = onEntry;
        return { close: vi.fn() } as unknown as WebSocket;
      });
      store.paused = true;
      store.entries = [];

      store.connect();
      pushEntry?.(entry('new', 'log', { level: 'log', message: 'pushed' }));

      expect(store.entries).toHaveLength(0);
    });

    it('caps entries at 1000, dropping the oldest', () => {
      let pushEntry: ((e: Entry) => void) | undefined;
      vi.mocked(api.connectStream).mockImplementation((onEntry) => {
        pushEntry = onEntry;
        return { close: vi.fn() } as unknown as WebSocket;
      });
      store.paused = false;
      store.entries = Array.from({ length: 1000 }, (_, i) =>
        entry(`old-${i}`, 'log', { level: 'log', message: 'x' })
      );

      store.connect();
      pushEntry?.(entry('overflow', 'log', { level: 'log', message: 'new' }));

      expect(store.entries).toHaveLength(1000);
      expect(store.entries[0].id).toBe('overflow');
      expect(store.entries.some((e) => e.id === 'old-999')).toBe(false); // the oldest one got dropped
    });
  });
});
