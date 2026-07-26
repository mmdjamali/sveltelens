import { fetchEntries, fetchCounts, clearEntries, connectStream } from './api';
import { ENTRY_TYPES, type Entry, type EntryType } from './types';

function emptyCounts(): Record<EntryType, number> {
  return Object.fromEntries(ENTRY_TYPES.map((t) => [t, 0])) as Record<EntryType, number>;
}

class TelescopeStore {
  entries = $state<Entry[]>([]);
  counts = $state<Record<EntryType, number>>(emptyCounts());
  paused = $state(false);
  connected = $state(false);
  search = $state('');
  methodFilter = $state<string>('all');

  private ws: WebSocket | null = null;

  filtered(type: EntryType | 'all'): Entry[] {
    const q = this.search.trim().toLowerCase();
    return this.entries.filter((e) => {
      if (type !== 'all' && e.type !== type) return false;
      if (this.methodFilter !== 'all') {
        const method = 'method' in e.payload ? e.payload.method : null;
        if (method !== this.methodFilter) return false;
      }
      if (q && !JSON.stringify(e).toLowerCase().includes(q)) return false;
      return true;
    });
  }

  async init(): Promise<void> {
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
  }

  async clear(): Promise<void> {
    await clearEntries();
    this.entries = [];
    this.counts = emptyCounts();
  }
}

export const store = new TelescopeStore();
