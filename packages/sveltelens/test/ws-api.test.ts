import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import WebSocket from 'ws';
import type { HttpServer } from 'vite';
import { MemoryStorage } from '../src/storage/memory.js';
import { Recorder } from '../src/recorder.js';
import { installStreamServer } from '../src/api/ws.js';

const BASE_PATH = '/__sveltelens';

describe('ws stream server origin checks', () => {
  let server: http.Server;
  let wsBaseUrl: string;
  let storage: MemoryStorage;
  let recorder: Recorder;
  let uninstall: () => void;

  beforeAll(async () => {
    server = http.createServer((_req, res) => {
      res.statusCode = 404;
      res.end();
    });
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const { port } = server.address() as AddressInfo;
    wsBaseUrl = `ws://localhost:${port}`;
  });

  afterAll(() => {
    server.close();
  });

  beforeEach(() => {
    storage = new MemoryStorage(50);
    recorder = new Recorder(storage);
    uninstall = installStreamServer(server as unknown as HttpServer, recorder, BASE_PATH);
  });

  afterEach(() => uninstall());

  function attemptConnection(headers: Record<string, string>): Promise<'connected' | 'rejected'> {
    return new Promise((resolve) => {
      const ws = new WebSocket(`${wsBaseUrl}${BASE_PATH}/api/stream`, { headers });
      const timer = setTimeout(() => {
        ws.terminate();
        resolve('rejected');
      }, 1000);

      ws.once('open', () => {
        clearTimeout(timer);
        ws.close();
        resolve('connected');
      });

      ws.once('error', () => {
        clearTimeout(timer);
        resolve('rejected');
      });

      ws.once('close', (code) => {
        // A close before 'open' fired (e.g. server destroyed the socket
        // during the handshake) also counts as rejected.
        if (code !== 1000) {
          clearTimeout(timer);
          resolve('rejected');
        }
      });
    });
  }

  it('rejects an upgrade with a cross-origin Origin header', async () => {
    const result = await attemptConnection({ Origin: 'http://evil.example' });
    expect(result).toBe('rejected');
  });

  it('accepts an upgrade when Origin matches Host', async () => {
    const { port } = server.address() as AddressInfo;
    const result = await attemptConnection({ Origin: `http://localhost:${port}` });
    expect(result).toBe('connected');
  });

  it('accepts an upgrade with no Origin header (non-browser clients)', async () => {
    const result = await attemptConnection({});
    expect(result).toBe('connected');
  });
});
