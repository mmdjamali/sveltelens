/**
 * The wire format is defined by the package that produces it — re-exported here
 * so the dashboard has one import for it. How each type is presented lives in
 * entry-types.ts.
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
} from 'sveltelens';
