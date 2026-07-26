import type { Entry, EntryType } from './types';

export interface ListResult {
  entries: Entry[];
  nextCursor: string | null;
}

export async function fetchEntries(filter: {
  type?: EntryType;
  requestId?: string;
  cursor?: string;
  limit?: number;
} = {}): Promise<ListResult> {
  const params = new URLSearchParams();
  if (filter.type) params.set('type', filter.type);
  if (filter.requestId) params.set('requestId', filter.requestId);
  if (filter.cursor) params.set('cursor', filter.cursor);
  if (filter.limit) params.set('limit', String(filter.limit));
  const res = await fetch(`api/entries?${params.toString()}`);
  if (!res.ok) throw new Error(`failed to fetch entries: ${res.status}`);
  return res.json();
}

export async function fetchEntry(id: string): Promise<Entry | null> {
  const res = await fetch(`api/entries/${encodeURIComponent(id)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`failed to fetch entry: ${res.status}`);
  return res.json();
}

export async function fetchCounts(): Promise<Record<EntryType, number>> {
  const res = await fetch('api/counts');
  if (!res.ok) throw new Error(`failed to fetch counts: ${res.status}`);
  return res.json();
}

export async function clearEntries(): Promise<void> {
  await fetch('api/entries', { method: 'DELETE' });
}

export function connectStream(
  onEntry: (entry: Entry) => void,
  onOpen?: () => void,
  onClose?: () => void
): WebSocket {
  const url = new URL('api/stream', location.href);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  const ws = new WebSocket(url);
  ws.addEventListener('open', () => onOpen?.());
  ws.addEventListener('close', () => onClose?.());
  ws.addEventListener('message', (event) => {
    try {
      const message = JSON.parse(event.data);
      if (message.type === 'entry') onEntry(message.entry as Entry);
    } catch {
      // ignore malformed frames
    }
  });
  return ws;
}
