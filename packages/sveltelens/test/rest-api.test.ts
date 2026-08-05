import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { MemoryStorage } from '../src/storage/memory.js';
import { Recorder } from '../src/recorder.js';
import { createApiMiddleware } from '../src/api/rest.js';

const BASE_PATH = '/__sveltelens';

describe('rest api origin checks', () => {
  let server: http.Server;
  let baseUrl: string;
  let storage: MemoryStorage;
  let recorder: Recorder;

  beforeEach(async () => {
    storage = new MemoryStorage(50);
    recorder = new Recorder(storage);
    const middleware = createApiMiddleware(storage, recorder, BASE_PATH);

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

  afterEach(() => {
    server.close();
  });

  it('rejects GET /entries with a cross-origin Origin header (403)', async () => {
    const res = await fetch(`${baseUrl}${BASE_PATH}/api/entries`, {
      headers: { Origin: 'http://evil.example' },
    });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  it('allows GET /entries when Origin matches Host (200)', async () => {
    const { port } = server.address() as AddressInfo;
    const res = await fetch(`${baseUrl}${BASE_PATH}/api/entries`, {
      headers: { Origin: `http://localhost:${port}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('entries');
  });

  it('rejects POST /pause with a mismatched Origin (403) and leaves paused state unchanged', async () => {
    expect(recorder.paused).toBe(false);
    const res = await fetch(`${baseUrl}${BASE_PATH}/api/pause?paused=true`, {
      method: 'POST',
      headers: { Origin: 'http://evil.example' },
    });
    expect(res.status).toBe(403);
    expect(recorder.paused).toBe(false);
  });

  it('allows requests with no Origin header (existing behavior unchanged)', async () => {
    const res = await fetch(`${baseUrl}${BASE_PATH}/api/entries`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('entries');
  });
});
