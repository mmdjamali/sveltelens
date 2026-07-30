import { error } from '@sveltejs/kit';
import { entryTypeForSlug } from '$lib/entry-types';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
  const type = entryTypeForSlug(params.type);
  if (!type) error(404, 'unknown entry type');
  return { type };
};

export const prerender = false;
