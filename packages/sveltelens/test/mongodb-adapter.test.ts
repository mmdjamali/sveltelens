import { describe, it, expect, beforeEach } from 'vitest';
import { EventEmitter } from 'node:events';
import type { MongoClient } from 'mongodb';
import { MemoryStorage } from '../src/storage/memory.js';
import { Recorder } from '../src/recorder.js';
import { setSveltelensState } from '../src/state.js';
import { resolveConfig } from '../src/config.js';
import { mongodb } from '../src/adapters/mongodb.js';
import type { QueryPayload } from '../src/types.js';

/** A fake `MongoClient` — real command monitoring needs a live server. */
function makeFakeClient() {
  return new EventEmitter() as unknown as MongoClient;
}

describe('mongodb', () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage(50);
    setSveltelensState({ recorder: new Recorder(storage), config: resolveConfig() });
  });

  it('pairs commandStarted with commandSucceeded into one entry with a real durationMs', () => {
    const client = mongodb(makeFakeClient());
    client.emit('commandStarted', {
      requestId: 1,
      commandName: 'find',
      command: { find: 'todos', filter: { id: 1 }, lsid: { id: 'x' }, $db: 'app' },
      databaseName: 'app',
    } as never);
    client.emit('commandSucceeded', { requestId: 1, commandName: 'find', duration: 12, databaseName: 'app' } as never);

    const entries = storage.list({ type: 'query' }).entries;
    expect(entries).toHaveLength(1);
    expect(entries[0].durationMs).toBe(12);
    const payload = entries[0].payload as QueryPayload;
    expect(payload.sql).toContain('find(');
    expect(payload.sql).toContain('"filter":{"id":1}');
    expect(payload.sql).not.toContain('lsid');
    expect(payload.sql).not.toContain('$db');
    expect(payload.connection).toBe('app');
  });

  it('pairs commandStarted with commandFailed', () => {
    const client = mongodb(makeFakeClient());
    client.emit('commandStarted', {
      requestId: 2,
      commandName: 'insert',
      command: { insert: 'todos', documents: [{ title: 'x' }] },
      databaseName: 'app',
    } as never);
    client.emit('commandFailed', {
      requestId: 2,
      commandName: 'insert',
      duration: 5,
      databaseName: 'app',
      failure: new Error('boom'),
    } as never);

    const entries = storage.list({ type: 'query' }).entries;
    expect(entries).toHaveLength(1);
    expect(entries[0].durationMs).toBe(5);
    const payload = entries[0].payload as QueryPayload;
    expect(payload.sql).toContain('insert(');
    expect(payload.error).toBe('boom');
  });

  it('does not record once sveltelens is disabled', () => {
    setSveltelensState({ recorder: new Recorder(storage), config: resolveConfig({ enabled: false }) });
    const client = mongodb(makeFakeClient());
    client.emit('commandStarted', { requestId: 3, commandName: 'find', command: { find: 'todos' }, databaseName: 'app' } as never);
    client.emit('commandSucceeded', { requestId: 3, commandName: 'find', duration: 1, databaseName: 'app' } as never);
    expect(storage.list({ type: 'query' }).entries).toHaveLength(0);
  });
});
