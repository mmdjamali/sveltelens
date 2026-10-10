import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Storage } from '../storage/types.js';
import type { Recorder } from '../recorder.js';
import type { BrowserRequestReport } from '../types.js';
import { captureBody, redactHeaders } from '../utils.js';
import { isSameOrigin } from './origin.js';

type NextFn = (err?: unknown) => void;

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify(body));
}

export interface RedactOptions {
  redactHeaders: string[];
  redactBodyKeys: string[];
}

/** Connect-style middleware serving the entries API under `${basePath}/api`. */
export function createApiMiddleware(
  storage: Storage,
  recorder: Recorder,
  basePath: string,
  redact: RedactOptions = { redactHeaders: [], redactBodyKeys: [] }
) {
  const apiPrefix = `${basePath}/api`;

  return function sveltelensApiMiddleware(req: IncomingMessage, res: ServerResponse, next: NextFn) {
    if (!req.url || !req.url.startsWith(apiPrefix)) return next();
    if (!isSameOrigin(req)) {
      return sendJson(res, 403, { error: 'cross-origin request rejected' });
    }

    const url = new URL(req.url, 'http://localhost');
    const pathname = url.pathname;

    if (pathname === `${apiPrefix}/entries` && req.method === 'GET') {
      const type = url.searchParams.get('type') ?? undefined;
      const requestId = url.searchParams.get('requestId') ?? undefined;
      const cursor = url.searchParams.get('cursor') ?? undefined;
      const limitParam = url.searchParams.get('limit');
      const parsedLimit = limitParam ? Number(limitParam) : NaN;
      const limit = Number.isInteger(parsedLimit) && parsedLimit > 0 ? parsedLimit : undefined;
      const result = storage.list({
        type: type as never,
        requestId,
        cursor,
        limit,
      });
      return sendJson(res, 200, result);
    }

    if (pathname === `${apiPrefix}/entries` && req.method === 'DELETE') {
      storage.clear();
      return sendJson(res, 200, { ok: true });
    }

    if (pathname === `${apiPrefix}/pause` && req.method === 'GET') {
      return sendJson(res, 200, { paused: recorder.paused });
    }

    // ponytail: state in a query param, so no request body parsing.
    if (pathname === `${apiPrefix}/pause` && req.method === 'POST') {
      recorder.paused = url.searchParams.get('paused') === 'true';
      return sendJson(res, 200, { paused: recorder.paused });
    }

    if (pathname === `${apiPrefix}/browser-requests` && req.method === 'POST') {
      readJson(req, MAX_REPORT_BYTES).then(
        (body) => {
          if (!isBrowserRequestReport(body)) return sendJson(res, 400, { error: 'invalid report' });
          recordBrowserRequest(recorder, body, redact);
          sendJson(res, 202, { ok: true });
        },
        () => sendJson(res, 400, { error: 'invalid or oversized body' })
      );
      return;
    }

    if (pathname === `${apiPrefix}/counts` && req.method === 'GET') {
      return sendJson(res, 200, storage.counts());
    }

    const entryMatch = pathname.match(new RegExp(`^${escapeRegex(apiPrefix)}/entries/([^/]+)$`));
    if (entryMatch && req.method === 'GET') {
      const entry = storage.get(decodeURIComponent(entryMatch[1]));
      if (!entry) return sendJson(res, 404, { error: 'not found' });
      return sendJson(res, 200, entry);
    }

    return sendJson(res, 404, { error: 'not found' });
  };
}

// Two bodies capped at ~64K chars each (up to 4 bytes/char) plus headers.
const MAX_REPORT_BYTES = 1024 * 1024;

function readJson(req: IncomingMessage, maxBytes: number): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(new Error('body too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf-8')));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

const isStringOrNull = (v: unknown) => v === null || typeof v === 'string';
const isNumberOrNull = (v: unknown) => v === null || (typeof v === 'number' && Number.isFinite(v));
const isStringRecord = (v: unknown) =>
  !!v && typeof v === 'object' && !Array.isArray(v) && Object.values(v).every((x) => typeof x === 'string');
const isBodyOrNull = (v: unknown) =>
  v === null ||
  (!!v &&
    typeof v === 'object' &&
    typeof (v as { text?: unknown }).text === 'string' &&
    isStringOrNull((v as { contentType?: unknown }).contentType));

/** The report comes from page JavaScript, so check every field before it reaches storage. */
export function isBrowserRequestReport(v: unknown): v is BrowserRequestReport {
  if (!v || typeof v !== 'object') return false;
  const r = v as Record<string, unknown>;
  return (
    typeof r.method === 'string' &&
    typeof r.url === 'string' &&
    isNumberOrNull(r.status) &&
    isNumberOrNull(r.durationMs) &&
    isStringRecord(r.requestHeaders) &&
    isStringRecord(r.responseHeaders) &&
    isBodyOrNull(r.requestBody) &&
    isBodyOrNull(r.responseBody) &&
    isStringOrNull(r.error)
  );
}

function recordBrowserRequest(recorder: Recorder, r: BrowserRequestReport, redact: RedactOptions): void {
  const body = (b: BrowserRequestReport['requestBody']) =>
    b ? captureBody(b.text, b.contentType, redact.redactBodyKeys) : null;
  recorder.record({
    type: 'browser-request',
    // Not tied to any server request, even though the report itself arrives as one.
    requestId: null,
    offsetMs: null,
    durationMs: r.durationMs,
    payload: {
      method: r.method,
      url: r.url,
      status: r.status,
      requestHeaders: redactHeaders(r.requestHeaders, redact.redactHeaders),
      responseHeaders: redactHeaders(r.responseHeaders, redact.redactHeaders),
      requestBody: body(r.requestBody),
      responseBody: body(r.responseBody),
      error: r.error,
    },
  });
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
