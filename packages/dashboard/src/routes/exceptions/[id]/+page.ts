import { error } from '@sveltejs/kit';
import { fetchEntry } from '$lib/api';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
  const entry = await fetchEntry(params.id);
  if (!entry || entry.type !== 'exception') error(404, 'entry not found');

  const requestEntry = entry.requestId ? await fetchEntry(entry.requestId) : null;

  return { entry, requestEntry: requestEntry?.type === 'request' ? requestEntry : null };
};

export const prerender = false;
