import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Storage } from '../storage/types.js';
import type { Entry, EntryType } from '../types.js';
import { isSameOrigin } from './origin.js';

type NextFn = (err?: unknown) => void;

// ponytail: stateless Streamable-HTTP MCP, JSON responses only (no sessions, no SSE).
// Swap for @modelcontextprotocol/sdk if resources/prompts/streaming are ever needed.
const SUPPORTED_VERSIONS = ['2025-06-18', '2025-03-26', '2024-11-05'];
const MAX_BODY_BYTES = 64 * 1024;
// ponytail: errorsOnly/search filter the newest SCAN_WINDOW entries in memory; push into Storage if that's too narrow.
const SCAN_WINDOW = 1000;
const CLIP = 200;

const ENTRY_TYPES: EntryType[] = ['request', 'action', 'client-request', 'browser-request', 'query', 'log', 'exception'];

const TOOLS = [
  {
    name: 'list_entries',
    description:
      'List captured SvelteKit dev entries (requests, form actions, server fetches, browser fetches, DB queries, logs, exceptions), newest first, one summary line each. Use get_entry for full detail or get_request for a request timeline.',
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ENTRY_TYPES },
        requestId: { type: 'string', description: 'Only entries belonging to this server request.' },
        errorsOnly: { type: 'boolean', description: 'Only failures: HTTP >= 400, query errors, error logs, exceptions.' },
        search: { type: 'string', description: 'Case-insensitive substring match on path/url/sql/message.' },
        limit: { type: 'number', description: 'Default 20, max 100.' },
        cursor: { type: 'string', description: 'nextCursor from a previous call.' },
      },
    },
  },
  {
    name: 'get_entry',
    description: 'Full JSON of one entry by id, including headers, bodies, SQL params and stack traces.',
    inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
  },
  {
    name: 'get_request',
    description:
      'Timeline of one server request: the request line plus every query, log, exception and outgoing fetch it caused, in order. Accepts a requestId or the id of the request entry.',
    inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
  },
  {
    name: 'clear_entries',
    description: 'Delete all captured entries. Useful before reproducing a bug so only fresh entries remain.',
    inputSchema: { type: 'object', properties: {} },
  },
];

function clip(s: string): string {
  const flat = s.replace(/\s+/g, ' ').trim();
  return flat.length > CLIP ? `${flat.slice(0, CLIP)}…` : flat;
}

const ms = (d: number | null) => (d === null ? '' : ` (${Math.round(d)}ms)`);

/** One line per entry; exported for tests. */
export function summarize(e: Entry): string {
  const time = new Date(e.timestamp).toISOString().slice(11, 19);
  const head = `${e.id} ${time}`;
  switch (e.type) {
    case 'request': {
      const p = e.payload;
      return `${head} request ${p.method} ${p.path} → ${p.status}${ms(e.durationMs)} [requestId ${e.requestId}${p.routeId ? `, route ${p.routeId}` : ''}]`;
    }
    case 'action': {
      const p = e.payload;
      return `${head} action ${p.method} ${p.path} ?/${p.actionName} → ${p.resultType ?? p.status}${ms(e.durationMs)} [requestId ${e.requestId}]`;
    }
    case 'client-request':
    case 'browser-request': {
      const p = e.payload;
      const label = e.type === 'client-request' ? 'client' : 'browser';
      return `${head} ${label} ${p.method} ${p.url} → ${p.error ? `ERR: ${clip(p.error)}` : p.status}${ms(e.durationMs)}`;
    }
    case 'query': {
      const p = e.payload;
      return `${head} query${ms(e.durationMs)} ${clip(p.sql)}${p.error ? ` [ERR: ${clip(p.error)}]` : ''}`;
    }
    case 'log':
      return `${head} log ${e.payload.level} ${clip(e.payload.message)}`;
    case 'exception':
      return `${head} exception ${e.payload.name}: ${clip(e.payload.message)}`;
  }
}

export function isError(e: Entry): boolean {
  switch (e.type) {
    case 'request':
      return e.payload.status >= 400;
    case 'action':
      return e.payload.status >= 400 || e.payload.resultType === 'error' || e.payload.resultType === 'failure';
    case 'client-request':
    case 'browser-request':
      return e.payload.error !== null || (e.payload.status ?? 0) >= 400;
    case 'query':
      return e.payload.error !== null;
    case 'log':
      return e.payload.level === 'error';
    case 'exception':
      return true;
  }
}

function haystack(e: Entry): string {
  switch (e.type) {
    case 'request':
    case 'action':
      return e.payload.path;
    case 'client-request':
    case 'browser-request':
      return e.payload.url;
    case 'query':
      return e.payload.sql;
    case 'log':
    case 'exception':
      return e.payload.message;
  }
}

type Args = Record<string, unknown>;
const str = (v: unknown) => (typeof v === 'string' && v ? v : undefined);

function listEntries(storage: Storage, a: Args): string {
  const limit = Math.min(Math.max(Math.floor(Number(a.limit) || 20), 1), 100);
  const type = ENTRY_TYPES.includes(a.type as EntryType) ? (a.type as EntryType) : undefined;
  const requestId = str(a.requestId);
  const cursor = str(a.cursor);
  const search = str(a.search)?.toLowerCase();
  const errorsOnly = a.errorsOnly === true;

  let entries: Entry[];
  let nextCursor: string | null;
  if (!search && !errorsOnly) {
    ({ entries, nextCursor } = storage.list({ type, requestId, cursor, limit }));
  } else {
    const window = storage.list({ type, requestId, limit: SCAN_WINDOW }).entries;
    const matches = window.filter(
      (e) => (!errorsOnly || isError(e)) && (!search || haystack(e).toLowerCase().includes(search))
    );
    const start = cursor ? matches.findIndex((e) => e.id === cursor) + 1 : 0;
    entries = matches.slice(start, start + limit);
    nextCursor = matches.length > start + limit ? (entries[entries.length - 1]?.id ?? null) : null;
  }

  if (entries.length === 0) return 'No entries.';
  const lines = entries.map(summarize);
  if (nextCursor) lines.push(`nextCursor: ${nextCursor}`);
  return lines.join('\n');
}

function getRequest(storage: Storage, id: string): string | null {
  const requestId = storage.get(id)?.requestId ?? id;
  // Every entry of one request is far below the cap, so one page is enough.
  const entries = storage.list({ requestId, limit: SCAN_WINDOW }).entries.reverse();
  if (entries.length === 0) return null;
  const root = entries.find((e) => e.type === 'request' || e.type === 'action');
  const rest = entries.filter((e) => e !== root);
  const lines = [root ? summarize(root) : `requestId ${requestId} (request entry not recorded yet)`];
  for (const e of rest) lines.push(`  ${e.offsetMs === null ? '' : `+${Math.round(e.offsetMs)}ms `}${summarize(e)}`);
  return lines.join('\n');
}

type ToolResult = { content: { type: 'text'; text: string }[]; isError?: boolean };
const text = (t: string, isError = false): ToolResult => ({ content: [{ type: 'text', text: t }], ...(isError && { isError }) });

function callTool(storage: Storage, name: unknown, a: Args): ToolResult | null {
  switch (name) {
    case 'list_entries':
      return text(listEntries(storage, a));
    case 'get_entry': {
      const entry = storage.get(String(a.id ?? ''));
      return entry ? text(JSON.stringify(entry, null, 2)) : text(`No entry with id ${a.id}`, true);
    }
    case 'get_request': {
      const out = getRequest(storage, String(a.id ?? ''));
      return out ? text(out) : text(`No entries for request ${a.id}`, true);
    }
    case 'clear_entries':
      storage.clear();
      return text('Cleared all entries.');
    default:
      return null;
  }
}

type RpcRequest = { jsonrpc?: string; id?: string | number | null; method?: unknown; params?: Record<string, unknown> };

function handleRpc(storage: Storage, msg: RpcRequest): object | null {
  const isNotification = msg.id === undefined;
  const ok = (result: unknown) => ({ jsonrpc: '2.0', id: msg.id, result });
  const fail = (code: number, message: string) => ({ jsonrpc: '2.0', id: msg.id ?? null, error: { code, message } });
  const params = msg.params ?? {};

  switch (msg.method) {
    case 'initialize': {
      const requested = params.protocolVersion;
      return ok({
        protocolVersion: SUPPORTED_VERSIONS.includes(requested as string) ? requested : SUPPORTED_VERSIONS[0],
        capabilities: { tools: {} },
        serverInfo: { name: 'sveltelens', version: '0.1.0' },
        instructions:
          'Inspect what the running SvelteKit dev server captured: requests, form actions, fetches, DB queries, logs and exceptions.',
      });
    }
    case 'ping':
      return ok({});
    case 'tools/list':
      return ok({ tools: TOOLS });
    case 'tools/call': {
      const result = callTool(storage, params.name, (params.arguments ?? {}) as Args);
      return result ? ok(result) : fail(-32602, `Unknown tool: ${String(params.name)}`);
    }
    default:
      return isNotification ? null : fail(-32601, `Method not found: ${String(msg.method)}`);
  }
}

function send(res: ServerResponse, status: number, body?: unknown): void {
  res.statusCode = status;
  if (body === undefined) return void res.end();
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify(body));
}

/** Connect-style middleware serving an MCP endpoint at `${basePath}/mcp`. */
export function createMcpMiddleware(storage: Storage, basePath: string) {
  const endpoint = `${basePath}/mcp`;

  return function sveltelensMcpMiddleware(req: IncomingMessage, res: ServerResponse, next: NextFn) {
    if (!req.url || new URL(req.url, 'http://localhost').pathname !== endpoint) return next();
    if (!isSameOrigin(req)) return send(res, 403, { error: 'cross-origin request rejected' });
    if (req.method !== 'POST') {
      res.setHeader('allow', 'POST');
      return send(res, 405);
    }

    const chunks: Buffer[] = [];
    let size = 0;
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        send(res, 413, { jsonrpc: '2.0', id: null, error: { code: -32600, message: 'body too large' } });
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (res.writableEnded) return;
      let body: unknown;
      try {
        body = JSON.parse(Buffer.concat(chunks).toString('utf-8'));
      } catch {
        return send(res, 400, { jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } });
      }
      const messages = (Array.isArray(body) ? body : [body]) as RpcRequest[];
      const replies = messages
        .map((m) => (m && typeof m === 'object' ? handleRpc(storage, m) : null))
        .filter((r) => r !== null);
      if (replies.length === 0) return send(res, 202);
      send(res, 200, Array.isArray(body) ? replies : replies[0]);
    });
  };
}
