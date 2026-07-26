import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { MemoryStorage } from '../src/storage/memory.js';
import { Recorder } from '../src/recorder.js';
import { installHttpClientInterceptor } from '../src/intercept/http-client.js';
import type { ClientRequestPayload } from '../src/types.js';

describe('http-client interceptor', () => {
  let server: http.Server;
  let baseUrl: string;
  let storage: MemoryStorage;
  let recorder: Recorder;
  let uninstall: () => void;

  beforeAll(async () => {
    server = http.createServer((req, res) => {
      if (req.url === '/echo') {
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ ok: true }));
        return;
      }
      if (req.url === '/fail') {
        res.statusCode = 500;
        res.end('boom');
        return;
      }
      res.statusCode = 404;
      res.end();
    });
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const { port } = server.address() as AddressInfo;
    baseUrl = `http://localhost:${port}`;
  });

  afterAll(() => {
    server.close();
  });

  beforeEach(() => {
    storage = new MemoryStorage(50);
    recorder = new Recorder(storage);
    uninstall = installHttpClientInterceptor(recorder, ['authorization']);
  });

  afterEach(() => uninstall());

  it('records a successful fetch as a single client-request entry', async () => {
    const res = await fetch(`${baseUrl}/echo`);
    expect(await res.json()).toEqual({ ok: true });

    const entries = storage.list({ type: 'client-request' }).entries;
    expect(entries).toHaveLength(1);
    const payload = entries[0].payload as ClientRequestPayload;
    expect(payload.method).toBe('GET');
    expect(payload.url).toBe(`${baseUrl}/echo`);
    expect(payload.status).toBe(200);
    expect(payload.responseBody?.text).toBe('{"ok":true}');
  });

  it('does not double-record the same call via both undici channel and fetch patch', async () => {
    await fetch(`${baseUrl}/echo`);
    expect(storage.list({ type: 'client-request' }).entries).toHaveLength(1);
  });

  it('redacts configured headers', async () => {
    await fetch(`${baseUrl}/echo`, { headers: { authorization: 'Bearer secret' } });
    const entry = storage.list({ type: 'client-request' }).entries[0];
    const payload = entry.payload as ClientRequestPayload;
    expect(payload.requestHeaders.authorization).toBe('[redacted]');
  });

  it('records non-2xx responses with their status', async () => {
    await fetch(`${baseUrl}/fail`);
    const entry = storage.list({ type: 'client-request' }).entries[0];
    expect((entry.payload as ClientRequestPayload).status).toBe(500);
  });
});
