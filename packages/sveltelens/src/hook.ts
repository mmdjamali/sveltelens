import os from 'node:os';
import type { Handle, HandleServerError } from '@sveltejs/kit';
import { getSveltelensState } from './state.js';
import { requestContext } from './context.js';
import { generateId, redactHeaders, headersToObject, captureBody, matchesIgnore } from './utils.js';
import { recordException } from './intercept/exceptions.js';

const hostname = os.hostname();

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
            status: response.status,
            hostname,
            ip,
            memoryUsageBytes: process.memoryUsage().heapUsed,
            requestHeaders,
            responseHeaders: redactHeaders(headersToObject(response.headers), config.redactHeaders),
            requestBody: captureBody(requestBodyText, contentType),
            responseBody: captureBody(responseBodyText, response.headers.get('content-type')),
            location: response.headers.get('location'),
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
