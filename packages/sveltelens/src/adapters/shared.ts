import { recordQuery } from '../record.js';

export const TIMED_STATEMENT_METHODS = ['run', 'get', 'all'] as const;

interface TimedStatement {
  run(...params: unknown[]): unknown;
  get(...params: unknown[]): unknown;
  all(...params: unknown[]): unknown;
}

/**
 * Wraps a prepared statement's run/get/all methods so each call is timed
 * and recorded via recordQuery. `paramsFallback` covers drivers (like
 * bun:sqlite) where bind params can be supplied at prepare()-time instead
 * of call-time — when the call itself passes no params, paramsFallback is
 * recorded instead.
 */
export function wrapStatement<S extends TimedStatement>(
  stmt: S,
  sql: string,
  paramsFallback: unknown[] = []
): S {
  for (const method of TIMED_STATEMENT_METHODS) {
    const original = stmt[method].bind(stmt) as (...params: unknown[]) => unknown;
    (stmt[method] as unknown) = (...params: unknown[]) => {
      const start = performance.now();
      try {
        return original(...params);
      } finally {
        recordQuery({
          sql,
          params: params.length ? params : paramsFallback,
          durationMs: Math.round(performance.now() - start),
        });
      }
    };
  }
  return stmt;
}
