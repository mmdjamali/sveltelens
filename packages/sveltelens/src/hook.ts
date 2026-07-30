import os from 'node:os';
import type { Handle, HandleServerError } from '@sveltejs/kit';
import type { ActionResultType } from './types.js';
import type { Recorder } from './recorder.js';
import { getSveltelensState } from './state.js';
import { requestContext } from './context.js';
import { generateId, redactHeaders, headersToObject, captureBody, matchesIgnore } from './utils.js';
import { recordException } from './intercept/exceptions.js';

const hostname = os.hostname();

const ACTION_RESULT_TYPES = new Set(['success', 'failure', 'redirect', 'error']);

interface ParsedActionResult {
  status: number;
  location: string | null;
  resultType: ActionResultType | null;
}

/**
 * For use:enhance/fetch form submits, SvelteKit wraps the ActionResult in a JSON body
 * (`{ type, status, data | location | error }`) and only forwards its real HTTP status
 * for `type: 'error'` — success/failure/redirect all ship over HTTP 200. Parse the body
 * to recover the actual outcome; full-page (non-JS) submits don't use this wrapper and
 * already carry an accurate response status/location, so they fall through unchanged.
 */
export function parseActionResult(
  contentType: string | null,
  bodyText: string | null,
  fallbackStatus: number,
  fallbackLocation: string | null
): ParsedActionResult {
  if (contentType?.includes('application/json') && bodyText) {
    try {
      const body = JSON.parse(bodyText);
      if (body && typeof body === 'object' && ACTION_RESULT_TYPES.has(body.type)) {
        const resultType = body.type as ActionResultType;
        return {
          status: resultType === 'error' ? fallbackStatus : body.status,
          location: resultType === 'redirect' ? (body.location ?? null) : fallbackLocation,
          resultType,
        };
      }
    } catch {
      // Not an ActionResult body (e.g. an actual JSON API route) — fall through.
    }
  }
  return { status: fallbackStatus, location: fallbackLocation, resultType: null };
}

function clientAddressOf(event: Parameters<Handle>[0]['event']): string | null {
  try {
    return event.getClientAddress();
  } catch {
    return null;
  }
}

function extractActionName(url: URL): string {
  for (const key of url.searchParams.keys()) {
    if (key.startsWith('/')) return key.slice(1);
  }
  return '_default';
}

function isFormAction(method: string, contentType: string | null, url: URL): boolean {
  if (method !== 'POST') return false;
  if ([...url.searchParams.keys()].some((k) => k.startsWith('/'))) return true;
  if (contentType?.includes('x-www-form-urlencoded')) return true;
  if (contentType?.includes('multipart/form-data')) return true;
  return false;
}

/**
 * For same-origin/relative URLs, SvelteKit's `event.fetch` short-circuits straight into
 * its own `respond()` in-process (see `@sveltejs/kit/src/runtime/server/fetch.js`) — no
 * real network request happens, so neither undici's `diagnostics_channel` nor the patched
 * `globalThis.fetch` (intercept/http-client.ts) ever see it. Wrap `event.fetch` itself to
 * record those. Cross-origin calls do go over real `fetch` and are already captured there,
 * so they're passed through untouched to avoid double-recording.
 *
 * (Narrow miss: an app with a custom `base` calling its own origin but outside that base
 * also takes SvelteKit's real-network branch — same-origin check alone can't tell the two
 * apart, so that case may double-record. Not worth the extra complexity to special-case.)
 */
function wrapEventFetch(
  event: Parameters<Handle>[0]['event'],
  recorder: Recorder,
  redact: string[],
  requestStart: number
): void {
  const originalFetch = event.fetch;

  event.fetch = async (input, init) => {
    const request =
      input instanceof Request ? input : new Request(new URL(input as string | URL, event.url), init);
    const url = new URL(request.url);

    if (url.origin !== event.url.origin) {
      return originalFetch(input, init);
    }

    const fetchStart = performance.now();
    const method = init?.method ?? request.method;
    const requestHeaders = redactHeaders(headersToObject(request.headers), redact);

    let requestBodyText: string | null = null;
    try {
      requestBodyText = await request.clone().text();
    } catch {
      requestBodyText = null;
    }

    const offsetMs = Math.max(0, Math.round(fetchStart - requestStart));

    try {
      const response = await originalFetch(input, init);
      const clone = response.clone();
      let responseBodyText: string | null = null;
      try {
        responseBodyText = await clone.text();
      } catch {
        responseBodyText = null;
      }
      recorder.record({
        type: 'client-request',
        offsetMs,
        durationMs: Math.round(performance.now() - fetchStart),
        payload: {
          method,
          url: url.toString(),
          status: response.status,
          requestHeaders,
          responseHeaders: redactHeaders(headersToObject(response.headers), redact),
          requestBody: captureBody(requestBodyText, requestHeaders['content-type'] ?? null),
          responseBody: captureBody(responseBodyText, response.headers.get('content-type')),
          error: null,
        },
      });
      return response;
    } catch (err) {
      recorder.record({
        type: 'client-request',
        offsetMs,
        durationMs: Math.round(performance.now() - fetchStart),
        payload: {
          method,
          url: url.toString(),
          status: null,
          requestHeaders,
          responseHeaders: {},
          requestBody: captureBody(requestBodyText, requestHeaders['content-type'] ?? null),
          responseBody: null,
          error: err instanceof Error ? err.message : String(err),
        },
      });
      throw err;
    }
  };
}

/** No-op passthrough when the vite plugin isn't active (e.g. production build). */
export const sveltelensHandle: Handle = async ({ event, resolve }) => {
  const state = getSveltelensState();
  if (!state || !state.config.enabled) return resolve(event);

  const { recorder, config } = state;
  const path = event.url.pathname;
  const pathWithQuery = path + event.url.search;
  if (matchesIgnore(path, config.ignore)) return resolve(event);

  const requestId = generateId();
  const start = performance.now();
  const ip = clientAddressOf(event);
  const requestHeaders = redactHeaders(headersToObject(event.request.headers), config.redactHeaders);
  const contentType = requestHeaders['content-type'] ?? null;

  let requestBodyText: string | null = null;
  try {
    requestBodyText = await event.request.clone().text();
  } catch {
    requestBodyText = null;
  }

  wrapEventFetch(event, recorder, config.redactHeaders, start);

  return requestContext.run({ requestId, startedAt: start }, async () => {
    try {
      const response = await resolve(event);
      const responseClone = response.clone();
      let responseBodyText: string | null = null;
      try {
        responseBodyText = await responseClone.text();
      } catch {
        responseBodyText = null;
      }

      if (isFormAction(event.request.method, contentType, event.url)) {
        const actionResult = parseActionResult(
          response.headers.get('content-type'),
          responseBodyText,
          response.status,
          response.headers.get('location')
        );
        recorder.record({
          type: 'action',
          requestId,
          durationMs: Math.round(performance.now() - start),
          offsetMs: 0,
          payload: {
            method: event.request.method,
            path: pathWithQuery,
            routeId: event.route.id,
            actionName: extractActionName(event.url),
            status: actionResult.status,
            hostname,
            ip,
            memoryUsageBytes: process.memoryUsage().heapUsed,
            requestHeaders,
            responseHeaders: redactHeaders(headersToObject(response.headers), config.redactHeaders),
            requestBody: captureBody(requestBodyText, contentType),
            responseBody: captureBody(responseBodyText, response.headers.get('content-type')),
            location: actionResult.location,
            resultType: actionResult.resultType,
          },
        });
      } else {
        recorder.record({
          type: 'request',
          requestId,
          durationMs: Math.round(performance.now() - start),
          offsetMs: 0,
          payload: {
            method: event.request.method,
            path: pathWithQuery,
            routeId: event.route.id,
            status: response.status,
            hostname,
            ip,
            memoryUsageBytes: process.memoryUsage().heapUsed,
            requestHeaders,
            responseHeaders: redactHeaders(headersToObject(response.headers), config.redactHeaders),
            requestBody: captureBody(requestBodyText, contentType),
            responseBody: captureBody(responseBodyText, response.headers.get('content-type')),
          },
        });
      }

      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      recordException(recorder, error);

      if (isFormAction(event.request.method, contentType, event.url)) {
        recorder.record({
          type: 'action',
          requestId,
          durationMs: Math.round(performance.now() - start),
          offsetMs: 0,
          payload: {
            method: event.request.method,
            path: pathWithQuery,
            routeId: event.route.id,
            actionName: extractActionName(event.url),
            status: 500,
            hostname,
            ip,
            memoryUsageBytes: process.memoryUsage().heapUsed,
            requestHeaders,
            responseHeaders: {},
            requestBody: captureBody(requestBodyText, contentType),
            responseBody: null,
            location: null,
            resultType: 'error',
          },
        });
      } else {
        recorder.record({
          type: 'request',
          requestId,
          durationMs: Math.round(performance.now() - start),
          offsetMs: 0,
          payload: {
            method: event.request.method,
            path: pathWithQuery,
            routeId: event.route.id,
            status: 500,
            hostname,
            ip,
            memoryUsageBytes: process.memoryUsage().heapUsed,
            requestHeaders,
            responseHeaders: {},
            requestBody: captureBody(requestBodyText, contentType),
            responseBody: null,
          },
        });
      }
      throw err;
    }
  });
};

/**
 * SvelteKit swallows errors thrown inside `load` (and other unexpected
 * errors) before they reach `sveltelensHandle`'s catch — `resolve()` returns
 * an error page instead of rejecting. `handleError` is the hook SvelteKit
 * calls for exactly those errors, so it's the only place left to record them.
 *
 * `export const handleError = sveltelensHandleError;` — or call it first if
 * you already have your own `handleError`.
 */
export const sveltelensHandleError: HandleServerError = ({ error }) => {
  const state = getSveltelensState();
  if (!state || !state.config.enabled) return;
  recordException(state.recorder, error instanceof Error ? error : new Error(String(error)));
};
