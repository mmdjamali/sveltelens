import { describe, it, expect } from 'vitest';
import { parseActionResult, sveltelensHandle } from '../src/hook.js';
import { MemoryStorage } from '../src/storage/memory.js';
import { Recorder } from '../src/recorder.js';
import { resolveConfig } from '../src/config.js';
import { setSveltelensState } from '../src/state.js';
import type { ClientRequestPayload, RequestPayload } from '../src/types.js';

describe('parseActionResult', () => {
  it('recovers status and location from a JSON-wrapped redirect (use:enhance)', () => {
    const body = JSON.stringify({ type: 'redirect', status: 303, location: '/thanks' });
    const result = parseActionResult('application/json', body, 200, null);
    expect(result).toEqual({ status: 303, location: '/thanks', resultType: 'redirect' });
  });

  it('recovers status from a JSON-wrapped failure', () => {
    const body = JSON.stringify({ type: 'failure', status: 422, data: {} });
    const result = parseActionResult('application/json', body, 200, null);
    expect(result).toEqual({ status: 422, location: null, resultType: 'failure' });
  });

  it('recovers status from a JSON-wrapped success', () => {
    const body = JSON.stringify({ type: 'success', status: 200, data: {} });
    const result = parseActionResult('application/json', body, 200, null);
    expect(result).toEqual({ status: 200, location: null, resultType: 'success' });
  });

  it('trusts the response status for a JSON-wrapped error, since SvelteKit sets it accurately there', () => {
    const body = JSON.stringify({ type: 'error', error: { message: 'boom' } });
    const result = parseActionResult('application/json', body, 500, null);
    expect(result).toEqual({ status: 500, location: null, resultType: 'error' });
  });

  it('falls back to response status/location for full-page (non-JSON) submits', () => {
    const result = parseActionResult('text/html', '<html></html>', 303, '/thanks');
    expect(result).toEqual({ status: 303, location: '/thanks', resultType: null });
  });

  it('falls back safely when content-type says JSON but body is not an ActionResult', () => {
    const result = parseActionResult('application/json', JSON.stringify({ foo: 'bar' }), 200, null);
    expect(result).toEqual({ status: 200, location: null, resultType: null });
  });

  it('falls back safely on malformed JSON', () => {
    const result = parseActionResult('application/json', '{not json', 200, null);
    expect(result).toEqual({ status: 200, location: null, resultType: null });
  });
});

/** Minimal RequestEvent stub — just enough surface for sveltelensHandle. */
function fakeEvent(fetchImpl: typeof fetch) {
  return {
    url: new URL('http://localhost/page'),
    request: new Request('http://localhost/page'),
    route: { id: '/page' },
    getClientAddress: () => '127.0.0.1',
    fetch: fetchImpl,
  } as unknown as Parameters<typeof sveltelensHandle>[0]['event'];
}

describe('sveltelensHandle event.fetch wrapping', () => {
  it('records a same-origin event.fetch call that never touches real HTTP (the short-circuit case)', async () => {
    const storage = new MemoryStorage(50);
    const recorder = new Recorder(storage);
    setSveltelensState({ recorder, config: resolveConfig() });

    // Stands in for SvelteKit's internal short-circuit: resolves straight to a Response,
    // no network call, so nothing else in sveltelens could ever see this call.
    const shortCircuitFetch = (async () => new Response('{"ok":true}', { status: 201 })) as typeof fetch;

    const event = fakeEvent(shortCircuitFetch);
    await sveltelensHandle({
      event,
      resolve: async (e) => {
        await e.fetch('/api/widgets');
        return new Response('page');
      },
    } as never);

    const entries = storage.list({ type: 'client-request' }).entries;
    expect(entries).toHaveLength(1);
    const payload = entries[0].payload as ClientRequestPayload;
    expect(payload.status).toBe(201);
    expect(payload.url).toBe('http://localhost/api/widgets');
  });

  it('passes cross-origin event.fetch calls straight through without recording (already captured elsewhere)', async () => {
    const storage = new MemoryStorage(50);
    const recorder = new Recorder(storage);
    setSveltelensState({ recorder, config: resolveConfig() });

    const realFetch = (async () => new Response('external', { status: 200 })) as typeof fetch;
    const event = fakeEvent(realFetch);

    await sveltelensHandle({
      event,
      resolve: async (e) => {
        await e.fetch('https://api.example.com/data');
        return new Response('page');
      },
    } as never);

    expect(storage.list({ type: 'client-request' }).entries).toHaveLength(0);
  });
});

describe('sveltelensHandle body redaction', () => {
  it('redacts a password field in a JSON request/response body under default config', async () => {
    const storage = new MemoryStorage(50);
    const recorder = new Recorder(storage);
    setSveltelensState({ recorder, config: resolveConfig() });

    const event = {
      url: new URL('http://localhost/api/login'),
      request: new Request('http://localhost/api/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password: 'hunter2', username: 'bob' }),
      }),
      route: { id: '/api/login' },
      getClientAddress: () => '127.0.0.1',
      fetch: (async () => new Response('unused')) as typeof fetch,
    } as unknown as Parameters<typeof sveltelensHandle>[0]['event'];

    await sveltelensHandle({
      event,
      resolve: async () =>
        new Response(JSON.stringify({ token: 'secret-token-value', ok: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
    } as never);

    const entries = storage.list({ type: 'request' }).entries;
    expect(entries).toHaveLength(1);
    const payload = entries[0].payload as RequestPayload;

    expect(payload.requestBody?.text).not.toBeNull();
    expect(JSON.parse(payload.requestBody!.text as string)).toEqual({
      password: '[redacted]',
      username: 'bob',
    });

    expect(payload.responseBody?.text).not.toBeNull();
    expect(JSON.parse(payload.responseBody!.text as string)).toEqual({
      token: '[redacted]',
      ok: true,
    });
  });
});
