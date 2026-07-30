import { fetchEntries, fetchCounts, clearEntries, connectStream, fetchPaused, setPaused } from './api';
import { ENTRY_TYPES } from './entry-types';
import type { Entry, EntryType } from './types';

function emptyCounts(): Record<EntryType, number> {
  return Object.fromEntries(ENTRY_TYPES.map((t) => [t, 0])) as Record<EntryType, number>;
}

class SveltelensStore {
  entries = $state<Entry[]>([]);
  counts = $state<Record<EntryType, number>>(emptyCounts());
  paused = $state(false);
  connected = $state(false);
  search = $state('');

  private ws: WebSocket | null = null;

  filtered<T extends EntryType>(type: T): Extract<Entry, { type: T }>[];
  filtered(type: 'all'): Entry[];
  filtered(type: EntryType | 'all'): Entry[] {
    const q = this.search.trim().toLowerCase();
    return this.entries.filter((e) => {
      if (type !== 'all' && e.type !== type) return false;
      if (q && !JSON.stringify(e).toLowerCase().includes(q)) return false;
      return true;
    });
  }

  async init(): Promise<void> {
    this.paused = await fetchPaused();
    await this.refresh();
    this.connect();
  }

  async refresh(): Promise<void> {
    const [list, counts] = await Promise.all([fetchEntries({ limit: 200 }), fetchCounts()]);
    this.entries = list.entries;
    this.counts = counts;
  }

  connect(): void {
    this.ws?.close();
    this.ws = connectStream(
      (entry) => {
        if (this.paused) return;
        this.entries = [entry, ...this.entries].slice(0, 1000);
        this.counts = { ...this.counts, [entry.type]: this.counts[entry.type] + 1 };
      },
      () => (this.connected = true),
      () => (this.connected = false)
    );
  }

  togglePause(): void {
    this.paused = !this.paused;
    void setPaused(this.paused);
  }

  async clear(): Promise<void> {
    await clearEntries();
    this.entries = [];
    this.counts = emptyCounts();
  }
}

export const store = new SveltelensStore();
