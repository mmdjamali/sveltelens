import { describe, it, expect, beforeEach } from 'vitest';
import { store } from '../src/lib/store.svelte';
import type { Entry } from '../src/lib/types';

function entry(id: string, type: Entry['type'], payload: unknown): Entry {
  return { id, timestamp: 0, durationMs: null, offsetMs: null, requestId: null, type, payload } as Entry;
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
