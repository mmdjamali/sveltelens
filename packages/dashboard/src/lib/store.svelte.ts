import { fetchEntries, fetchEntry, fetchCounts, clearEntries, connectStream } from './api';
import { ENTRY_TYPES, type Entry, type EntryType } from './types';

function emptyCounts(): Record<EntryType, number> {
  return Object.fromEntries(ENTRY_TYPES.map((t) => [t, 0])) as Record<EntryType, number>;
}

class TelescopeStore {
  entries = $state<Entry[]>([]);
  counts = $state<Record<EntryType, number>>(emptyCounts());
  paused = $state(false);
  connected = $state(false);
  activeType = $state<EntryType | 'all'>('all');
  search = $state('');
  methodFilter = $state<string>('all');
  selectedId = $state<string | null>(null);
  selectedEntry = $state<Entry | null>(null);
  relatedEntries = $state<Entry[]>([]);

  private ws: WebSocket | null = null;

  get filtered(): Entry[] {
    const q = this.search.trim().toLowerCase();
    return this.entries.filter((e) => {
      if (this.activeType !== 'all' && e.type !== this.activeType) return false;
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
        if (this.selectedEntry && entry.requestId === this.selectedEntry.requestId && entry.id !== this.selectedEntry.id) {
          this.relatedEntries = [...this.relatedEntries, entry];
        }
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
    this.selectedId = null;
    this.selectedEntry = null;
    this.relatedEntries = [];
  }

  async selectEntry(id: string): Promise<void> {
    this.selectedId = id;
    let entry = this.entries.find((e) => e.id === id) ?? null;
    if (!entry) entry = await fetchEntry(id);
    this.selectedEntry = entry;
    if (entry?.requestId) {
      const result = await fetchEntries({ requestId: entry.requestId, limit: 200 });
      this.relatedEntries = result.entries.filter((e) => e.id !== id);
    } else {
      this.relatedEntries = [];
    }
  }

  closeDetail(): void {
    this.selectedId = null;
    this.selectedEntry = null;
    this.relatedEntries = [];
  }
}

export const store = new TelescopeStore();
