# Plugin system for sveltelens

Research date: 2026-10-17. Repo paths are relative to `packages/`. PocketBase facts are pinned to **PocketBase v0.40.5** (tag `v0.40.5`, the version the docs site also shows) and **JS SDK 0.28.1**.

## Summary

- Almost every extension point today is a closed union or a hard-coded list. `EntryType` is a 7-member string union (`sveltelens/src/types.ts:7`). The list of types is copied into four places (`storage/memory.ts:4`, `storage/sqlite.ts:9`, `api/mcp.ts:16`, `dashboard/src/lib/entry-types.ts:44-112`). The MCP helpers use exhaustive `switch` statements (`api/mcp.ts:61-122`). Opening `EntryType` to `${plugin}:${name}` strings, and building these lists from a registry, is most of the work.
- Storage already fits plugins. Both backends keep `type` as a string and `payload` as opaque JSON (`storage/sqlite.ts:36-45`, `:64`), so plugins can declare a payload type and need no per-plugin tables. Note: the `adapters/*` docs and modules are **query-capture adapters** (they call `recordQuery`). They are not storage backends, and `Storage` itself is internal on purpose (`storage/types.ts:3-7`, `index.ts:8-12`).
- The hard constraint is the dashboard. It ships prebuilt as a static SPA (`dashboard/svelte.config.js` uses adapter-static; `sveltelens/src/plugin.ts:16,75`), so plugins cannot add Svelte components to it at install time. A first version should therefore use declarative views: the plugin declares columns, the dashboard renders them with the existing `EntryTable`, and the server publishes them in a manifest endpoint. An iframe tab, like Nuxt DevTools has, can come later as an escape hatch.
- PocketBase has no realtime feed for logs. They live in `_logs` in `auxiliary.db`, can be read only by superusers through `GET /api/logs`, and are written in batches (flushed after 3s idle or at 200 entries). A PocketBase plugin must either poll with a superuser token, or have a small `pb_hooks` forwarder push each `_logs` row to sveltelens.
- PocketBase marks only **request** logs (`data.type = "request"`). A cron job that succeeds writes nothing. A failed JSVM cron writes `"[cronAdd] failed to execute cron job"` with `data.jobId`. `console.log` inside `pb_hooks` goes to stdout/stderr and never reaches `_logs`. So "cron/hook logs" can only be told apart if the app logs them that way on purpose, for example with `$app.logger().with("source","cron","job",id)`.

## Current architecture seams

| Seam | Where | What a plugin needs |
|---|---|---|
| Entry type union | `sveltelens/src/types.ts:7`, `:80-97` | `EntryType`/`EntryPayload` are closed. The file says it is "a public contract" (`types.ts:1-4`). Plugin entries need a `type: \`${string}:${string}\`; payload: unknown` arm. |
| Recording | `sveltelens/src/recorder.ts:7-12`, `:24-47` | `Recorder.record()` always sets `id` and `timestamp = Date.now()` (`:36-37`). Imported logs need a `timestamp` override, and an optional stable `id` so the same rows can be imported twice without duplicates. `INSERT OR REPLACE` in sqlite already handles that (`storage/sqlite.ts:62`). |
| Public record helper (prior art for a plugin-facing API) | `sveltelens/src/record.ts:10-33`, global state `state.ts:4-20` | `recordQuery` is already "the whole surface an adapter needs" and does nothing when the plugin is off. A plugin `ctx.record()` should behave the same way. |
| Collectors / interceptors | `sveltelens/src/intercept/index.ts:9-24` | A fixed set of three installers. The global uninstall key makes re-running safe under Vite restarts (`:6-13`). Plugin `setup()` teardown should follow the same pattern. |
| Wiring point | `sveltelens/src/plugin.ts:40-61` | `configureServer` builds storage, recorder, interceptors, the REST API and MCP. This is where `config.plugins` would be iterated. |
| Config shape | `sveltelens/src/config.ts:2-12`, `:30-48` | There is no `plugins` field. `resolveConfig` spreads `...config`, so adding the field is cheap. |
| Storage interface | `sveltelens/src/storage/types.ts:8-21` | `ListFilter.type` and `counts(): Record<EntryType, number>` are typed to the union. `MemoryStorage.counts` seeds only known types and does `result[entry.type]++` (`storage/memory.ts:66-72`), which gives `NaN` for an unknown type. `SqliteStorage.counts` already copies whatever types it finds (`storage/sqlite.ts:138-146`). |
| REST API | `sveltelens/src/api/rest.ts:39-53`, `:82-84` | `type` is passed through without a check (`type as never`, `:47`), so plugin types already work on the wire. A `GET /api/plugins` manifest would sit next to `/counts`. |
| WS stream | `sveltelens/src/api/ws.ts:18-24` | Pushes every `recorder` `entry` event. Plugin entries need no change here. |
| MCP registry | `sveltelens/src/api/mcp.ts:16`, `:18-51` (static `TOOLS`), `:61-122` (`summarize`/`isError`/`haystack` switches), `:172-190` (`callTool` switch), `:215` (`tools/list`) | Tools and the `type` enum are static. Plugins need (a) to add their types to the `list_entries` enum and supply `summarize`/`isError`/`searchText`, and (b) optionally to register their own tools. |
| Dashboard nav + views | `dashboard/src/lib/entry-types.ts:24-41` (`EntryTypeMeta`: slug, label, icon component, table, detail), `:44-119`; `Sidebar.svelte` iterates `ENTRY_TYPES`; `routes/[type]/+page.ts` → `entryTypeForSlug`; `routes/[type]/[id]/+page.ts:6-21` | Built-in types map to compiled Svelte components. A registry loaded from `/api/plugins` at boot could add `EntryTypeMeta` rows that point to a generic table and detail view. The routes are already generic over `[type]`. |
| Generic UI to reuse (ADR 0010) | `dashboard/src/lib/components/EntryTable.svelte` (props: `type`, `rows`, `id`, `columns`, `cells` snippet), `KeyValueTable.svelte`, `BodyView.svelte`, `ui/badge` | A `PluginTable` can build `columns` and `cells` from the column spec. A generic detail view = `DetailShell` + `KeyValueTable` + JSON `BodyView`. |
| Dashboard store | `dashboard/src/lib/store.svelte.ts:5-7`, `:28-37`, `:57` | `emptyCounts()` seeds from `ENTRY_TYPES`, and `counts[entry.type] + 1` gives `NaN` for unseeded types. It must seed from the merged registry. |
| Package layout | `sveltelens/package.json` `exports`: `.`, `./hook`, `./client`, `./adapters/*` | A first-party `./plugins/pocketbase` subpath would match the adapters layout. |

## PocketBase logging facts (v0.40.5)

**Storage and shape**
- Logs are stored in the `_logs` table (`core/log_model.go:14`), created in `auxiliary.db` by the aux migration with columns `id, level INTEGER, message TEXT, data JSON, created TEXT` and indexes on level, message, and created-hour ([migrations/1640988000_aux_init.go:10-21](https://github.com/pocketbase/pocketbase/blob/v0.40.5/migrations/1640988000_aux_init.go#L10-L21); file name `auxiliary.db` at [core/base.go:50](https://github.com/pocketbase/pocketbase/blob/v0.40.5/core/base.go#L50)).
- Model: `Created types.DateTime, Data JSONMap, Message string, Level int` ([core/log_model.go:21-28](https://github.com/pocketbase/pocketbase/blob/v0.40.5/core/log_model.go#L21-L28)). Message and data are truncated (~16KB data, 8000-char message by default, `:16-19`).
- `level` is a Go `slog.Level` int ([core/base.go:1524](https://github.com/pocketbase/pocketbase/blob/v0.40.5/core/base.go#L1524) `model.Level = int(l.Level)`). In slog that is DEBUG=-4, INFO=0, WARN=4, ERROR=8 ([pkg.go.dev/log/slog#Level](https://pkg.go.dev/log/slog#Level)). The PB docs' own query example filters debug/info as `-4`/`0` ([pocketbase.io/docs/js-logging](https://pocketbase.io/docs/js-logging/)).
- Writes are batched: flush 3s after the last write, at 200 entries, or before shutdown ([docs/js-logging](https://pocketbase.io/docs/js-logging/); [core/base.go:1504,1540](https://github.com/pocketbase/pocketbase/blob/v0.40.5/core/base.go#L1501-L1560)). Nothing is persisted if `Settings.Logs.MaxDays == 0` (`:1510`). Default `MaxDays: 5, LogIP: true` ([core/settings_model.go:157-160](https://github.com/pocketbase/pocketbase/blob/v0.40.5/core/settings_model.go#L157-L160)). Settings fields `maxDataSize, maxDays, minLevel, logIP, logAuthId` (`:548-558`).
- In `--dev` mode every log is also printed to the console and the min level is bypassed for printing ([core/base.go:1489-1499,1542-1547](https://github.com/pocketbase/pocketbase/blob/v0.40.5/core/base.go#L1489-L1547)).

**HTTP API**
- `GET /api/logs`, `GET /api/logs/{id}`, `GET /api/logs/stats`, `DELETE /api/logs` are all behind `RequireSuperuserAuth()` ([apis/logs.go:13-23](https://github.com/pocketbase/pocketbase/blob/v0.40.5/apis/logs.go#L13-L23); [docs/api-logs](https://pocketbase.io/docs/api-logs/)). They return 401 with no token and 403 for a non-superuser.
- List params: `page`, `perPage` (default 30), `sort` (e.g. `-created`, `rowid`), `filter` over `id, created, level, message, data.*` (e.g. `data.status >= 400`), `fields`. The response is `{page, perPage, totalItems, items[]}`, and each item is `{id, created, level, message, data}` ([docs/api-logs](https://pocketbase.io/docs/api-logs/); filter fields [apis/logs.go:25-28](https://github.com/pocketbase/pocketbase/blob/v0.40.5/apis/logs.go#L25-L28)).
- JS SDK: `pb.logs.getList(page, perPage, {filter, sort})`, `getOne(id)`, `getStats()` ([js-sdk src/services/LogService.ts](https://github.com/pocketbase/js-sdk/blob/master/src/services/LogService.ts), v0.28.1).
- Auth: authenticate a superuser (`pb.collection("_superusers").authWithPassword(...)`). Superusers can also mint long-lived impersonation tokens (`POST /api/collections/{c}/impersonate/{id}`, superuser-only, optional `duration`) ([apis/record_auth.go:68](https://github.com/pocketbase/pocketbase/blob/v0.40.5/apis/record_auth.go#L68), [record_auth_impersonate.go:45-47](https://github.com/pocketbase/pocketbase/blob/v0.40.5/apis/record_auth_impersonate.go#L45-L47)).

**No realtime for logs**
- Realtime broadcasts only Records. `realtimeResolveRecord` returns nil for any model that is not `*core.Record`/`RecordProxy` ([apis/realtime.go:419-437,531-545](https://github.com/pocketbase/pocketbase/blob/v0.40.5/apis/realtime.go#L531-L545)), and `Log` is a plain model. The options are **polling** (`filter: created > "<last>"`, `sort: created`) or a **push forwarder** in `pb_hooks`: the docs say `onModelCreate(..., "_logs")` can "inspect or change log records before they're saved, or to forward them elsewhere" ([docs/js-logging](https://pocketbase.io/docs/js-logging/)). Either way the 3s batch delay applies.

**What cron jobs and hooks actually log**
- Request logs are the only typed category: `slog.String("type","request")` plus `execTime, url, method, status, referer, userAgent, auth, [authId], [userIP, remoteIP], [error, details], [meta]` ([apis/middlewares.go:365-460](https://github.com/pocketbase/pocketbase/blob/v0.40.5/apis/middlewares.go#L365-L460), `type` at `:379`). Errors log at ERROR, successes at INFO.
- A JSVM hook (`onRecordCreate`, etc.) that throws inside a request ends up as that request log's `data.error`/`data.details`. Nothing marks it as coming from a hook (same file `:396-419`).
- `cronAdd(id, expr, handler)` wraps the handler. On error it logs `Error("[cronAdd] failed to execute cron job", jobId, error)`. **On success it logs nothing** ([plugins/jsvm/binds.go:106-126](https://github.com/pocketbase/pocketbase/blob/v0.40.5/plugins/jsvm/binds.go#L106-L126)). The cron docs don't mention logging either ([docs/js-jobs-scheduling](https://pocketbase.io/docs/js-jobs-scheduling/)).
- `console.log/warn/error` in `pb_hooks` goes to goja_nodejs's std printer, which writes to stdout/stderr (`console.Enable(vm)` at [plugins/jsvm/jsvm.go:203](https://github.com/pocketbase/pocketbase/blob/v0.40.5/plugins/jsvm/jsvm.go#L203); printer at [goja_nodejs console/std_printer.go](https://github.com/dop251/goja_nodejs/blob/master/console/std_printer.go)). **Those lines never reach `_logs`.** To be visible over the API, hooks must use `$app.logger().info(msg, k, v...)`, which supports `.with(...)` and `.withGroup(...)` ([docs/js-logging](https://pocketbase.io/docs/js-logging/)).
- Cron API: `GET /api/crons` returns `[{id, expression}]` (built-in `__pb*` jobs sorted last), and `POST /api/crons/{id}` runs a job fire-and-forget. Both are superuser-only ([apis/cron.go:15-59](https://github.com/pocketbase/pocketbase/blob/v0.40.5/apis/cron.go#L15-L59); `Job.MarshalJSON` [tools/cron/job.go:31-41](https://github.com/pocketbase/pocketbase/blob/v0.40.5/tools/cron/job.go#L31-L41)). SDK: `pb.crons.getFullList()`, `pb.crons.run(id)` ([js-sdk CronService.ts](https://github.com/pocketbase/js-sdk/blob/master/src/services/CronService.ts)).

**Already captured today without a plugin:** SvelteKit → PocketBase SDK calls appear as `client-request` entries through the fetch/undici interceptor (`docs/guide/how-it-works.md:8`).

## Prior art

- **Laravel Telescope (watchers).** A watcher is a class with `register($app)` and an `$options` array ([Watcher.php](https://github.com/laravel/telescope/blob/5.x/src/Watchers/Watcher.php)). Watchers are turned on and configured per class in `config/telescope.php` `'watchers' => [QueryWatcher::class => ['enabled' => …, 'slow' => 100]]` ([docs](https://laravel.com/docs/12.x/telescope#available-watchers)). Everything goes into one `telescope_entries` table with `type string(20)` and `content longText` (JSON), plus a tags table ([migration](https://github.com/laravel/telescope/blob/5.x/database/migrations/2018_08_08_100000_create_telescope_entries_table.php)). This is the same single-table, typed-JSON model sveltelens already uses, and it supports "no per-plugin schema". Telescope also has a `Schedule Watcher` for scheduled tasks, which is the closest match to the cron use case.
- **Vite plugin API.** A factory function returns a plain object with a required `name`. Arrays of plugins are flattened (presets). `configureServer` adds middleware, and returning a function from it runs after the internal middleware ([vite.dev/guide/api-plugin](https://vite.dev/guide/api-plugin)). sveltelens is already one of these (`plugin.ts:40-46`), so "a sveltelens plugin = factory returning an object" will feel familiar.
- **Nuxt DevTools custom tabs.** `addCustomTab(() => ({ name, title, icon: 'carbon:apps' /* Iconify or URL */, view: { type: 'iframe', src } }))`. The tab is an iframe served by the module ([devtools.nuxt.com/module/utils-kit](https://devtools.nuxt.com/module/utils-kit)). In v4 it is soft-deprecated in favour of Vite DevTools "docks" (`type: 'iframe' | 'launcher'`, with server RPC through `rpc.register`) ([devtools.nuxt.com/module/guide](https://devtools.nuxt.com/module/guide)). The lesson: a prebuilt devtools shell adds plugin UI through **iframes/URLs and data, not compiled components**.
- **Svelte/SvelteKit.** I found no first-party SvelteKit devtools plugin API to copy (not verified exhaustively). Vite DevTools docks (above) are the nearest Vite-native equivalent.

## Proposed API

### Shape A (recommended): declarative object + `setup(ctx)`

```ts
// sveltelens/src/plugins/types.ts (exported from package root)
export interface SveltelensPlugin {
  /** Namespace: entry types become `${name}:${type}`, routes `${path}/api/plugins/${name}/*`. */
  name: string;
  entryTypes?: PluginEntryType[];
  /** Start collectors. Return a teardown; called on server close / re-setup (cf. intercept/index.ts:9-24). */
  setup?(ctx: PluginContext): void | (() => void) | Promise<void | (() => void)>;
  /** v2: extra MCP tools, namespaced `${name}_${tool.name}`. */
  mcpTools?: PluginMcpTool[];
}

export interface PluginEntryType<P = Record<string, unknown>> {
  type: string;                 // 'log' -> stored as 'pocketbase:log'
  label: string;                // sidebar + heading
  badgeLabel?: string;
  /** Lucide icon name from a fixed set the dashboard bundles. */
  icon?: string;
  emptyMessage?: string;
  /** Serializable column spec rendered by a generic PluginTable over EntryTable. */
  columns: { label: string; field: string /* dot path into payload, or '$timestamp'|'$duration' */;
             format?: 'text' | 'mono' | 'level' | 'badge' | 'time' | 'duration'; class?: string }[];
  // server-only (not in manifest): power MCP list_entries + search
  summarize?(payload: P): string;
  isError?(payload: P): boolean;
  searchText?(payload: P): string;
}

export interface PluginContext {
  /** No-op while paused/disabled, like recordQuery. `type` is the local name. */
  record<P>(type: string, payload: P, opts?: { id?: string; timestamp?: number; durationMs?: number | null; requestId?: string | null }): void;
  config: ResolvedConfig;
  signal: AbortSignal;          // aborted on teardown
  log(msg: string): void;       // prefixed `[sveltelens:<name>]`, NOT console.* (would self-capture via intercept/console.ts)
}

// config.ts
export interface SveltelensConfig { /* ... */ plugins?: SveltelensPlugin[] }
```

Changes this needs (all internal):
1. `types.ts`: add `| { type: \`${string}:${string}\`; payload: Record<string, unknown> }` to `EntryPayload`. Keep the built-in arms so narrowing still works.
2. `recorder.ts:35-43`: accept an optional `id` and `timestamp`.
3. Replace the four `ENTRY_TYPES` copies with one registry, `builtins + plugins.flatMap(entryTypes)`, passed into `MemoryStorage.counts`, `SqliteStorage.counts`, and `createMcpMiddleware`. In `summarize/isError/haystack` (`mcp.ts:61-122`), add a `default:` that calls the plugin callbacks, falling back to `JSON.stringify(payload)`.
4. `rest.ts`: `GET ${path}/api/plugins` returns the serializable part of each entry type (`slug` = `${name}-${type}`).
5. Dashboard: `store.init()` fetches the manifest. `entry-types.ts` gets `registerPluginTypes(manifest)`, which adds `EntryTypeMeta` with `table: PluginTable`, `detail: PluginDetail` (both built from `EntryTable`, `KeyValueTable`, `BodyView`, `Badge`). `Sidebar` and the `[type]` routes need no change beyond reading the merged map.
6. `plugin.ts:49-61`: after `setSveltelensState`, run each `setup(ctx)` and keep the teardowns on `httpServer.once('close')`.

### Shape B (alternative): imperative registration (Vite-hook style)

```ts
export interface SveltelensPlugin {
  name: string;
  configureLens(api: {
    addEntryType(def: PluginEntryType): void;
    addNavItem(item: { label: string; icon?: string; href: string /* own iframe page */ }): void;
    addMcpTool(tool: PluginMcpTool): void;
    addMiddleware(mw: Connect.NextHandleFunction): void;
    record: PluginContext['record'];
  }): void | (() => void);
}
```

Trade-offs: B can register things conditionally (for example only if PB is reachable) and makes it natural to add nav items that aren't entry types (iframe pages, à la Nuxt). But the manifest is only known after `configureLens` runs, and the plugin surface is harder to read at a glance. A keeps the plugin a plain, introspectable object that the dashboard manifest can be built from without running anything, which matches how `ENTRY_TYPE_META` is already a static table.

### Smallest first version (YAGNI)

Ship Shape A with only `name`, `entryTypes` (columns + `summarize`/`isError`), and `setup(ctx.record)`. Plugin entries appear in the existing MCP `list_entries`/`get_entry` with no new tools. **Defer:** `mcpTools`, iframe/custom nav pages, plugin-owned REST routes, public `Storage` backends, per-plugin retention, and typed schemas beyond TS generics. Payloads are JSON blobs, so "declaring stored data" in v1 means a TS payload type plus the column spec. No migrations are needed: sqlite already stores any `type` string.

## PocketBase plugin sketch

```ts
// sveltelens/src/plugins/pocketbase.ts -> export '@mmdjamali/sveltelens/plugins/pocketbase'
import type { SveltelensPlugin } from '../plugins/types.js';

interface PbLog { pbId: string; level: number; message: string; source: 'request' | 'cron' | 'hook' | 'app';
                  jobId: string | null; status: number | null; data: Record<string, unknown> }

const LEVEL = (n: number) => (n >= 8 ? 'error' : n >= 4 ? 'warn' : n >= 0 ? 'info' : 'debug'); // slog levels

/** Classify using only what PB actually emits (see "PocketBase logging facts"). */
function sourceOf(m: string, d: Record<string, unknown>): PbLog['source'] {
  if (d.type === 'request') return 'request';                               // apis/middlewares.go:379
  if (m.startsWith('[cronAdd]') || d.source === 'cron') return 'cron';      // jsvm/binds.go:117 or user convention
  if (d.source === 'hook') return 'hook';                                   // user convention only
  return 'app';
}

export function pocketbase(opts: {
  url: string;                    // e.g. process.env.PB_URL
  token?: string;                 // superuser/impersonate token, preferred
  email?: string; password?: string;
  includeRequests?: boolean;      // default false: SvelteKit->PB calls already show as client-request
  intervalMs?: number;            // default 2000 (PB flushes every 3s anyway)
}): SveltelensPlugin {
  return {
    name: 'pocketbase',
    entryTypes: [{
      type: 'log', label: 'PocketBase', badgeLabel: 'PB Log', icon: 'database',
      emptyMessage: 'Waiting for PocketBase logs (needs a superuser token and Logs.MaxDays > 0).',
      columns: [
        { label: 'Level', field: 'level', format: 'level', class: 'w-24 pl-4' },
        { label: 'Source', field: 'source', format: 'badge', class: 'w-24' },
        { label: 'Message', field: 'message', format: 'mono' },
        { label: 'Happened', field: '$timestamp', format: 'time', class: 'w-28 pr-4 text-right' },
      ],
      summarize: (p: PbLog) => `pb ${p.source}${p.jobId ? `:${p.jobId}` : ''} ${LEVEL(p.level)} ${p.message}`,
      isError: (p: PbLog) => p.level >= 8,
      searchText: (p: PbLog) => `${p.message} ${JSON.stringify(p.data)}`,
    }],
    async setup(ctx) {
      const token = opts.token ?? (await authSuperuser(opts));  // POST /api/collections/_superusers/auth-with-password
      let since = new Date().toISOString().replace('T', ' ');    // PB 'YYYY-MM-DD HH:MM:SS.sssZ'
      const timer = setInterval(async () => {
        const filter = `created > "${since}"${opts.includeRequests ? '' : ' && data.type != "request"'}`;
        const res = await fetch(`${opts.url}/api/logs?sort=created&perPage=200&filter=${encodeURIComponent(filter)}`,
          { headers: { Authorization: token }, signal: ctx.signal });
        if (!res.ok) return ctx.log(`GET /api/logs -> ${res.status}`);
        const { items } = await res.json();
        for (const l of items) {
          since = l.created;
          ctx.record<PbLog>('log', {
            pbId: l.id, level: l.level, message: l.message, source: sourceOf(l.message, l.data),
            jobId: (l.data?.jobId ?? l.data?.job ?? null) as string | null,
            status: (l.data?.status ?? null) as number | null, data: l.data,
          }, { id: `pb:${l.id}`, timestamp: Date.parse(l.created.replace(' ', 'T')), requestId: null });
        }
      }, opts.intervalMs ?? 2000);
      return () => clearInterval(timer);
    },
  };
}
```

Notes:
- The plugin's own polling `fetch` will be captured as `client-request` entries by the outgoing-HTTP interceptor (`intercept/http-client.ts`). It needs an internal "don't record" bypass, or a default `ignore` entry for the PB logs URL (the `ignore` config today applies only to incoming routes, `hook.ts:175`).
- Recommended `pb_hooks` convention, documented in the plugin README so cron and hook logs can be told apart:
  ```js
  cronAdd("cleanup", "*/5 * * * *", () => { const log = $app.logger().with("source","cron","job","cleanup"); log.info("start"); /*...*/ log.info("done"); });
  onRecordCreate((e) => { $app.logger().with("source","hook","hook","onRecordCreate").info("created", "id", e.record.id); e.next(); }, "posts");
  ```
- Push alternative (lower latency, no polling, no token held in Vite): a `pb_hooks/sveltelens.pb.js` with `onModelAfterCreateSuccess((e) => { $http.send({ url: SVELTELENS_URL + "/api/plugins/pocketbase/ingest", method: "POST", body: JSON.stringify(e.model) }); e.next() }, "_logs")`. Two problems: it needs plugin-owned REST routes (deferred above), and it conflicts with `isSameOrigin` on the API (`api/rest.ts:32`). The `_logs` model hook is documented as a forwarding point ([docs/js-logging](https://pocketbase.io/docs/js-logging/)), but I did not run this snippet.
- v2 MCP tools fit naturally here: `pocketbase_list_crons` (`GET /api/crons`) and `pocketbase_run_cron` (`POST /api/crons/{id}`) ([apis/cron.go:15-19](https://github.com/pocketbase/pocketbase/blob/v0.40.5/apis/cron.go#L15-L19)).

## Open questions

1. **Shape A or B?** Do you want nav items that aren't entry types (for example a "Crons" page with "Run now" buttons) in v1? If yes, that argues for B, or A plus an iframe `pages` field.
2. **Custom Svelte views:** is a generic column-spec table acceptable for v1, or must plugins ship their own components? The latter means either rebuilding the dashboard with the plugins included or loading ESM/web components at runtime, both large changes to the static-SPA model (`plugin.ts:16-38`).
3. **Packaging:** should first-party plugins be subpaths (`@mmdjamali/sveltelens/plugins/pocketbase`, like `./adapters/*`) or separate packages?
4. **Public contract:** opening `EntryType` to template strings changes the documented wire format (`types.ts:1-4`). Is that acceptable now (pre-1.0), and should `Storage` stay internal (`index.ts:8-12`)?
5. **Poll vs push** for PocketBase: are you OK keeping a superuser token in `vite.config` env, or do you prefer the `pb_hooks` forwarder (which needs an ingest route that allows cross-origin requests from PB)?
6. **Request logs:** should PB `request` logs be imported by default, or skipped because SvelteKit → PB calls are already captured as `client-request`? Should they be correlated with those entries (URL + time window) and linked through `requestId`?
7. **Retention:** should plugin entries share the global `maxEntries` ring (`config.ts:7`)? A chatty PB instance could push out SvelteKit requests.
8. **Classification:** is the `source`/`job` attribute convention for cron/hook logs acceptable, given PB itself gives no marker except on cron failure?
