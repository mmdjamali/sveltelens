# sveltelens

A local developer observability dashboard for SvelteKit, inspired by [Laravel Telescope](https://laravel.com/docs/telescope). Dev-only, zero-config, and package-agnostic: it captures requests, outgoing HTTP calls, DB queries, logs, and exceptions no matter which HTTP client, SDK, or ORM your app uses.

## Install

```sh
npm i -D sveltelens
```

## Setup

**1. Add the plugin** to `vite.config.ts`:

```ts
import { sveltekit } from '@sveltejs/kit/vite';
import { sveltelens } from 'sveltelens';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit(), sveltelens()],
});
```

**2. Add the hook** to `src/hooks.server.ts`:

```ts
import { sveltelensHandle } from 'sveltelens/hook';
import { sequence } from '@sveltejs/kit/hooks';

export const handle = sequence(sveltelensHandle /*, ...your other hooks */);
```

Run `npm run dev` and open **http://localhost:5173/__sveltelens**.

Nothing runs in production builds — the plugin is dev-only (`apply: 'serve'`), and `sveltelensHandle` becomes a no-op passthrough when the plugin isn't active, so it's safe to leave the import in place.

## How it works

Sveltelens patches Node platform primitives inside the Vite dev server process, so it sees everything regardless of which libraries your app uses:

| Data | How it's captured |
|---|---|
| Incoming requests | `sveltelensHandle` wraps `resolve()` in `AsyncLocalStorage`, recording method, path, route id, status, duration, headers, and truncated bodies. |
| Outgoing HTTP | Subscribes to undici's `diagnostics_channel` events and patches `globalThis.fetch`, so plain `fetch`, `axios`, `got`, and SDKs like the PocketBase client are all captured without an adapter. |
| Exceptions | `process.on('uncaughtException'/'unhandledRejection')`, plus errors caught in the handle hook. |
| Logs | `console.log/info/warn/error/debug` are patched server-side. |
| DB queries | Optional thin adapters (see below) — most ORMs and clients that go over HTTP are already covered by the outgoing-HTTP interceptor. |

Every entry carries a `requestId` from `AsyncLocalStorage` when one is available, so the dashboard's **Related** tab can show every query, outgoing call, and log line that happened during a single request — even though none of those libraries know Sveltelens exists.

## Config

```ts
sveltelens({
  enabled: true,              // set false to fully disable
  path: '/__sveltelens',       // where the dashboard + API mount
  storage: 'memory',          // 'memory' | 'sqlite'
  sqlitePath: '.sveltelens/db.sqlite',
  maxEntries: 1000,           // ring buffer size
  ignore: [...],              // extra glob/regex route patterns to skip
  redactHeaders: ['authorization', 'cookie'],
})
```

| Option | Default | Description |
|---|---|---|
| `enabled` | `true` | Disable entirely without removing the plugin. |
| `path` | `/__sveltelens` | Mount path for the dashboard and its API. |
| `storage` | `'memory'` | `'memory'` uses an in-process ring buffer. `'sqlite'` persists to disk via `better-sqlite3` (lazily required — not a hard dependency). |
| `sqlitePath` | `.sveltelens/db.sqlite` | Only used when `storage: 'sqlite'`. |
| `maxEntries` | `1000` | Max entries kept (oldest evicted first). |
| `ignore` | vite/sveltelens internals | Extra route patterns (string prefix, `*` glob, or `RegExp`) to exclude from capture. |
| `redactHeaders` | `['authorization', 'cookie']` | Header names replaced with `[redacted]` in captured requests. |

Request and response bodies are truncated at 64KB and binary bodies are never stored (only size + content-type are recorded).

## Adapters

Adapters wrap the *database driver*, not the ORM on top of it — so one adapter covers
Drizzle, Kysely, and raw SQL alike, and it sees each query finish rather than only start.

### SQLite

```ts
import Database from 'better-sqlite3';
import { betterSqlite3 } from 'sveltelens/adapters/sqlite';

const sqlite = betterSqlite3(new Database('app.db'));
```

Every prepared statement's `run`/`get`/`all` is timed and recorded with a real `durationMs`.
Pass the wrapped database wherever you'd pass the original — `drizzle(sqlite)`, and so on.

### Everything else

Anything that talks HTTP (PocketBase, Supabase, a REST API client, `fetch`) is already captured
by the outgoing-HTTP interceptor with no adapter needed. For a non-HTTP data source without a
shipped adapter, call `recordQuery` from wherever your library exposes the SQL:

```ts
import { recordQuery } from 'sveltelens';

recordQuery({ sql, params, durationMs, connection: 'primary' });
```

It's a no-op when the plugin isn't running, so it's safe to leave in place.

## Example

See `examples/demo-app` in this repo for a working SvelteKit app wired up with Drizzle + an outgoing `fetch` call.

## License

MIT
