<p align="center"><img width="140" src="https://raw.githubusercontent.com/mmdjamali/sveltelens/main/packages/docs/public/logo.svg"/></p>
<p align="center">
  <img src="https://skillicons.dev/icons?i=svelte,ts,vite,bun" />
  <br/>
  <a href="https://www.npmjs.com/package/@mmdjamali/sveltelens"><kbd>📦 npm</kbd></a>
  <a href="https://mmdjamali.github.io/sveltelens/"><kbd>📖 docs</kbd></a>
</p>

<br/><br/>

# 🔍 sveltelens

A debugging dashboard for SvelteKit dev servers, in the spirit of [Laravel Telescope](https://laravel.com/docs/telescope).

Open `/__sveltelens` while `vite dev` runs and you see every request your app handled. Each one comes with the outgoing HTTP calls, database queries, `console` output, and errors that happened while it ran. You don't instrument your own code. sveltelens patches Node's `fetch`, undici, and `console` inside the dev server, so it works with `axios`, `got`, the PocketBase or Supabase SDKs, or whatever else you use.

It only runs during `vite dev`. Production builds don't include it.

## 📥 Install

```sh
npm i -D @mmdjamali/sveltelens
```

## ⚙️ Setup

Add the plugin to `vite.config.ts`:

```ts
import { sveltekit } from '@sveltejs/kit/vite';
import { sveltelens } from '@mmdjamali/sveltelens';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit(), sveltelens()],
});
```

Add the hooks to `src/hooks.server.ts`:

```ts
import { sveltelensHandle, sveltelensHandleError } from '@mmdjamali/sveltelens/hook';
import { sequence } from '@sveltejs/kit/hooks';

export const handle = sequence(sveltelensHandle /*, ...your other hooks */);
export const handleError = sveltelensHandleError;
```

Run `npm run dev` and open http://localhost:5173/__sveltelens.

You can leave the hook in place for production. When the plugin isn't running, `sveltelensHandle` passes requests straight through.

`handleError` is optional, but without it you miss errors thrown in `load`. SvelteKit turns those into an error page before they reach `handle`. If you already have a `handleError`, call `sveltelensHandleError(input)` from inside it.

## ✨ What it captures

| Data | How |
|---|---|
| Incoming requests | Method, path, route id, status, duration, headers, bodies (via `sveltelensHandle`) |
| Outgoing HTTP | Any server-side `fetch` or undici call, including through SDKs |
| Browser requests | Opt-in, see below |
| DB queries | Opt-in adapters, see below |
| Logs | `console.log`, `info`, `warn`, `error`, `debug` on the server |
| Exceptions | Uncaught errors, unhandled rejections, and errors from `handle` and `load` |

Each entry is linked to the request that caused it. Open a request, then its Related tab, to see its queries, outgoing calls, and log lines together.

Bodies over 64KB are truncated. Binary bodies aren't stored; only their size and content type are kept. `authorization` and `cookie` headers are redacted by default.

### Browser requests

To capture `fetch` calls made in the page, add this to `src/hooks.client.ts`:

```ts
import { installClient } from '@mmdjamali/sveltelens/client';

if (import.meta.env.DEV) installClient();
```

These show up on their own Browser Requests page. This also works for SPA-mode and `adapter-static` apps. XHR calls aren't captured.

### Database queries

Anything that talks to its database over HTTP is already captured. For a driver that talks to the database directly, wrap the client. The adapter wraps the driver, so Drizzle, Kysely, and raw SQL on top of it all get captured:

```ts
import { Pool } from 'pg';
import { pg } from '@mmdjamali/sveltelens/adapters/pg';

const pool = pg(new Pool({ connectionString: process.env.DATABASE_URL }));
```

Adapters: `pg`, `postgres-js`, `mysql2`, `sqlite` (better-sqlite3), `libsql`, `bun-sqlite`, `node-sqlite`, `mongodb`. Import each one from `@mmdjamali/sveltelens/adapters/<name>`.

For a data source without an adapter, record queries yourself. The call does nothing when the plugin isn't running:

```ts
import { recordQuery } from '@mmdjamali/sveltelens';

recordQuery({ sql, params, durationMs, connection: 'primary' });
```

## 🛠 Options

Every option is optional.

```ts
sveltelens({
  enabled: true,
  path: '/__sveltelens',
  storage: 'memory', // or 'sqlite'
  sqlitePath: '.sveltelens/db.sqlite',
  maxEntries: 1000,
  ignore: ['/healthz', /^\/assets\//],
  redactHeaders: ['authorization', 'cookie'],
});
```

| Option | Default | What it does |
|---|---|---|
| `enabled` | `true` | Turns sveltelens off without removing the plugin. |
| `path` | `/__sveltelens` | Where the dashboard, its API, and the MCP endpoint are served. |
| `storage` | `'memory'` | `'memory'` keeps entries in the dev server process. `'sqlite'` writes them to disk so they survive restarts (needs `better-sqlite3` installed). |
| `sqlitePath` | `.sveltelens/db.sqlite` | Database file for `storage: 'sqlite'`. |
| `maxEntries` | `1000` | How many entries to keep. The oldest are dropped first. |
| `ignore` | Vite and sveltelens internals | Extra routes to skip: a path prefix, a `*` glob, or a `RegExp`. |
| `redactHeaders` | `['authorization', 'cookie']` | Headers whose values are replaced with `[redacted]`. |

## 🤖 Using it with a coding agent (MCP)

The dev server also serves an [MCP](https://modelcontextprotocol.io) endpoint. A coding agent can use it to find failing requests and read their queries, logs, and stack traces, so you don't have to paste them into the chat. For Claude Code:

```sh
claude mcp add --transport http sveltelens http://localhost:5173/__sveltelens/mcp
```

Tools: `list_entries`, `get_entry`, `get_request`, `clear_entries`.

The dashboard, API, and MCP endpoint all reject cross-origin browser requests, and none of them exist outside `vite dev`.

## 📖 Docs

The full guide covers each adapter, how capture works, and MCP setup for other clients: https://mmdjamali.github.io/sveltelens/

## 🤝 Contributing

Bug reports and pull requests are welcome. For anything larger than a small fix, open an [issue](https://github.com/mmdjamali/sveltelens/issues) first so we can agree on the approach.

### Repo layout

This is a Bun workspace:

| Path | What it is |
|---|---|
| `packages/sveltelens` | The published package: Vite plugin, hook, interceptors, adapters, storage, MCP |
| `packages/dashboard` | The SvelteKit app behind `/__sveltelens`. It's built to static files and bundled into the package. |
| `packages/docs` | The VitePress docs site |
| `examples/demo-app` | A SvelteKit app wired up with sveltelens, for trying changes by hand |

### Running it locally

You need [Bun](https://bun.sh) 1.3.14 (see `packageManager` in `package.json`).

```sh
bun install
bun run build:dashboard   # builds the dashboard into packages/sveltelens/dashboard-dist
bun run build:package     # the demo app imports the built package
bun run dev:demo          # demo app at http://localhost:5173, dashboard at /__sveltelens
```

After changing the dashboard or the package, rebuild that part before restarting the demo.

### Before opening a PR

```sh
bun run test    # package and dashboard tests (vitest)
bun run check   # type checks for package, dashboard, and demo
bun run lint    # biome
```

If you add a new adapter or option, add a page or a row for it under `packages/docs/guide` too (`bun run dev:docs` to preview).

## 📄 License

MIT, see [LICENSE](https://github.com/mmdjamali/sveltelens/blob/main/LICENSE).
