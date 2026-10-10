import { DEFAULT_PATH } from './config.js';
import { BODY_TRUNCATE_BYTES, type BrowserRequestReport } from './types.js';

/**
 * Browser request capture: patches `window.fetch` and reports each
 * call to the dev server, which redacts and records it. Works for frontend-only apps
 * (SPA mode, adapter-static) since nothing here depends on a server request.
 *
 * Call it from `hooks.client.ts` (or a plain Vite app's entry) behind a dev check:
 *
 *   import { installClient } from 'sveltelens/client';
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
    const request = new Request(input, init);
    // Don't record our own reports or the dashboard's API calls.
    if (new URL(request.url).pathname.startsWith(path)) return original(request);

    const start = performance.now();
    const requestHeaders = headersToObject(request.headers);
    const requestBody = await readBody(request.clone(), requestHeaders['content-type'] ?? null);

    let response: Response;
    try {
      response = await original(request);
    } catch (err) {
      report({
        method: request.method,
        url: request.url,
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
        method: request.method,
        url: request.url,
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

function headersToObject(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {};
  headers.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

async function readBody(
  source: Request | Response,
  contentType: string | null
): Promise<BrowserRequestReport['requestBody']> {
  // An event stream never ends, so reading it would hang (and buffer) forever.
  if (!source.body || contentType?.includes('text/event-stream')) return null;
  try {
    const text = await source.text();
    // ponytail: cap what we ship to the server; one char >= one byte, so the server
    // still sees it as over the limit and marks it truncated. Size is then a lower bound.
    return { text: text.slice(0, BODY_TRUNCATE_BYTES + 1), contentType };
  } catch {
    return null;
  }
}
