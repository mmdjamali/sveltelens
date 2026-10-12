import { DEFAULT_PATH } from './config.js';
import { BODY_TRUNCATE_BYTES, type BrowserRequestReport } from './types.js';

/**
 * Browser request capture: patches `window.fetch` and reports each
 * call to the dev server, which redacts and records it. Works for frontend-only apps
 * (SPA mode, adapter-static) since nothing here depends on a server request.
 *
 * Call it from `hooks.client.ts` (or a plain Vite app's entry) behind a dev check:
 *
 *   import { installClient } from '@mmdjamali/sveltelens/client';
 *   if (import.meta.env.DEV) installClient();
 *
 * Returns an uninstall function. Pass `path` if the plugin was given a custom one.
 */
export function installClient(path: string = DEFAULT_PATH): () => void {
  const original = globalThis.fetch;
  if (!original) return () => {};
  const endpoint = `${path}/api/browser-requests`;

  const report = (body: BrowserRequestReport) => {
    original(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }).catch(() => {});
  };

  const patched: typeof fetch = async (input, init) => {
    // Don't record our own reports or the dashboard's API calls.
    if (isLensUrl(input, path)) return original(input, init);

    const start = performance.now();
    const method = (init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase();
    const url = resolveUrl(input);
    const requestHeaders = requestHeaderRecord(input, init);
    // ofetch calls fetch(url, options) with the payload on options.body. Rebuilding
    // that via `new Request` leaves `.body` empty in the browser, so read init and
    // forward the original arguments.
    const requestBody = await readRequestBody(input, init, requestHeaders['content-type'] ?? null);

    let response: Response;
    try {
      response = await original(input, init);
    } catch (err) {
      report({
        method,
        url,
        status: null,
        durationMs: Math.round(performance.now() - start),
        requestHeaders,
        responseHeaders: {},
        requestBody,
        responseBody: null,
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }

    // Read the clone in the background so the caller gets the response without waiting on the body.
    const durationMs = Math.round(performance.now() - start);
    readBody(response.clone(), response.headers.get('content-type')).then((responseBody) =>
      report({
        method,
        url,
        status: response.status,
        durationMs,
        requestHeaders,
        responseHeaders: headersToObject(response.headers),
        requestBody,
        responseBody,
        error: null,
      })
    );
    return response;
  };

  globalThis.fetch = patched;
  return () => {
    globalThis.fetch = original;
  };
}

function isLensUrl(input: RequestInfo | URL, path: string): boolean {
  try {
    const base = typeof location !== 'undefined' ? location.href : 'http://localhost';
    return new URL(resolveUrl(input), base).pathname.startsWith(path);
  } catch {
    return false;
  }
}

function resolveUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

function requestHeaderRecord(input: RequestInfo | URL, init?: RequestInit): Record<string, string> {
  const headers = new Headers(input instanceof Request ? input.headers : undefined);
  new Headers(init?.headers).forEach((value, key) => headers.set(key, value));
  return headersToObject(headers);
}

function headersToObject(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {};
  headers.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

function clip(text: string, contentType: string | null): NonNullable<BrowserRequestReport['requestBody']> {
  // ponytail: cap what we ship to the server; one char >= one byte, so the server
  // still sees it as over the limit and marks it truncated. Size is then a lower bound.
  return { text: text.slice(0, BODY_TRUNCATE_BYTES + 1), contentType };
}

async function readRequestBody(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  contentType: string | null
): Promise<BrowserRequestReport['requestBody']> {
  if (contentType?.includes('text/event-stream')) return null;

  try {
    const fromInit = await textFromBodyInit(init?.body);
    if (fromInit !== undefined) {
      // A string body with no content-type is still text. Without a type the server
      // treats the payload as binary and drops it.
      return clip(fromInit, contentType ?? 'text/plain');
    }

    if (init?.body == null && input instanceof Request) return readBody(input.clone(), contentType);
  } catch {
    return null;
  }
  return null;
}

/** `undefined` means this init has no readable body (absent, or a stream we must not consume). */
async function textFromBodyInit(body: BodyInit | null | undefined): Promise<string | undefined> {
  if (body == null) return undefined;
  if (typeof body === 'string') return body;
  if (body instanceof URLSearchParams) return body.toString();
  if (typeof Blob !== 'undefined' && body instanceof Blob) return body.text();
  if (body instanceof ArrayBuffer) return new TextDecoder().decode(body);
  if (ArrayBuffer.isView(body)) return new TextDecoder().decode(body);
  if (typeof FormData !== 'undefined' && body instanceof FormData) {
    // FormData can be sent more than once; copying it into a Request does not consume it.
    return new Request('http://localhost/', { method: 'POST', body }).text();
  }
  return undefined;
}

async function readBody(
  source: Request | Response,
  contentType: string | null
): Promise<BrowserRequestReport['requestBody']> {
  // An event stream never ends, so reading it would hang (and buffer) forever.
  if (!source.body || contentType?.includes('text/event-stream')) return null;
  try {
    const text = await source.text();
    return clip(text, contentType);
  } catch {
    return null;
  }
}
