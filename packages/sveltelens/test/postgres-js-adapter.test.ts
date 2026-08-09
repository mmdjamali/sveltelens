import { describe, it, expect, beforeEach } from 'vitest';
import type postgres from 'postgres';
import { MemoryStorage } from '../src/storage/memory.js';
import { Recorder } from '../src/recorder.js';
import { setSveltelensState } from '../src/state.js';
import { resolveConfig } from '../src/config.js';
import { postgresJs } from '../src/adapters/postgres-js.js';
import type { QueryPayload } from '../src/types.js';

/**
 * A fake tagged-template `Sql` — real postgres.js needs a live server. This
 * returns a lazy thenable, matching postgres.js's own laziness, so it exercises
 * the adapter's `.then`-patching without ever resolving until awaited.
 */
function makePending(settle: () => Promise<unknown>) {
  return { then: (onFulfilled?: unknown, onRejected?: unknown) => settle().then(onFulfilled as never, onRejected as never) };
}

function makeFakeSql(rows: unknown[] = []) {
  const fn = ((_strings: TemplateStringsArray, ..._values: unknown[]) => makePending(() => Promise.resolve(rows))) as unknown as postgres.Sql<any>;
  (fn as unknown as { unsafe: unknown }).unsafe = (_query: string, _params?: unknown[]) => makePending(() => Promise.resolve(rows));
  return fn;
}

describe('postgresJs', () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage(50);
    setSveltelensState({ recorder: new Recorder(storage), config: resolveConfig() });
  });

  it('records a tagged-template query with $1..$n placeholders and a real durationMs', async () => {
    const sql = postgresJs(makeFakeSql([{ id: 1 }]));
    const id = 1;
    await sql`SELECT * FROM todos WHERE id = ${id}`;

    const entries = storage.list({ type: 'query' }).entries;
    expect(entries).toHaveLength(1);
    expect(entries[0].durationMs).not.toBeNull();
    expect(entries[0].durationMs).toBeGreaterThanOrEqual(0);
    const payload = entries[0].payload as QueryPayload;
    expect(payload.sql).toBe('SELECT * FROM todos WHERE id = $1');
    expect(payload.params).toEqual([1]);
  });

  it('records sql.unsafe(query, params)', async () => {
    const sql = postgresJs(makeFakeSql());
    await sql.unsafe('INSERT INTO todos (title) VALUES ($1)', ['write docs']);

    const entries = storage.list({ type: 'query' }).entries;
    expect(entries).toHaveLength(1);
    const payload = entries[0].payload as QueryPayload;
    expect(payload.sql).toBe('INSERT INTO todos (title) VALUES ($1)');
    expect(payload.params).toEqual(['write docs']);
  });

  it('records a failed query and still rejects', async () => {
    const fn = ((_strings: TemplateStringsArray, ..._values: unknown[]) =>
      makePending(() => Promise.reject(new Error('boom')))) as unknown as postgres.Sql<any>;
    const sql = postgresJs(fn);

    await expect(sql`SELECT 1`).rejects.toThrow('boom');
    expect(storage.list({ type: 'query' }).entries).toHaveLength(1);
  });

  it('does not record once sveltelens is disabled', async () => {
    setSveltelensState({ recorder: new Recorder(storage), config: resolveConfig({ enabled: false }) });
    const sql = postgresJs(makeFakeSql());
    await sql`SELECT 1`;
    expect(storage.list({ type: 'query' }).entries).toHaveLength(0);
  });

  it('records exactly once when .then() is called more than once on the same query', async () => {
    const sql = postgresJs(makeFakeSql([{ id: 1 }]));
    const query = sql`SELECT * FROM todos WHERE id = ${1}`;

    await Promise.all([query, query]);

    const entries = storage.list({ type: 'query' }).entries;
    expect(entries).toHaveLength(1);
  });
});
