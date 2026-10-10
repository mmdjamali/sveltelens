import type { Entry, EntryType } from '../types.js';
import type { ListFilter, Storage } from './types.js';

const ENTRY_TYPES: EntryType[] = ['request', 'client-request', 'browser-request', 'query', 'log', 'exception', 'action'];

/** Fixed-capacity FIFO ring buffer; oldest entries drop silently once full. add() is O(1). */
export class MemoryStorage implements Storage {
  private buffer: (Entry | undefined)[];
  private head = 0;
  private count = 0;
  private byId = new Map<string, Entry>();

  constructor(private readonly maxEntries: number = 1000) {
    this.buffer = new Array(maxEntries);
  }

  add(entry: Entry): void {
    if (this.count < this.maxEntries) {
      const index = (this.head + this.count) % this.maxEntries;
      this.buffer[index] = entry;
      this.count++;
    } else {
      const evicted = this.buffer[this.head];
      if (evicted) this.byId.delete(evicted.id);
      this.buffer[this.head] = entry;
      this.head = (this.head + 1) % this.maxEntries;
    }
    this.byId.set(entry.id, entry);
  }

  /** Oldest-to-newest snapshot, used by list()/counts(). O(count), same cost class as the old array-based version. */
  private toOrderedArray(): Entry[] {
    const result: Entry[] = [];
    for (let i = 0; i < this.count; i++) {
      const entry = this.buffer[(this.head + i) % this.maxEntries];
      if (entry) result.push(entry);
    }
    return result;
  }

  list(filter: ListFilter = {}): { entries: Entry[]; nextCursor: string | null } {
    const { type, requestId, cursor, limit = 50 } = filter;
    let filtered = this.toOrderedArray();
    if (type) filtered = filtered.filter((e) => e.type === type);
    if (requestId) filtered = filtered.filter((e) => e.requestId === requestId);

    // newest first
    const ordered = filtered.reverse();
    const startIndex = cursor ? ordered.findIndex((e) => e.id === cursor) + 1 : 0;
    const page = ordered.slice(startIndex, startIndex + limit);
    const nextCursor = ordered.length > startIndex + limit ? page[page.length - 1]?.id ?? null : null;
    return { entries: page, nextCursor };
  }

  get(id: string): Entry | null {
    return this.byId.get(id) ?? null;
  }

  clear(): void {
    this.buffer = new Array(this.maxEntries);
    this.head = 0;
    this.count = 0;
    this.byId.clear();
  }

  counts(): Record<EntryType, number> {
    const result = Object.fromEntries(ENTRY_TYPES.map((t) => [t, 0])) as Record<EntryType, number>;
    for (let i = 0; i < this.count; i++) {
      const entry = this.buffer[(this.head + i) % this.maxEntries];
      if (entry) result[entry.type]++;
    }
    return result;
  }
}
