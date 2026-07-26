import { error } from '@sveltejs/kit';
import { fetchEntries, fetchEntry } from '$lib/api';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
  const entry = await fetchEntry(params.id);
  if (!entry) error(404, 'entry not found');

  const related = entry.requestId
    ? (await fetchEntries({ requestId: entry.requestId, limit: 200 })).entries.filter((e) => e.id !== entry.id)
    : [];

  return { entry, related };
};

export const prerender = false;
