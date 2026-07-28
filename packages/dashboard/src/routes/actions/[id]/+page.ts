import { error } from '@sveltejs/kit';
import { fetchEntry } from '$lib/api';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, fetch }) => {
  const entry = await fetchEntry(params.id);
  if (!entry || entry.type !== 'action') error(404, 'entry not found');

  const { fetchEntries } = await import('$lib/api');
  const related = entry.requestId
    ? (await fetchEntries({ requestId: entry.requestId })).entries.filter((e) => e.id !== entry.id)
    : [];

  return { entry, related };
};

export const prerender = false;
