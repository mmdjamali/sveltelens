import { error } from '@sveltejs/kit';
import { fetchEntries, fetchEntry } from '$lib/api';
import { entryTypeForSlug } from '$lib/entry-types';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
  const type = entryTypeForSlug(params.type);
  if (!type) error(404, 'unknown entry type');

  const entry = await fetchEntry(params.id);
  // Guard the type too, so /logs/<a-query-id> 404s instead of rendering the wrong detail view.
  if (!entry || entry.type !== type) error(404, 'entry not found');

  // Everything else captured during the same request. Detail views that show a
  // "related" list use it; the rest ignore it, and it's one request either way.
  const related = entry.requestId
    ? (await fetchEntries({ requestId: entry.requestId, limit: 200 })).entries.filter((e) => e.id !== entry.id)
    : [];

  return { type, entry, related };
};

export const prerender = false;
