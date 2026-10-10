import { describe, it, expect, afterEach, vi } from 'vitest';
import {
  fetchEntries,
  fetchEntry,
  fetchCounts,
  fetchPaused,
  setPaused,
  clearEntries,
} from '../src/lib/api';

function jsonResponse(body: unknown, init: { status?: number; ok?: boolean } = {}) {
  const status = init.status ?? 200;
  return {
    ok: init.ok ?? (status >= 200 && status < 300),
    status,
    json: async () => body,
  } as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchEntries', () => {
  it('with no filter calls fetch with an empty query string and returns the parsed body', async () => {
    const body = { entries: [], nextCursor: null };
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(body));
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchEntries();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const calledUrl = fetchMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain('/api/entries?');
    expect(new URL(calledUrl, 'http://x').search).toBe('');
    expect(result).toEqual(body);
  });

  it('with a filter includes the params in the query string', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ entries: [], nextCursor: null }));
    vi.stubGlobal('fetch', fetchMock);

    await fetchEntries({ type: 'query', limit: 10 });

    const calledUrl = fetchMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain('type=query&limit=10');
  });
});

describe('fetchEntry', () => {
  it('resolves to null on a 404', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(null, { status: 404, ok: false }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchEntry('missing')).resolves.toBeNull();
  });

  it('throws on a non-ok, non-404 status', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(null, { status: 500, ok: false }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchEntry('broken')).rejects.toThrow();
  });
});

describe('fetchCounts', () => {
  it('returns the parsed JSON body', async () => {
    const body = { request: 1, 'client-request': 0, 'browser-request': 0, query: 2, log: 0, exception: 0, action: 0 };
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(body));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchCounts()).resolves.toEqual(body);
  });
});

describe('fetchPaused', () => {
  it('returns the paused boolean field from the body', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ paused: true }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchPaused()).resolves.toBe(true);
  });
});

describe('setPaused', () => {
  it('POSTs with paused in the URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(null));
    vi.stubGlobal('fetch', fetchMock);

    await setPaused(true);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('paused=true');
    expect(options.method).toBe('POST');
  });
});

describe('clearEntries', () => {
  it('calls fetch with method DELETE', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(null));
    vi.stubGlobal('fetch', fetchMock);

    await clearEntries();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(options.method).toBe('DELETE');
  });
});

// connectStream's own WebSocket/location.href wiring is untested here — it needs
// a browser-like test environment (this suite runs under `environment: 'node'`).
// See plan 013's "Scope note" for the reasoning.
