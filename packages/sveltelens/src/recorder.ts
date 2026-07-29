import { EventEmitter } from 'node:events';
import type { Entry, EntryPayload } from './types.js';
import type { Storage } from './storage/types.js';
import { generateId } from './utils.js';
import { currentRequestId, currentRequestStart } from './context.js';

export type RecordInput = EntryPayload & {
  requestId?: string | null;
  durationMs?: number | null;
  /** Offset in ms from the request's start. Defaults to now - requestContext.startedAt when inside a request. */
  offsetMs?: number | null;
};

/** Wraps a Storage with id/timestamp/requestId defaulting and a live 'entry' event for WS push. */
export class Recorder extends EventEmitter {
  /** Toggled from the dashboard; while paused nothing is stored or streamed. */
  paused = false;

  constructor(private storage: Storage) {
    super();
    this.setMaxListeners(0);
  }

  record(input: RecordInput): Entry | null {
    if (this.paused) return null;

    const requestStart = currentRequestStart();
    const offsetMs =
      input.offsetMs !== undefined
        ? input.offsetMs
        : requestStart !== null
          ? Math.max(0, Math.round(performance.now() - requestStart))
          : null;

    const entry: Entry = {
      id: generateId(),
      timestamp: Date.now(),
      durationMs: input.durationMs ?? null,
      offsetMs,
      requestId: input.requestId !== undefined ? input.requestId : currentRequestId(),
      type: input.type,
      payload: input.payload,
    } as Entry;
    this.storage.add(entry);
    this.emit('entry', entry);
    return entry;
  }
}
