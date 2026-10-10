import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApiMiddleware } from '../src/api/rest.js';
import { installClient } from '../src/client.js';
import { Recorder } from '../src/recorder.js';
import { MemoryStorage } from '../src/storage/memory.js';
import type { ClientRequestPayload, Entry } from '../src/types.js';

const BASE_PATH = '/__sveltelens';

describe('browser-request capture', () => {
  let server: http.Server;
  let baseUrl: string;
  let storage: MemoryStorage;
  let uninstall: () => void;
  const realFetch = globalThis.fetch;

  beforeEach(async () => {
    storage = new MemoryStorage(50);
    const recorder = new Recorder(storage);
    const middleware = createApiMiddleware(storage, recorder, BASE_PATH, {
      redactHeaders: ['authorization'],
      redactBodyKeys: ['password'],
    });
    server = http.createServer((req, res) => {
      middleware(req, res, () => {
        res.setHeader('content-type', 'application/json');
        res.end('{"ok":true,"password":"hunter2"}');
      });
    });
    await new Promise<void>((resolve) => server.listen(0, resolve));
    baseUrl = `http://localhost:${(server.address() as AddressInfo).port}`;

    // Node has no document base, so stand in for the browser resolving relative URLs.
    globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) =>
      realFetch(typeof input === 'string' && input.startsWith('/') ? baseUrl + input : input, init)) as typeof fetch;
    uninstall = installClient(BASE_PATH);
  });

  afterEach(() => {
    uninstall();
    globalThis.fetch = realFetch;
    server.close();
  });

  async function waitForEntry(): Promise<Entry> {
    for (let i = 0; i < 50; i++) {
      const [entry] = storage.list({}).entries;
      if (entry) return entry;
      await new Promise((r) => setTimeout(r, 10));
    }
    throw new Error('no entry recorded');
  }

  it('records a page fetch as a browser-request with no parent request, redacted', async () => {
    const res = await fetch(`${baseUrl}/api/thing`, {
      method: 'POST',
      headers: { authorization: 'Bearer x', 'content-type': 'application/json' },
      body: '{"password":"p","name":"n"}',
    });
    expect(await res.json()).toEqual({ ok: true, password: 'hunter2' });

    const entry = await waitForEntry();
    expect(entry.type).toBe('browser-request');
    expect(entry.requestId).toBeNull();
    const payload = entry.payload as ClientRequestPayload;
    expect(payload.method).toBe('POST');
    expect(payload.status).toBe(200);
    expect(payload.requestHeaders.authorization).toBe('[redacted]');
    expect(payload.requestBody?.text).toBe('{"password":"[redacted]","name":"n"}');
    expect(payload.responseBody?.text).toBe('{"ok":true,"password":"[redacted]"}');
  });

  it('records a network failure with its error and rethrows it', async () => {
    await expect(fetch('http://127.0.0.1:1/nope')).rejects.toThrow();
    const payload = (await waitForEntry()).payload as ClientRequestPayload;
    expect(payload.status).toBeNull();
    expect(payload.error).toBeTruthy();
  });

  it('does not record its own calls to the sveltelens API', async () => {
    await fetch(`${baseUrl}${BASE_PATH}/api/counts`);
    await new Promise((r) => setTimeout(r, 50));
    expect(storage.list({}).entries).toHaveLength(0);
  });

  it('rejects malformed and cross-origin reports', async () => {
    const endpoint = `${baseUrl}${BASE_PATH}/api/browser-requests`;
    const bad = await realFetch(endpoint, { method: 'POST', body: '{"method":1}' });
    expect(bad.status).toBe(400);
    const cross = await realFetch(endpoint, {
      method: 'POST',
      headers: { Origin: 'http://evil.example' },
      body: '{}',
    });
    expect(cross.status).toBe(403);
    expect(storage.list({}).entries).toHaveLength(0);
  });
});
