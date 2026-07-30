/**
 * The wire format: everything here is serialized to JSON and consumed by the
 * dashboard, so a change to this file is a change to a public contract.
 * Internal contracts live next to their implementations (see storage/types.ts).
 */

export type EntryType = 'request' | 'client-request' | 'query' | 'log' | 'exception' | 'action';

export interface BodyCapture {
  contentType: string | null;
  size: number;
  truncated: boolean;
  /** omitted (null) for binary content — only size/contentType recorded */
  text: string | null;
}

export interface RequestPayload {
  method: string;
  path: string;
  routeId: string | null;
  status: number;
  hostname: string;
  ip: string | null;
  /** process.memoryUsage().heapUsed at response time, in bytes. */
  memoryUsageBytes: number | null;
  requestHeaders: Record<string, string>;
  responseHeaders: Record<string, string>;
  requestBody: BodyCapture | null;
  responseBody: BodyCapture | null;
}

/** SvelteKit's own ActionResult tag — null when we can't recover it (full-page, non-JS submits). */
export type ActionResultType = 'success' | 'failure' | 'redirect' | 'error';

/** A form action is a request plus which action ran and where it redirected. */
export interface ActionPayload extends RequestPayload {
  actionName: string;
  /** Redirect location for successful actions. */
  location: string | null;
  /**
   * SvelteKit's own result type, when known. For use:enhance/fetch submits, SvelteKit
   * wraps the ActionResult in a JSON body and only forwards its real HTTP status for
   * `error` — success/failure/redirect all come back over HTTP 200, so `status` and
   * `location` above are parsed out of that body rather than trusted from the response.
   * Full-page (non-JS) submits don't have this wrapper, so resultType is null there
   * even though status/location are accurate.
   */
  resultType: ActionResultType | null;
}

export interface ClientRequestPayload {
  method: string;
  url: string;
  status: number | null;
  requestHeaders: Record<string, string>;
  responseHeaders: Record<string, string>;
  requestBody: BodyCapture | null;
  responseBody: BodyCapture | null;
  error: string | null;
}

export interface QueryPayload {
  sql: string;
  params: unknown[];
  connection: string | null;
}

export interface LogPayload {
  level: 'log' | 'info' | 'warn' | 'error' | 'debug';
  message: string;
}

export interface ExceptionPayload {
  message: string;
  stack: string | null;
  name: string;
}

export type EntryPayload =
  | { type: 'request'; payload: RequestPayload }
  | { type: 'client-request'; payload: ClientRequestPayload }
  | { type: 'query'; payload: QueryPayload }
  | { type: 'log'; payload: LogPayload }
  | { type: 'exception'; payload: ExceptionPayload }
  | { type: 'action'; payload: ActionPayload };

export type Entry = {
  id: string;
  requestId: string | null;
  timestamp: number;
  durationMs: number | null;
  /** Offset in ms from the start of the owning request, for waterfall/timeline rendering. Null outside a request context. */
  offsetMs: number | null;
} & EntryPayload;

export const BODY_TRUNCATE_BYTES = 64 * 1024;
