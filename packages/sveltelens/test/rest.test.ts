import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { MemoryStorage } from '../src/storage/memory.js';
import { Recorder } from '../src/recorder.js';
import { createApiMiddleware } from '../src/api/rest.js';
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

describe('createApiMiddleware GET /api/entries', () => {
  let server: http.Server;
  let baseUrl: string;
  let storage: MemoryStorage;
  let recorder: Recorder;

  beforeAll(async () => {
    storage = new MemoryStorage(100);
    recorder = new Recorder(storage);
    const middleware = createApiMiddleware(storage, recorder, '');

    server = http.createServer((req, res) => {
      middleware(req, res, () => {
        res.statusCode = 404;
        res.end();
      });
    });
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const { port } = server.address() as AddressInfo;
    baseUrl = `http://localhost:${port}`;
  });

  afterAll(() => {
    server.close();
  });

  beforeEach(() => {
    storage.clear();
    for (let i = 0; i < 60; i++) storage.add(makeEntry({ id: `e${i}` }));
  });

  it('falls back to the default page size when limit is non-numeric', async () => {
    const withLimit = await fetch(`${baseUrl}/api/entries?limit=abc`).then((r) => r.json());
    const withoutLimit = await fetch(`${baseUrl}/api/entries`).then((r) => r.json());
    expect(withLimit.entries).toHaveLength(50);
    expect(withLimit.entries).toEqual(withoutLimit.entries);
  });

  it('falls back to the default page size when limit is negative', async () => {
    const res = await fetch(`${baseUrl}/api/entries?limit=-5`);
    const body = await res.json();
    expect(body.entries).toHaveLength(50);
  });

  it('honors a valid limit', async () => {
    const res = await fetch(`${baseUrl}/api/entries?limit=10`);
    const body = await res.json();
    expect(body.entries).toHaveLength(10);
  });
});
