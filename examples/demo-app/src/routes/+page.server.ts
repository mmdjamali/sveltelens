import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db, todos } from '$lib/server/db';
import { MOCK_API_PORT } from '$lib/server/mock-api';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async () => {
  const items = await db.select().from(todos);
  const res = await fetch(`http://localhost:${MOCK_API_PORT}/ping`);
  const ping = await res.json();
  console.log(JSON.stringify({ test: true }, null, 2));
  return { items, ping };
};

export const actions = {
  create: async ({ request }) => {
    const data = await request.formData();
    const title = data.get('title') as string;
    if (!title?.trim()) return fail(422, { error: 'Title is required' });
    await db.insert(todos).values({ title: title.trim(), done: false });
    return { success: true };
  },

  toggle: async ({ request }) => {
    const data = await request.formData();
    const id = Number(data.get('id'));
    const todo = await db.select().from(todos).where(eq(todos.id, id)).get();
    if (!todo) return { error: 'Not found' };
    await db.update(todos).set({ done: !todo.done }).where(eq(todos.id, id)).run();
    return { success: true };
  },

  delete: async ({ request }) => {
    const data = await request.formData();
    const id = Number(data.get('id'));
    await db.delete(todos).where(eq(todos.id, id)).run();
    return { success: true };
  },

  reset: async () => {
    await db.delete(todos).run();
    await db.insert(todos).values({ title: 'Write docs', done: false });
    await db.insert(todos).values({ title: 'Ship sveltelens', done: true });
    return { success: true };
  },
} satisfies Actions;
