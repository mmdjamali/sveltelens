import { error } from '@sveltejs/kit';
import { fetchEntry } from '$lib/api';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
  const entry = await fetchEntry(params.id);
  if (!entry || entry.type !== 'log') error(404, 'entry not found');
  return { entry };
};

export const prerender = false;
