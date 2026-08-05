import { describe, it, expect, beforeEach } from 'vitest';
import type { Pool } from 'mysql2/promise';
import { MemoryStorage } from '../src/storage/memory.js';
import { Recorder } from '../src/recorder.js';
import { setSveltelensState } from '../src/state.js';
import { resolveConfig } from '../src/config.js';
import { mysql2 } from '../src/adapters/mysql2.js';
import type { QueryPayload } from '../src/types.js';

/** A fake `Pool`/`Connection` — real mysql2 needs a live server, this exercises the wrapper. */
function makeFakePool(rows: unknown[] = []) {
  return {
    query: () => Promise.resolve([rows, []]),
    execute: () => Promise.resolve([rows, []]),
  } as unknown as Pool;
}

describe('mysql2', () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage(50);
    setSveltelensState({ recorder: new Recorder(storage), config: resolveConfig() });
  });

  it('records query(text, params) with a real durationMs', async () => {
    const pool = mysql2(makeFakePool([{ id: 1 }]));
    await pool.query('SELECT * FROM todos WHERE id = ?', [1]);

    const entries = storage.list({ type: 'query' }).entries;
    expect(entries).toHaveLength(1);
    expect(entries[0].durationMs).not.toBeNull();
    expect(entries[0].durationMs).toBeGreaterThanOrEqual(0);
    const payload = entries[0].payload as QueryPayload;
    expect(payload.sql).toBe('SELECT * FROM todos WHERE id = ?');
    expect(payload.params).toEqual([1]);
  });

  it('records execute(options) with sql pulled from the options object', async () => {
    const pool = mysql2(makeFakePool());
    await pool.execute({ sql: 'INSERT INTO todos (title) VALUES (?)' }, ['write docs']);

    const entries = storage.list({ type: 'query' }).entries;
    expect(entries).toHaveLength(1);
    const payload = entries[0].payload as QueryPayload;
    expect(payload.sql).toBe('INSERT INTO todos (title) VALUES (?)');
    expect(payload.params).toEqual(['write docs']);
  });

  it('records a failed query and still rejects', async () => {
    const pool = mysql2({
      query: () => Promise.reject(new Error('boom')),
      execute: () => Promise.reject(new Error('boom')),
    } as unknown as Pool);

    await expect(pool.query('SELECT 1')).rejects.toThrow('boom');
    const entries = storage.list({ type: 'query' }).entries;
    expect(entries).toHaveLength(1);
    expect((entries[0].payload as QueryPayload).error).toBe('boom');
  });

  it('does not record once sveltelens is disabled', async () => {
    setSveltelensState({ recorder: new Recorder(storage), config: resolveConfig({ enabled: false }) });
    const pool = mysql2(makeFakePool());
    await pool.query('SELECT 1');
    expect(storage.list({ type: 'query' }).entries).toHaveLength(0);
  });
});
