import type { Entry, EntryType, ListFilter, Storage } from '../types.js';

const ENTRY_TYPES: EntryType[] = ['request', 'client-request', 'query', 'log', 'exception', 'action'];

/** Fixed-capacity FIFO buffer; oldest entries drop silently once full. */
export class MemoryStorage implements Storage {
  private entries: Entry[] = [];
  private byId = new Map<string, Entry>();

  constructor(private readonly maxEntries: number = 1000) {}

  add(entry: Entry): void {
    this.entries.push(entry);
    this.byId.set(entry.id, entry);
    while (this.entries.length > this.maxEntries) {
      const dropped = this.entries.shift();
      if (dropped) this.byId.delete(dropped.id);
    }
  }

  list(filter: ListFilter = {}): { entries: Entry[]; nextCursor: string | null } {
    const { type, requestId, cursor, limit = 50 } = filter;
    let filtered = this.entries;
    if (type) filtered = filtered.filter((e) => e.type === type);
    if (requestId) filtered = filtered.filter((e) => e.requestId === requestId);

    // newest first
    const ordered = filtered.slice().reverse();
    const startIndex = cursor ? ordered.findIndex((e) => e.id === cursor) + 1 : 0;
    const page = ordered.slice(startIndex, startIndex + limit);
    const nextCursor = ordered.length > startIndex + limit ? page[page.length - 1]?.id ?? null : null;
    return { entries: page, nextCursor };
  }

  get(id: string): Entry | null {
    return this.byId.get(id) ?? null;
  }

  clear(): void {
    this.entries = [];
    this.byId.clear();
  }

  counts(): Record<EntryType, number> {
    const result = Object.fromEntries(ENTRY_TYPES.map((t) => [t, 0])) as Record<EntryType, number>;
    for (const entry of this.entries) result[entry.type]++;
    return result;
  }
}
