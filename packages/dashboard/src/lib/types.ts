import { IconFileFunction, type Icon } from '@tabler/icons-svelte';
import IconRoute from '@tabler/icons-svelte/icons/route';
import IconWorld from '@tabler/icons-svelte/icons/world';
import IconDatabase from '@tabler/icons-svelte/icons/database';
import IconFileText from '@tabler/icons-svelte/icons/file-text';
import IconAlertTriangle from '@tabler/icons-svelte/icons/alert-triangle';

import type { EntryType } from 'sveltelens';

/**
 * The wire format is defined by the package that produces it — re-exported here
 * so the dashboard has one import for "an entry and how we present it". This
 * file owns only the presentation side.
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

export const ENTRY_TYPES: EntryType[] = ['request', 'action', 'query', 'client-request', 'log', 'exception'];

export const ENTRY_TYPE_LABELS: Record<EntryType, string> = {
  request: 'Requests',
  'client-request': 'HTTP Client',
  query: 'Queries',
  log: 'Logs',
  exception: 'Exceptions',
  action: 'Actions',
};

// URL slugs match Telescope's own routes exactly (plural, "client-requests" despite the
// singular EntryType value) — see the sidebar/route layout spec in the project CLAUDE.md.
export const ENTRY_TYPE_SLUGS: Record<EntryType, string> = {
  request: 'requests',
  'client-request': 'client-requests',
  query: 'queries',
  log: 'logs',
  exception: 'exceptions',
  action: 'actions',
};

export const SLUG_TO_ENTRY_TYPE: Record<string, EntryType> = Object.fromEntries(
  ENTRY_TYPES.map((t) => [ENTRY_TYPE_SLUGS[t], t])
);

// Singular labels for badges on a single entry (as opposed to the sidebar's category counts above).
export const ENTRY_TYPE_BADGE_LABELS: Record<EntryType, string> = {
  request: 'Request',
  'client-request': 'HTTP Client',
  query: 'Query',
  log: 'Log',
  exception: 'Exception',
  action: 'Action',
};

export const ENTRY_TYPE_ICONS: Record<EntryType, Icon> = {
  request: IconRoute,
  'client-request': IconWorld,
  query: IconDatabase,
  log: IconFileText,
  exception: IconAlertTriangle,
  action: IconFileFunction,
};
