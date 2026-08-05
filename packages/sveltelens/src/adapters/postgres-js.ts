import type postgres from 'postgres';
import { recordQuery } from '../record.js';

/**
 * Wraps a `postgres` (postgres.js) `Sql` instance so every tagged-template query
 * and `sql.unsafe()` call is timed and recorded: `postgresJs(postgres(url))`.
 *
 * postgres.js queries are lazy — nothing runs until you `await` or otherwise call
 * `.then()` on the result — so instead of awaiting eagerly (which would trigger
 * the query before the caller gets a chance to chain `.cursor()`/`.raw()`/etc.),
 * this only patches the returned query's own `.then`, preserving laziness and
 * chaining. Iterating with `.forEach()`/`for await` bypasses `.then()` and isn't
 * captured. The recorded SQL numbers placeholders `$1..$n` in interpolation
 * order; nested `sql` fragments are approximated the same way rather than
 * resolved to their own numbering.
 */
export function postgresJs<T extends postgres.Sql<any>>(sql: T): T {
  return new Proxy(sql, {
    apply(target, thisArg, args) {
      const result = Reflect.apply(target as unknown as (...a: unknown[]) => unknown, thisArg, args);
      const [strings, ...values] = args as [unknown, ...unknown[]];
      if (isTemplateStringsArray(strings)) {
        wrapPending(result, buildSqlText(strings, values), values);
      }
      return result;
    },
    get(target, prop, receiver) {
      if (prop === 'unsafe') {
        const originalUnsafe = Reflect.get(target, prop, receiver) as (...a: unknown[]) => unknown;
        return (...args: unknown[]) => {
          const result = originalUnsafe.apply(target, args);
          const [query, params] = args;
          wrapPending(result, query as string, Array.isArray(params) ? params : []);
          return result;
        };
      }
      return Reflect.get(target, prop, receiver);
    },
  }) as T;
}

function isTemplateStringsArray(value: unknown): value is TemplateStringsArray {
  return Array.isArray(value) && 'raw' in value;
}

function buildSqlText(strings: TemplateStringsArray, values: unknown[]): string {
  let sql = strings[0];
  for (let i = 0; i < values.length; i++) {
    sql += `$${i + 1}${strings[i + 1] ?? ''}`;
  }
  return sql;
}

function wrapPending(pending: unknown, sql: string, params: unknown[]): void {
  if (!pending || typeof (pending as { then?: unknown }).then !== 'function') return;
  const query = pending as { then: (onFulfilled?: unknown, onRejected?: unknown) => unknown };
  const originalThen = query.then.bind(query) as (
    onFulfilled?: (value: unknown) => unknown,
    onRejected?: (err: unknown) => unknown,
  ) => unknown;
  let start: number | null = null;

  (query.then as unknown) = (onFulfilled?: (value: unknown) => unknown, onRejected?: (err: unknown) => unknown) => {
    if (start === null) start = performance.now();
    return originalThen(
      (value: unknown) => {
        recordQuery({ sql, params, durationMs: Math.round(performance.now() - (start as number)) });
        return onFulfilled ? onFulfilled(value) : value;
      },
      (err: unknown) => {
        recordQuery({ sql, params, durationMs: Math.round(performance.now() - (start as number)) });
        if (onRejected) return onRejected(err);
        throw err;
      },
    );
  };
}
