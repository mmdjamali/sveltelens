import type { Icon } from '@tabler/icons-svelte';
import IconRoute from '@tabler/icons-svelte/icons/route';
import IconWorld from '@tabler/icons-svelte/icons/world';
import IconDatabase from '@tabler/icons-svelte/icons/database';
import IconFileText from '@tabler/icons-svelte/icons/file-text';
import IconAlertTriangle from '@tabler/icons-svelte/icons/alert-triangle';

export type EntryType = 'request' | 'client-request' | 'query' | 'log' | 'exception';

export interface BodyCapture {
  contentType: string | null;
  size: number;
  truncated: boolean;
  text: string | null;
}

export interface RequestPayload {
  method: string;
  path: string;
  routeId: string | null;
  status: number;
  hostname: string;
  ip: string | null;
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

export type EntryPayload =
  | { type: 'request'; payload: RequestPayload }
  | { type: 'client-request'; payload: ClientRequestPayload }
  | { type: 'query'; payload: QueryPayload }
  | { type: 'log'; payload: LogPayload }
  | { type: 'exception'; payload: ExceptionPayload };

export type Entry = {
  id: string;
  requestId: string | null;
  timestamp: number;
  durationMs: number | null;
  offsetMs: number | null;
} & EntryPayload;

export const ENTRY_TYPES: EntryType[] = ['request', 'client-request', 'query', 'log', 'exception'];

export const ENTRY_TYPE_LABELS: Record<EntryType, string> = {
  request: 'Requests',
  'client-request': 'HTTP Client',
  query: 'Queries',
  log: 'Logs',
  exception: 'Exceptions',
};

// Singular labels for badges on a single entry (as opposed to the sidebar's category counts above).
export const ENTRY_TYPE_BADGE_LABELS: Record<EntryType, string> = {
  request: 'Request',
  'client-request': 'HTTP Client',
  query: 'Query',
  log: 'Log',
  exception: 'Exception',
};

export const ENTRY_TYPE_ICONS: Record<EntryType, Icon> = {
  request: IconRoute,
  'client-request': IconWorld,
  query: IconDatabase,
  log: IconFileText,
  exception: IconAlertTriangle,
};
