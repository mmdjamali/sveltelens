import { describe, it, expect, vi } from 'vitest';
import { parseActionResult, sveltelensHandle, sveltelensHandleError } from '../src/hook.js';
import { MemoryStorage } from '../src/storage/memory.js';
import { Recorder } from '../src/recorder.js';
import { resolveConfig } from '../src/config.js';
import { setSveltelensState } from '../src/state.js';
import type { ClientRequestPayload, RequestPayload, ActionPayload, ExceptionPayload } from '../src/types.js';

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
function fakeEvent(
  fetchImpl: typeof fetch,
  overrides: { url?: string; request?: Request; routeId?: string | null } = {}
) {
  const url = new URL(overrides.url ?? 'http://localhost/page');
  return {
    url,
    request: overrides.request ?? new Request(url),
    route: { id: overrides.routeId ?? '/page' },
    getClientAddress: () => '127.0.0.1',
    fetch: fetchImpl,
  } as unknown as Parameters<typeof sveltelensHandle>[0]['event'];
}

/** A no-op fetch stand-in for tests that never invoke `event.fetch`. */
const noopFetch = (async () => new Response('unused')) as typeof fetch;

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

  it('redacts the Set-Cookie response header by default', async () => {
    const storage = new MemoryStorage(50);
    const recorder = new Recorder(storage);
    setSveltelensState({ recorder, config: resolveConfig() });

    const shortCircuitFetch = (async () =>
      new Response('{"ok":true}', { status: 200, headers: { 'set-cookie': 'session=secret' } })) as typeof fetch;

    const event = fakeEvent(shortCircuitFetch);
    await sveltelensHandle({
      event,
      resolve: async (e) => {
        await e.fetch('/api/widgets');
        return new Response('page');
      },
    } as never);

    const entries = storage.list({ type: 'client-request' }).entries;
    const payload = entries[0].payload as ClientRequestPayload;
    expect(payload.responseHeaders['set-cookie']).toBe('[redacted]');
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

/** A POST request whose URL search params encode a form action, per extractActionName/isFormAction. */
function fakeActionEvent(url: string, resultBody: unknown, resultStatus = 200) {
  const request = new Request(url, { method: 'POST', body: 'field=value' });
  const event = fakeEvent(noopFetch, { url, request });
  return {
    event,
    resolve: async () =>
      new Response(JSON.stringify(resultBody), {
        status: resultStatus,
        headers: { 'content-type': 'application/json' },
      }),
  };
}

describe('sveltelensHandle recording', () => {
  it('records a type: request entry for a plain non-action GET request', async () => {
    const storage = new MemoryStorage(50);
    const recorder = new Recorder(storage);
    setSveltelensState({ recorder, config: resolveConfig() });

    const event = fakeEvent(noopFetch);
    await sveltelensHandle({
      event,
      resolve: async () => new Response('hello', { status: 200, headers: { 'content-type': 'text/plain' } }),
    } as never);

    const entries = storage.list({ type: 'request' }).entries;
    expect(entries).toHaveLength(1);
    const payload = entries[0].payload as RequestPayload;
    expect(payload.method).toBe('GET');
    expect(payload.path).toBe('/page');
    expect(payload.status).toBe(200);
    expect(payload.responseBody?.text).toBe('hello');
  });

  it('records a type: action entry with actionName/resultType for a successful form action', async () => {
    const storage = new MemoryStorage(50);
    const recorder = new Recorder(storage);
    setSveltelensState({ recorder, config: resolveConfig() });

    const { event, resolve } = fakeActionEvent('http://localhost/page?/login', {
      type: 'success',
      status: 200,
      data: {},
    });

    await sveltelensHandle({ event, resolve } as never);

    const entries = storage.list({ type: 'action' }).entries;
    expect(entries).toHaveLength(1);
    const payload = entries[0].payload as ActionPayload;
    expect(payload.actionName).toBe('login');
    expect(payload.resultType).toBe('success');
    expect(payload.status).toBe(200);
  });

  it('short-circuits on an ignored path: resolve still runs but nothing is recorded', async () => {
    const storage = new MemoryStorage(50);
    const recorder = new Recorder(storage);
    setSveltelensState({ recorder, config: resolveConfig({ ignore: ['/skip'] }) });

    const event = fakeEvent(noopFetch, { url: 'http://localhost/skip' });
    const resolve = vi.fn(async () => new Response('ok', { status: 200 }));

    const response = await sveltelensHandle({ event, resolve } as never);

    expect(resolve).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(200);
    expect(storage.list().entries).toHaveLength(0);
  });

  it('records an exception + a 500 request entry, then rethrows, when resolve throws for a non-action request', async () => {
    const storage = new MemoryStorage(50);
    const recorder = new Recorder(storage);
    setSveltelensState({ recorder, config: resolveConfig() });

    const event = fakeEvent(noopFetch);
    const boom = new Error('boom');

    await expect(
      sveltelensHandle({
        event,
        resolve: async () => {
          throw boom;
        },
      } as never)
    ).rejects.toThrow('boom');

    const exceptionEntries = storage.list({ type: 'exception' }).entries;
    expect(exceptionEntries).toHaveLength(1);
    expect((exceptionEntries[0].payload as ExceptionPayload).message).toBe('boom');

    const requestEntries = storage.list({ type: 'request' }).entries;
    expect(requestEntries).toHaveLength(1);
    expect((requestEntries[0].payload as RequestPayload).status).toBe(500);
  });

  it('records an exception + a 500 action entry (resultType: error), then rethrows, when resolve throws for a form action', async () => {
    const storage = new MemoryStorage(50);
    const recorder = new Recorder(storage);
    setSveltelensState({ recorder, config: resolveConfig() });

    const url = 'http://localhost/page?/login';
    const request = new Request(url, { method: 'POST', body: 'field=value' });
    const event = fakeEvent(noopFetch, { url, request });
    const boom = new Error('boom');

    await expect(
      sveltelensHandle({
        event,
        resolve: async () => {
          throw boom;
        },
      } as never)
    ).rejects.toThrow('boom');

    const exceptionEntries = storage.list({ type: 'exception' }).entries;
    expect(exceptionEntries).toHaveLength(1);
    expect((exceptionEntries[0].payload as ExceptionPayload).message).toBe('boom');

    const actionEntries = storage.list({ type: 'action' }).entries;
    expect(actionEntries).toHaveLength(1);
    const payload = actionEntries[0].payload as ActionPayload;
    expect(payload.status).toBe(500);
    expect(payload.resultType).toBe('error');
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

describe('sveltelensHandle body capture gating by pause state', () => {
  it('skips cloning/reading request and response bodies while paused', async () => {
    const storage = new MemoryStorage(50);
    const recorder = new Recorder(storage);
    recorder.paused = true;
    setSveltelensState({ recorder, config: resolveConfig() });

    const event = fakeEvent((async () => new Response('unused')) as typeof fetch);
    const requestCloneSpy = vi.spyOn(event.request, 'clone');
    let responseCloneSpy: ReturnType<typeof vi.spyOn> | undefined;

    await sveltelensHandle({
      event,
      resolve: async () => {
        const response = new Response('page body');
        responseCloneSpy = vi.spyOn(response, 'clone');
        return response;
      },
    } as never);

    expect(requestCloneSpy).not.toHaveBeenCalled();
    expect(responseCloneSpy).not.toHaveBeenCalled();
    // Belt-and-suspenders: paused also means nothing gets recorded at all.
    expect(storage.list().entries).toHaveLength(0);
  });

  it('clones/reads request and response bodies when not paused (control)', async () => {
    const storage = new MemoryStorage(50);
    const recorder = new Recorder(storage);
    setSveltelensState({ recorder, config: resolveConfig() });

    const event = fakeEvent((async () => new Response('unused')) as typeof fetch);
    const requestCloneSpy = vi.spyOn(event.request, 'clone');
    let responseCloneSpy: ReturnType<typeof vi.spyOn> | undefined;

    await sveltelensHandle({
      event,
      resolve: async () => {
        const response = new Response('page body');
        responseCloneSpy = vi.spyOn(response, 'clone');
        return response;
      },
    } as never);

    expect(requestCloneSpy).toHaveBeenCalled();
    expect(responseCloneSpy).toHaveBeenCalled();

    const entries = storage.list({ type: 'request' }).entries;
    expect(entries).toHaveLength(1);
    const payload = entries[0].payload as RequestPayload;
    expect(payload.responseBody?.text).toBe('page body');
  });
});

describe('sveltelensHandleError', () => {
  it('records a type: exception entry when the config is enabled', () => {
    const storage = new MemoryStorage(50);
    const recorder = new Recorder(storage);
    setSveltelensState({ recorder, config: resolveConfig() });

    sveltelensHandleError({ error: new Error('load failed') } as never);

    const entries = storage.list({ type: 'exception' }).entries;
    expect(entries).toHaveLength(1);
    expect((entries[0].payload as ExceptionPayload).message).toBe('load failed');
  });

  it('does not record anything when the config is disabled', () => {
    const storage = new MemoryStorage(50);
    const recorder = new Recorder(storage);
    setSveltelensState({ recorder, config: resolveConfig({ enabled: false }) });

    sveltelensHandleError({ error: new Error('load failed') } as never);

    expect(storage.list().entries).toHaveLength(0);
  });
});
