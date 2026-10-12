# MCP Server

While the dev server runs, Sveltelens serves an [MCP](https://modelcontextprotocol.io) endpoint so coding agents (Claude Code, Cursor, etc.) can read what your app captured: requests, form actions, server and browser fetches, DB queries, logs and exceptions. The agent sees the same data as the dashboard, without you copying anything into the chat.

The URL is printed at startup next to the dashboard URL:

```
  ➜  Sveltelens:  http://localhost:5173/__sveltelens
  ➜  Sveltelens MCP:  http://localhost:5173/__sveltelens/mcp
```

## Connect an agent

Claude Code:

```sh
claude mcp add --transport http sveltelens http://localhost:5173/__sveltelens/mcp
```

Any client that supports MCP's Streamable HTTP transport works with the same URL. Change the port if Vite picked a different one, and the path if you set [`path`](./configuration).

No extra process and no extra install: the endpoint is part of the plugin and needs no setup.

## Tools

| Tool            | What it does                                                                                                        |
| --------------- | ------------------------------------------------------------------------------------------------------------------- |
| `list_entries`  | Newest-first summary lines. Filters: `type`, `requestId`, `errorsOnly`, `search`, `limit` (default 20, max 100), `cursor`. |
| `get_entry`     | Full JSON for one entry: headers, bodies, SQL params, stack traces.                                                  |
| `get_request`   | One server request plus every query, log, exception and fetch it caused, in order. Takes a `requestId` or the id of any entry from that request. |
| `clear_entries` | Deletes all entries. Useful before reproducing a bug.                                                                |

### Filters

- `type`: `request`, `action`, `client-request` (server-side fetch), `browser-request`, `query`, `log`, `exception`.
- `errorsOnly`: HTTP status ≥ 400, form actions with result `failure`/`error`, failed fetches, query errors, `error`-level logs (not `warn`), and all exceptions.
- `search`: case-insensitive substring match on the path, URL, SQL or message.
- `errorsOnly` and `search` only look at the newest 1000 entries.

## What the agent sees

Lists come back as one line per entry so they stay small. Each line starts with the entry id, followed by the time in UTC (`Z`):

```
k3j9x 14:02:11Z request POST /api/cart → 500 (42ms) [requestId r8f2a, route /api/cart]
p0q1z 14:02:11Z query (3ms) SELECT * FROM cart WHERE user_id = ? [ERR: relation "cart" does not exist]
m2n4b 14:02:10Z action POST /checkout?/pay → failure (31ms) [requestId t5y6u, action pay]
c7v8n 14:02:09Z client GET https://api.example.com/items → 200 (120ms)
w1e2r 14:02:08Z log warn Stock low for sku 42
nextCursor: w1e2r
```

`get_request` shows the request first, then everything it caused, with each entry's offset from the start of the request:

```
k3j9x 14:02:11Z request POST /api/cart → 500 (42ms) [requestId r8f2a, route /api/cart]
  +2ms p0q1z 14:02:11Z query (3ms) SELECT * FROM cart WHERE user_id = ? [ERR: relation "cart" does not exist]
  +6ms h5j6k 14:02:11Z exception PostgresError: relation "cart" does not exist
```

SQL, messages and errors are cut to 200 characters in these lines. Use `get_entry` to get the full entry, including request and response bodies.

## Typical workflow

1. Agent calls `clear_entries`.
2. You (or the agent, through a browser tool) reproduce the bug.
3. Agent calls `list_entries` with `errorsOnly: true`.
4. Agent calls `get_request` on the failing request, then `get_entry` for the bodies or stack trace it needs.

## Notes

- The endpoint only exists while the dev server runs, because that is where the entries live. With `storage: 'sqlite'` it reads the same database the dashboard does.
- It follows the same rules as the dashboard API. It is on whenever `enabled` is, and there is no separate option to turn it off. Cross-origin browser requests get a 403, and captured headers and bodies have already been redacted.
- Transport is stateless JSON over HTTP POST: no sessions and no SSE stream. `GET` returns 405.
