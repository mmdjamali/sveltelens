export { sveltelens } from './plugin.js';
export type { SveltelensConfig } from './config.js';

/** The escape hatch for data sources without a shipped adapter — see `src/adapters`. */
export { recordQuery } from './record.js';

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
  ActionResultType,
  ClientRequestPayload,
  BrowserRequestReport,
  QueryPayload,
  LogPayload,
  ExceptionPayload,
} from './types.js';
