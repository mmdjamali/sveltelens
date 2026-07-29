import type { Entry, EntryType } from '../types.js';

/**
 * Internal: how the recorder talks to a backend. Not exported from the package
 * root — custom storage backends aren't a supported extension point yet, and
 * publishing this would freeze these five signatures.
 */
export interface Storage {
  add(entry: Entry): void;
  list(filter?: ListFilter): { entries: Entry[]; nextCursor: string | null };
  get(id: string): Entry | null;
  clear(): void;
  counts(): Record<EntryType, number>;
}

export interface ListFilter {
  type?: EntryType;
  requestId?: string;
  cursor?: string;
  limit?: number;
}
