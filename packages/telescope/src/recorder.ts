import { EventEmitter } from 'node:events';
import type { Entry, EntryPayload, Storage } from './types.js';
import { generateId } from './utils.js';
import { currentRequestId } from './context.js';

export type RecordInput = EntryPayload & { requestId?: string | null; durationMs?: number | null };

/** Wraps a Storage with id/timestamp/requestId defaulting and a live 'entry' event for WS push. */
export class Recorder extends EventEmitter {
  constructor(private storage: Storage) {
    super();
    this.setMaxListeners(0);
  }

  record(input: RecordInput): Entry {
    const entry: Entry = {
      id: generateId(),
      timestamp: Date.now(),
      durationMs: input.durationMs ?? null,
      requestId: input.requestId !== undefined ? input.requestId : currentRequestId(),
      type: input.type,
      payload: input.payload,
    } as Entry;
    this.storage.add(entry);
    this.emit('entry', entry);
    return entry;
  }
}
