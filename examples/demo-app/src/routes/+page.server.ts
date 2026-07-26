import type { PageServerLoad } from './$types';
import { db, todos } from '$lib/server/db';
import { MOCK_API_PORT } from '$lib/server/mock-api';

export const load: PageServerLoad = async () => {
  const items = await db.select().from(todos);
  const res = await fetch(`http://localhost:${MOCK_API_PORT}/ping`);
  const ping = await res.json();
  return { items, ping };
};
