# How It Works

Sveltelens patches Node platform primitives inside the Vite dev server process, so it sees everything regardless of which libraries your app uses:

| Data              | How it's captured                                                                                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Incoming requests  | `sveltelensHandle` wraps `resolve()` in `AsyncLocalStorage`, recording method, path, route id, status, duration, headers, and truncated bodies.                          |
| Outgoing HTTP      | Subscribes to undici's `diagnostics_channel` events and patches `globalThis.fetch`, so plain `fetch`, `axios`, `got`, and SDKs like the PocketBase client are all captured without an adapter. |
| Browser HTTP       | Opt-in: `installClient()` from `sveltelens/client` patches `fetch` in the page and POSTs each call to the dev server, which applies the same header and body redaction. These entries have no `requestId`. |
| Exceptions         | `process.on('uncaughtException'/'unhandledRejection')`, errors caught in the handle hook, and `sveltelensHandleError` for errors thrown in `load`.                       |
| Logs               | `console.log/info/warn/error/debug` are patched server-side.                                                                                                              |
| DB queries         | Optional thin adapters (see [Adapters](./adapters/sqlite)) — most ORMs and clients that go over HTTP are already covered by the outgoing-HTTP interceptor.                |

Every entry carries a `requestId` from `AsyncLocalStorage` when one is available, so the dashboard's **Related** tab can show every query, outgoing call, and log line that happened during a single request — even though none of those libraries know Sveltelens exists.

## Where the data goes

Entries are kept in the dev server process (memory ring buffer, or sqlite if configured) and served under `path`:

- `/__sveltelens`: the dashboard.
- `/__sveltelens/api`: the JSON API and WebSocket stream the dashboard uses.
- `/__sveltelens/mcp`: the [MCP endpoint](./mcp) for coding agents.

All three reject cross-origin browser requests and only exist while `vite dev` runs.
