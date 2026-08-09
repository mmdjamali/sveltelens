import diagnosticsChannel from 'node:diagnostics_channel';
import { AsyncLocalStorage } from 'node:async_hooks';
import type { Recorder } from '../recorder.js';
import { captureBody, headersToObject, redactHeaders } from '../utils.js';
import { currentRequestStart } from '../context.js';

function offsetFromRequestStart(): number | null {
  const requestStart = currentRequestStart();
  return requestStart !== null ? Math.max(0, Math.round(performance.now() - requestStart)) : null;
}

// Marks the async scope of a fetch() call we've already patched, so the undici
// diagnostics_channel subscriber (which fires for the same call, since global
// fetch is undici-backed) doesn't double-record it.
const fetchPatchScope = new AsyncLocalStorage<true>();

interface UndiciRequest {
  origin: string;
  path: string;
  method: string;
  headers: string | string[];
}

function parseRawHeaders(raw: string | string[] | undefined): Record<string, string> {
  const result: Record<string, string> = {};
  if (!raw) return result;
  const lines = Array.isArray(raw) ? raw : raw.split('\r\n');
  if (Array.isArray(raw)) {
    for (let i = 0; i < raw.length; i += 2) {
      if (raw[i]) result[raw[i]] = raw[i + 1] ?? '';
    }
    return result;
  }
  for (const line of lines) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    result[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return result;
}

function parseHeaderBuffers(buffers: Buffer[] | undefined): Record<string, string> {
  const result: Record<string, string> = {};
  if (!buffers) return result;
  for (let i = 0; i < buffers.length; i += 2) {
    const key = buffers[i]?.toString();
    const value = buffers[i + 1]?.toString();
    if (key) result[key] = value ?? '';
  }
  return result;
}

export function installHttpClientInterceptor(
  recorder: Recorder,
  redact: string[],
  redactBodyKeys: string[]
): () => void {
  const pending = new WeakMap<
    object,
    {
      start: number;
      offsetMs: number | null;
      method: string;
      url: string;
      requestHeaders: Record<string, string>;
    }
  >();

  const onCreate = (message: unknown) => {
    if (fetchPatchScope.getStore()) return;
    const { request } = message as { request: UndiciRequest };
    pending.set(request, {
      start: Date.now(),
      offsetMs: offsetFromRequestStart(),
      method: request.method,
      url: request.origin + request.path,
      requestHeaders: redactHeaders(parseRawHeaders(request.headers), redact),
    });
  };

  const onHeaders = (message: unknown) => {
    if (fetchPatchScope.getStore()) return;
    const { request, response } = message as {
      request: UndiciRequest;
      response: { statusCode: number; headers: Buffer[] };
    };
    const entry = pending.get(request);
    if (!entry) return;
    recorder.record({
      type: 'client-request',
      durationMs: Date.now() - entry.start,
      offsetMs: entry.offsetMs,
      payload: {
        method: entry.method,
        url: entry.url,
        status: response.statusCode,
        requestHeaders: entry.requestHeaders,
        responseHeaders: redactHeaders(parseHeaderBuffers(response.headers), redact),
        requestBody: null,
        responseBody: null,
        error: null,
      },
    });
    pending.delete(request);
  };

  const onError = (message: unknown) => {
    if (fetchPatchScope.getStore()) return;
    const { request, error } = message as { request: UndiciRequest; error: Error };
    const entry = pending.get(request);
    if (!entry) return;
    recorder.record({
      type: 'client-request',
      durationMs: Date.now() - entry.start,
      offsetMs: entry.offsetMs,
      payload: {
        method: entry.method,
        url: entry.url,
        status: null,
        requestHeaders: entry.requestHeaders,
        responseHeaders: {},
        requestBody: null,
        responseBody: null,
        error: error?.message ?? String(error),
      },
    });
    pending.delete(request);
  };

  diagnosticsChannel.channel('undici:request:create').subscribe(onCreate);
  diagnosticsChannel.channel('undici:request:headers').subscribe(onHeaders);
  diagnosticsChannel.channel('undici:request:error').subscribe(onError);

  const uninstallFetch = installFetchPatch(recorder, redact, redactBodyKeys);

  return () => {
    diagnosticsChannel.channel('undici:request:create').unsubscribe(onCreate);
    diagnosticsChannel.channel('undici:request:headers').unsubscribe(onHeaders);
    diagnosticsChannel.channel('undici:request:error').unsubscribe(onError);
    uninstallFetch();
  };
}

/** Fallback path: captures request/response bodies via clone(), which the raw
 * undici channel data does not expose. Runs inside fetchPatchScope so the
 * channel subscribers above skip the same call. */
function installFetchPatch(recorder: Recorder, redact: string[], redactBodyKeys: string[]): () => void {
  const original = globalThis.fetch;
  if (!original) return () => {};

  const patched: typeof fetch = async (input, init) => {
    return fetchPatchScope.run(true, async () => {
      const start = Date.now();
      const offsetMs = offsetFromRequestStart();
      const request = input instanceof Request ? input : new Request(input, init);
      const method = init?.method ?? request.method ?? 'GET';
      const url = request.url;
      const requestHeaders = redactHeaders(headersToObject(request.headers), redact);

      let requestBodyText: string | null = null;
      if (!recorder.paused) {
        try {
          if (init?.body && typeof init.body === 'string') {
            requestBodyText = init.body;
          } else if (input instanceof Request) {
            requestBodyText = await input.clone().text().catch(() => null);
          }
        } catch {
          requestBodyText = null;
        }
      }

      try {
        const response = await original(input, init);
        let responseBodyText: string | null = null;
        if (!recorder.paused) {
          const clone = response.clone();
          try {
            responseBodyText = await clone.text();
          } catch {
            responseBodyText = null;
          }
        }
        recorder.record({
          type: 'client-request',
          durationMs: Date.now() - start,
          offsetMs,
          payload: {
            method,
            url,
            status: response.status,
            requestHeaders,
            responseHeaders: redactHeaders(headersToObject(response.headers), redact),
            requestBody: captureBody(requestBodyText, requestHeaders['content-type'] ?? null, redactBodyKeys),
            responseBody: captureBody(responseBodyText, response.headers.get('content-type'), redactBodyKeys),
            error: null,
          },
        });
        return response;
      } catch (err) {
        recorder.record({
          type: 'client-request',
          durationMs: Date.now() - start,
          offsetMs,
          payload: {
            method,
            url,
            status: null,
            requestHeaders,
            responseHeaders: {},
            requestBody: captureBody(requestBodyText, requestHeaders['content-type'] ?? null, redactBodyKeys),
            responseBody: null,
            error: err instanceof Error ? err.message : String(err),
          },
        });
        throw err;
      }
    });
  };

  globalThis.fetch = patched;
  return () => {
    globalThis.fetch = original;
  };
}
