export { sveltelens } from './plugin.js';
export type { SveltelensConfig } from './config.js';

/**
 * The wire format, re-exported for anyone reading captured entries — the
 * dashboard, or a user inspecting them directly. Storage and ListFilter stay
 * internal: custom backends aren't a supported extension point yet, and
 * exporting the interface would freeze its five signatures.
 */
export type {
  Entry,
  EntryType,
  EntryPayload,
  BodyCapture,
  RequestPayload,
  ActionPayload,
  ClientRequestPayload,
  QueryPayload,
  LogPayload,
  ExceptionPayload,
} from './types.js';
