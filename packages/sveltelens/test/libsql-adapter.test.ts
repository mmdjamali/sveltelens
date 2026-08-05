import { describe, it, expect, beforeEach } from 'vitest';
import type { Client } from '@libsql/client';
import { MemoryStorage } from '../src/storage/memory.js';
import { Recorder } from '../src/recorder.js';
import { setSveltelensState } from '../src/state.js';
import { resolveConfig } from '../src/config.js';
import { libsql } from '../src/adapters/libsql.js';
import type { QueryPayload } from '../src/types.js';

function makeFakeClient(rows: unknown[] = []) {
  return {
    execute: () => Promise.resolve({ rows, columns: [], columnTypes: [], rowsAffected: 0, lastInsertRowid: undefined }),
  } as unknown as Client;
}

describe('libsql', () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage(50);
    setSveltelensState({ recorder: new Recorder(storage), config: resolveConfig() });
  });

  it('records execute(sql, args) with a real durationMs', async () => {
    const client = libsql(makeFakeClient([{ id: 1 }]));
    await client.execute('SELECT * FROM todos WHERE id = ?', [1]);

    const entries = storage.list({ type: 'query' }).entries;
    expect(entries).toHaveLength(1);
    expect(entries[0].durationMs).not.toBeNull();
    expect(entries[0].durationMs).toBeGreaterThanOrEqual(0);
    const payload = entries[0].payload as QueryPayload;
    expect(payload.sql).toBe('SELECT * FROM todos WHERE id = ?');
    expect(payload.params).toEqual([1]);
  });

  it('records execute({ sql, args })', async () => {
    const client = libsql(makeFakeClient());
    await client.execute({ sql: 'INSERT INTO todos (title) VALUES (?)', args: ['write docs'] });

    const entries = storage.list({ type: 'query' }).entries;
    expect(entries).toHaveLength(1);
    const payload = entries[0].payload as QueryPayload;
    expect(payload.sql).toBe('INSERT INTO todos (title) VALUES (?)');
    expect(payload.params).toEqual(['write docs']);
  });

  it('records a failed query and still rejects', async () => {
    const client = libsql({ execute: () => Promise.reject(new Error('boom')) } as unknown as Client);

    await expect(client.execute('SELECT 1')).rejects.toThrow('boom');
    const entries = storage.list({ type: 'query' }).entries;
    expect(entries).toHaveLength(1);
    expect((entries[0].payload as QueryPayload).error).toBe('boom');
  });

  it('does not record once sveltelens is disabled', async () => {
    setSveltelensState({ recorder: new Recorder(storage), config: resolveConfig({ enabled: false }) });
    const client = libsql(makeFakeClient());
    await client.execute('SELECT 1');
    expect(storage.list({ type: 'query' }).entries).toHaveLength(0);
  });
});
