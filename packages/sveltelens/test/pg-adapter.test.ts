import { describe, it, expect, beforeEach } from 'vitest';
import type { Pool } from 'pg';
import { MemoryStorage } from '../src/storage/memory.js';
import { Recorder } from '../src/recorder.js';
import { setSveltelensState } from '../src/state.js';
import { resolveConfig } from '../src/config.js';
import { pg } from '../src/adapters/pg.js';
import type { QueryPayload } from '../src/types.js';

/**
 * A fake `Pool`/`Client` — real node-postgres needs a live server, but the adapter
 * only touches `query()`, so a duck-typed stand-in exercises the wrapping logic.
 */
function makeFakePool(rows: unknown[] = []) {
  return {
    query: (...args: unknown[]) => {
      const cb = args.find((a) => typeof a === 'function') as ((err: null, res: unknown) => void) | undefined;
      if (cb) {
        cb(null, { rows });
        return undefined;
      }
      return Promise.resolve({ rows });
    },
  } as unknown as Pool;
}

describe('pg', () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage(50);
    setSveltelensState({ recorder: new Recorder(storage), config: resolveConfig() });
  });

  it('records query(text, params) with a real durationMs', async () => {
    const pool = pg(makeFakePool([{ id: 1 }]));
    await pool.query('SELECT * FROM todos WHERE id = $1', [1]);

    const entries = storage.list({ type: 'query' }).entries;
    expect(entries).toHaveLength(1);
    expect(entries[0].durationMs).not.toBeNull();
    expect(entries[0].durationMs).toBeGreaterThanOrEqual(0);
    const payload = entries[0].payload as QueryPayload;
    expect(payload.sql).toBe('SELECT * FROM todos WHERE id = $1');
    expect(payload.params).toEqual([1]);
  });

  it('records query(config) with values pulled from the config object', async () => {
    const pool = pg(makeFakePool());
    await pool.query({ text: 'INSERT INTO todos (title) VALUES ($1)', values: ['write docs'] });

    const entries = storage.list({ type: 'query' }).entries;
    expect(entries).toHaveLength(1);
    const payload = entries[0].payload as QueryPayload;
    expect(payload.sql).toBe('INSERT INTO todos (title) VALUES ($1)');
    expect(payload.params).toEqual(['write docs']);
  });

  it('records a failed query and still rejects', async () => {
    const pool = pg({
      query: () => Promise.reject(new Error('boom')),
    } as unknown as Pool);

    await expect(pool.query('SELECT 1')).rejects.toThrow('boom');
    expect(storage.list({ type: 'query' }).entries).toHaveLength(1);
  });

  it('does not record the callback form', async () => {
    const pool = pg(makeFakePool([{ id: 1 }]));
    await new Promise<void>((resolve) => {
      pool.query('SELECT 1', (err, res) => {
        expect(err).toBeNull();
        resolve();
      });
    });

    expect(storage.list({ type: 'query' }).entries).toHaveLength(0);
  });

  it('does not record once sveltelens is disabled', async () => {
    setSveltelensState({ recorder: new Recorder(storage), config: resolveConfig({ enabled: false }) });
    const pool = pg(makeFakePool());
    await pool.query('SELECT 1');
    expect(storage.list({ type: 'query' }).entries).toHaveLength(0);
  });
});
