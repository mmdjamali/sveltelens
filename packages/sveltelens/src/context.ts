import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContext {
  requestId: string;
  /** performance.now() at request start — lets recorded entries compute their offset into the request's timeline. */
  startedAt?: number;
}

// Backed by globalThis: Vite's SSR module graph can load this package's
// different entry points (., ./hook, ./adapters/sqlite) through separate
// resolution paths, producing distinct module instances. A plain module-level
// AsyncLocalStorage would silently split into unrelated stores per instance,
// breaking requestId correlation. A globalThis singleton guarantees one store
// process-wide regardless of how many times the module gets re-evaluated.
const globalKey = '__SVELTELENS_REQUEST_CONTEXT__';
const g = globalThis as typeof globalThis & { [globalKey]?: AsyncLocalStorage<RequestContext> };

export const requestContext: AsyncLocalStorage<RequestContext> =
  g[globalKey] ?? (g[globalKey] = new AsyncLocalStorage<RequestContext>());

export function currentRequestId(): string | null {
  return requestContext.getStore()?.requestId ?? null;
}

export function currentRequestStart(): number | null {
  return requestContext.getStore()?.startedAt ?? null;
}
