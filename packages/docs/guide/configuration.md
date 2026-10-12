# Configuration

`sveltelens()` accepts an options object; every field is optional.

```ts
sveltelens({
  enabled: true, // set false to fully disable
  path: '/__sveltelens', // where the dashboard + API mount
  storage: 'memory', // 'memory' | 'sqlite'
  sqlitePath: '.sveltelens/db.sqlite',
  maxEntries: 1000, // ring buffer size
  ignore: [...], // extra glob/regex route patterns to skip
  redactHeaders: ['authorization', 'cookie'],
});
```

| Option          | Default                     | Description                                                                                                             |
| --------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `enabled`       | `true`                      | Disable entirely without removing the plugin.                                                                            |
| `path`          | `/__sveltelens`             | Mount path for the dashboard, its API, and the [MCP endpoint](./mcp) (`<path>/mcp`).                                       |
| `storage`       | `'memory'`                  | `'memory'` uses an in-process ring buffer. `'sqlite'` persists to disk via `better-sqlite3` (lazily required — not a hard dependency). |
| `sqlitePath`    | `.sveltelens/db.sqlite`     | Only used when `storage: 'sqlite'`.                                                                                       |
| `maxEntries`    | `1000`                      | Max entries kept (oldest evicted first).                                                                                 |
| `ignore`        | vite/sveltelens internals   | Extra route patterns (string prefix, `*` glob, or `RegExp`) to exclude from capture.                                     |
| `redactHeaders` | `['authorization', 'cookie']` | Header names replaced with `[redacted]` in captured requests.                                                            |

Request and response bodies are truncated at 64KB, and binary bodies are never stored — only their size and content-type are recorded.
