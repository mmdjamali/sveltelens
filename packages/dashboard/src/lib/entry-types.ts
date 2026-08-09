import type { Component } from 'svelte';
import IconFileFunction from '@lucide/svelte/icons/square-function';
import IconRoute from '@lucide/svelte/icons/route';
import IconWorld from '@lucide/svelte/icons/globe';
import IconDatabase from '@lucide/svelte/icons/database';
import IconFileText from '@lucide/svelte/icons/file-text';
import IconAlertTriangle from '@lucide/svelte/icons/triangle-alert';

import type { EntryType } from './types';
import RequestsTable from './components/RequestsTable.svelte';
import ActionsTable from './components/ActionsTable.svelte';
import QueriesTable from './components/QueriesTable.svelte';
import ClientRequestsTable from './components/ClientRequestsTable.svelte';
import LogsTable from './components/LogsTable.svelte';
import ExceptionsTable from './components/ExceptionsTable.svelte';
import RequestDetail from './components/RequestDetail.svelte';
import ActionDetail from './components/ActionDetail.svelte';
import QueryDetail from './components/QueryDetail.svelte';
import ClientRequestDetail from './components/ClientRequestDetail.svelte';
import LogDetail from './components/LogDetail.svelte';
import ExceptionDetail from './components/ExceptionDetail.svelte';

export interface EntryTypeMeta {
  /** URL segment. Matches Telescope's own routes: plural, and "client-requests" despite the singular EntryType. */
  slug: string;
  /** Plural, for the sidebar and the list page heading. */
  label: string;
  /** Singular, for the badge on one entry. */
  badgeLabel: string;
  icon: Component<any>;
  /** Shown on the list page when nothing of this type has been captured yet. */
  emptyMessage: string;
  /**
   * The list table and the detail view. Loosely typed on purpose: a route that
   * looks these up by slug can't prove to TypeScript which member of the Entry
   * union it holds, and the loader has already checked `entry.type` itself.
   */
  table: Component<any>;
  detail: Component<any>;
}

/** Everything the dashboard needs to render an entry type, keyed by the type itself. */
export const ENTRY_TYPE_META: Record<EntryType, EntryTypeMeta> = {
  request: {
    slug: 'requests',
    label: 'Requests',
    badgeLabel: 'Request',
    icon: IconRoute,
    emptyMessage: "Trigger a request in your app and it'll show up here.",
    table: RequestsTable,
    detail: RequestDetail,
  },
  action: {
    slug: 'actions',
    label: 'Actions',
    badgeLabel: 'Action',
    icon: IconFileFunction,
    emptyMessage: "Submit a form action in your app and it'll show up here.",
    table: ActionsTable,
    detail: ActionDetail,
  },
  query: {
    slug: 'queries',
    label: 'Queries',
    badgeLabel: 'Query',
    icon: IconDatabase,
    emptyMessage: "Run a query in your app and it'll show up here.",
    table: QueriesTable,
    detail: QueryDetail,
  },
  'client-request': {
    slug: 'client-requests',
    label: 'HTTP Client',
    badgeLabel: 'HTTP Client',
    icon: IconWorld,
    emptyMessage: "Make an outgoing HTTP call and it'll show up here.",
    table: ClientRequestsTable,
    detail: ClientRequestDetail,
  },
  log: {
    slug: 'logs',
    label: 'Logs',
    badgeLabel: 'Log',
    icon: IconFileText,
    emptyMessage: "Log something from your app and it'll show up here.",
    table: LogsTable,
    detail: LogDetail,
  },
  exception: {
    slug: 'exceptions',
    label: 'Exceptions',
    badgeLabel: 'Exception',
    icon: IconAlertTriangle,
    emptyMessage: "Throw an exception in your app and it'll show up here.",
    table: ExceptionsTable,
    detail: ExceptionDetail,
  },
};

/** Sidebar order. */
export const ENTRY_TYPES = Object.keys(ENTRY_TYPE_META) as EntryType[];

const BY_SLUG = new Map(ENTRY_TYPES.map((type) => [ENTRY_TYPE_META[type].slug, type]));

/** null for a slug no entry type owns, which the routes turn into a 404. */
export function entryTypeForSlug(slug: string): EntryType | null {
  return BY_SLUG.get(slug) ?? null;
}
