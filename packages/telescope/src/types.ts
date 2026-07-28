export type EntryType = 'request' | 'client-request' | 'query' | 'log' | 'exception' | 'action';

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

export interface BodyCapture {
  contentType: string | null;
  size: number;
  truncated: boolean;
  /** omitted (null) for binary content — only size/contentType recorded */
  text: string | null;
}

export interface ActionPayload {
  method: string;
  path: string;
  routeId: string | null;
  actionName: string;
  status: number;
  hostname: string;
  ip: string | null;
  /** process.memoryUsage().heapUsed at response time, in bytes. */
  memoryUsageBytes: number | null;
  requestHeaders: Record<string, string>;
  responseHeaders: Record<string, string>;
  requestBody: BodyCapture | null;
  responseBody: BodyCapture | null;
  /** Redirect location for successful actions. */
  location: string | null;
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

export interface ListFilter {
  type?: EntryType;
  requestId?: string;
  cursor?: string;
  limit?: number;
}

export interface Storage {
  add(entry: Entry): void;
  list(filter?: ListFilter): { entries: Entry[]; nextCursor: string | null };
  get(id: string): Entry | null;
  clear(): void;
  counts(): Record<EntryType, number>;
}

export interface TelescopeConfig {
  enabled?: boolean;
  path?: string;
  storage?: 'memory' | 'sqlite';
  sqlitePath?: string;
  maxEntries?: number;
  ignore?: (string | RegExp)[];
  redactHeaders?: string[];
}

export const BODY_TRUNCATE_BYTES = 64 * 1024;
