import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { MemoryStorage } from '../src/storage/memory.js';
import { Recorder } from '../src/recorder.js';
import { createMcpMiddleware } from '../src/api/mcp.js';

const BASE_PATH = '/__sveltelens';

describe('mcp endpoint', () => {
  let server: http.Server;
  let url: string;
  let storage: MemoryStorage;
  let recorder: Recorder;

  beforeEach(async () => {
    storage = new MemoryStorage(50);
    recorder = new Recorder(storage);
    const middleware = createMcpMiddleware(storage, BASE_PATH);
    server = http.createServer((req, res) =>
      middleware(req, res, () => {
        res.statusCode = 404;
        res.end();
      })
    );
    await new Promise<void>((resolve) => server.listen(0, resolve));
    url = `http://localhost:${(server.address() as AddressInfo).port}${BASE_PATH}/mcp`;
  });

  afterEach(() => {
    server.close();
  });

  const rpc = async (method: string, params?: object) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    });
    return res.json();
  };
  const call = async (name: string, args: object = {}) => {
    const { result } = await rpc('tools/call', { name, arguments: args });
    return { text: result.content[0].text as string, isError: result.isError === true };
  };

  function seed() {
    recorder.record({
      type: 'request',
      requestId: 'r1',
      durationMs: 42,
      payload: {
        method: 'POST',
        path: '/api/cart',
        routeId: '/api/cart',
        status: 500,
        hostname: 'localhost',
        ip: null,
        memoryUsageBytes: null,
        requestHeaders: {},
        responseHeaders: {},
        requestBody: null,
        responseBody: null,
      },
    });
    recorder.record({
      type: 'query',
      requestId: 'r1',
      offsetMs: 5,
      durationMs: 3,
      payload: { sql: 'SELECT * FROM cart', params: [], connection: null, error: 'relation missing' },
    });
    recorder.record({
      type: 'log',
      requestId: null,
      payload: { level: 'warn', message: 'stock low' },
    });
  }

  it('initializes and echoes a supported protocol version', async () => {
    const { result } = await rpc('initialize', { protocolVersion: '2025-03-26', capabilities: {} });
    expect(result.protocolVersion).toBe('2025-03-26');
    expect(result.capabilities.tools).toBeDefined();
  });

  it('acks notifications with 202 and rejects GET with 405', async () => {
    const note = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }),
    });
    expect(note.status).toBe(202);
    expect((await fetch(url)).status).toBe(405);
  });

  it('does not reply to notifications for known methods', async () => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'tools/list' }),
    });
    expect(res.status).toBe(202);
  });

  it('answers oversized bodies with 413', async () => {
    const res = await fetch(url, { method: 'POST', body: 'x'.repeat(70 * 1024) });
    expect(res.status).toBe(413);
  });

  it('get_request rejects an empty id instead of dumping everything', async () => {
    seed();
    expect((await call('get_request', { id: '' })).isError).toBe(true);
  });

  it('rejects cross-origin requests', async () => {
    const res = await fetch(url, { method: 'POST', headers: { Origin: 'http://evil.example' }, body: '{}' });
    expect(res.status).toBe(403);
  });

  it('lists tools', async () => {
    const { result } = await rpc('tools/list');
    expect(result.tools.map((t: { name: string }) => t.name)).toEqual([
      'list_entries',
      'get_entry',
      'get_request',
      'clear_entries',
    ]);
  });

  it('list_entries summarizes, filters and pages', async () => {
    seed();
    const all = await call('list_entries');
    expect(all.text.split('\n')).toHaveLength(3);
    expect(all.text).toContain('request POST /api/cart → 500 (42ms) [requestId r1, route /api/cart]');

    const errors = await call('list_entries', { errorsOnly: true });
    expect(errors.text.split('\n')).toHaveLength(2);
    expect(errors.text).not.toContain('stock low');

    const searched = await call('list_entries', { search: 'STOCK' });
    expect(searched.text).toContain('log warn stock low');

    const page1 = await call('list_entries', { limit: 2 });
    const cursor = page1.text.match(/nextCursor: (\S+)/)?.[1];
    expect(cursor).toBeTruthy();
    const page2 = await call('list_entries', { limit: 2, cursor });
    expect(page2.text).toContain('request POST');
  });

  it('get_request returns the timeline by requestId or request entry id', async () => {
    seed();
    const byRequestId = await call('get_request', { id: 'r1' });
    const lines = byRequestId.text.split('\n');
    expect(lines[0]).toContain('request POST /api/cart');
    expect(lines[1]).toMatch(/^ {2}\+5ms .* query \(3ms\) SELECT \* FROM cart \[ERR: relation missing\]$/);

    const requestEntryId = lines[0].split(' ')[0];
    expect((await call('get_request', { id: requestEntryId })).text).toBe(byRequestId.text);
  });

  it('get_entry returns full JSON or an error', async () => {
    seed();
    const id = storage.list({ type: 'query' }).entries[0].id;
    expect(JSON.parse((await call('get_entry', { id })).text).payload.sql).toBe('SELECT * FROM cart');
    expect((await call('get_entry', { id: 'nope' })).isError).toBe(true);
  });

  it('clear_entries empties storage', async () => {
    seed();
    await call('clear_entries');
    expect((await call('list_entries')).text).toBe('No entries.');
  });

  it('returns method-not-found for unknown methods', async () => {
    const res = await rpc('resources/list');
    expect(res.error.code).toBe(-32601);
  });
});
