# How It Works

Sveltelens patches Node platform primitives inside the Vite dev server process, so it sees everything regardless of which libraries your app uses:

| Data              | How it's captured                                                                                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Incoming requests  | `sveltelensHandle` wraps `resolve()` in `AsyncLocalStorage`, recording method, path, route id, status, duration, headers, and truncated bodies.                          |
| Outgoing HTTP      | Subscribes to undici's `diagnostics_channel` events and patches `globalThis.fetch`, so plain `fetch`, `axios`, `got`, and SDKs like the PocketBase client are all captured without an adapter. |
| Exceptions         | `process.on('uncaughtException'/'unhandledRejection')`, errors caught in the handle hook, and `sveltelensHandleError` for errors thrown in `load`.                       |
| Logs               | `console.log/info/warn/error/debug` are patched server-side.                                                                                                              |
| DB queries         | Optional thin adapters (see [Adapters](./adapters/sqlite)) — most ORMs and clients that go over HTTP are already covered by the outgoing-HTTP interceptor.                |

Every entry carries a `requestId` from `AsyncLocalStorage` when one is available, so the dashboard's **Related** tab can show every query, outgoing call, and log line that happened during a single request — even though none of those libraries know Sveltelens exists.
