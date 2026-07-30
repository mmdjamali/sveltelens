import { getSveltelensState } from './state.js';

/**
 * Record a database query. This is the whole surface an adapter needs: anywhere a
 * driver or ORM exposes the SQL it is about to run, time it and call this.
 *
 * A no-op when the plugin is disabled or not running, so it's safe to leave in
 * production code paths — the shipped build never has the dev server around.
 */
export function recordQuery(query: {
  sql: string;
  params?: unknown[];
  /** Milliseconds the query took. Omit when the hook you're using can't measure it. */
  durationMs?: number;
  /** Connection or database name, shown in the dashboard when several are in play. */
  connection?: string | null;
}): void {
  const state = getSveltelensState();
  if (!state || !state.config.enabled) return;

  state.recorder.record({
    type: 'query',
    durationMs: query.durationMs ?? null,
    payload: {
      sql: query.sql,
      params: query.params ?? [],
      connection: query.connection ?? null,
    },
  });
}
