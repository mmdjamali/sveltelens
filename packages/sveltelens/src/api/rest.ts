import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Storage } from '../types.js';
import type { Recorder } from '../recorder.js';

type NextFn = (err?: unknown) => void;

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify(body));
}

/** Connect-style middleware serving the entries API under `${basePath}/api`. */
export function createApiMiddleware(storage: Storage, recorder: Recorder, basePath: string) {
  const apiPrefix = `${basePath}/api`;

  return function sveltelensApiMiddleware(req: IncomingMessage, res: ServerResponse, next: NextFn) {
    if (!req.url || !req.url.startsWith(apiPrefix)) return next();

    const url = new URL(req.url, 'http://localhost');
    const pathname = url.pathname;

    if (pathname === `${apiPrefix}/entries` && req.method === 'GET') {
      const type = url.searchParams.get('type') ?? undefined;
      const requestId = url.searchParams.get('requestId') ?? undefined;
      const cursor = url.searchParams.get('cursor') ?? undefined;
      const limitParam = url.searchParams.get('limit');
      const limit = limitParam ? Number(limitParam) : undefined;
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

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
