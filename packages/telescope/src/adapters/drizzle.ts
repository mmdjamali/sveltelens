import { getTelescopeState } from '../state.js';

interface DrizzleLogger {
  logQuery(query: string, params: unknown[]): void;
}

/** Pass to Drizzle's `logger` option: `drizzle(client, { logger: telescopeDrizzleLogger() })`. */
export function telescopeDrizzleLogger(): DrizzleLogger {
  return {
    logQuery(query: string, params: unknown[]) {
      const state = getTelescopeState();
      if (!state || !state.config.enabled) return;
      state.recorder.record({
        type: 'query',
        payload: { sql: query, params, connection: null },
      });
    },
  };
}
