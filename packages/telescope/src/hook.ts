import type { Handle } from '@sveltejs/kit';
import { getTelescopeState } from './state.js';
import { requestContext } from './context.js';
import { generateId, redactHeaders, headersToObject, captureBody, matchesIgnore } from './utils.js';
import { recordException } from './intercept/exceptions.js';

/** No-op passthrough when the vite plugin isn't active (e.g. production build). */
export const telescopeHandle: Handle = async ({ event, resolve }) => {
  const state = getTelescopeState();
  if (!state || !state.config.enabled) return resolve(event);

  const { recorder, config } = state;
  const path = event.url.pathname;
  if (matchesIgnore(path, config.ignore)) return resolve(event);

  const requestId = generateId();
  const start = Date.now();
  const requestHeaders = redactHeaders(headersToObject(event.request.headers), config.redactHeaders);

  let requestBodyText: string | null = null;
  try {
    requestBodyText = await event.request.clone().text();
  } catch {
    requestBodyText = null;
  }

  return requestContext.run({ requestId }, async () => {
    try {
      const response = await resolve(event);
      const responseClone = response.clone();
      let responseBodyText: string | null = null;
      try {
        responseBodyText = await responseClone.text();
      } catch {
        responseBodyText = null;
      }

      recorder.record({
        type: 'request',
        requestId,
        durationMs: Date.now() - start,
        payload: {
          method: event.request.method,
          path,
          routeId: event.route.id,
          status: response.status,
          requestHeaders,
          responseHeaders: redactHeaders(headersToObject(response.headers), config.redactHeaders),
          requestBody: captureBody(requestBodyText, requestHeaders['content-type'] ?? null),
          responseBody: captureBody(responseBodyText, response.headers.get('content-type')),
        },
      });

      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      recordException(recorder, error);
      recorder.record({
        type: 'request',
        requestId,
        durationMs: Date.now() - start,
        payload: {
          method: event.request.method,
          path,
          routeId: event.route.id,
          status: 500,
          requestHeaders,
          responseHeaders: {},
          requestBody: captureBody(requestBodyText, requestHeaders['content-type'] ?? null),
          responseBody: null,
        },
      });
      throw err;
    }
  });
};
