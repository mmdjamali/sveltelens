import type { Component } from 'svelte';
import { IconFileFunction, type Icon } from '@tabler/icons-svelte';
import IconRoute from '@tabler/icons-svelte/icons/route';
import IconWorld from '@tabler/icons-svelte/icons/world';
import IconDatabase from '@tabler/icons-svelte/icons/database';
import IconFileText from '@tabler/icons-svelte/icons/file-text';
import IconAlertTriangle from '@tabler/icons-svelte/icons/alert-triangle';

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
  icon: Icon;
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
    table: RequestsTable,
    detail: RequestDetail,
  },
  action: {
    slug: 'actions',
    label: 'Actions',
    badgeLabel: 'Action',
    icon: IconFileFunction,
    table: ActionsTable,
    detail: ActionDetail,
  },
  query: {
    slug: 'queries',
    label: 'Queries',
    badgeLabel: 'Query',
    icon: IconDatabase,
    table: QueriesTable,
    detail: QueryDetail,
  },
  'client-request': {
    slug: 'client-requests',
    label: 'HTTP Client',
    badgeLabel: 'HTTP Client',
    icon: IconWorld,
    table: ClientRequestsTable,
    detail: ClientRequestDetail,
  },
  log: {
    slug: 'logs',
    label: 'Logs',
    badgeLabel: 'Log',
    icon: IconFileText,
    table: LogsTable,
    detail: LogDetail,
  },
  exception: {
    slug: 'exceptions',
    label: 'Exceptions',
    badgeLabel: 'Exception',
    icon: IconAlertTriangle,
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
