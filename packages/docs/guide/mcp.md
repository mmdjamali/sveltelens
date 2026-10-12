# MCP Server

While the dev server runs, Sveltelens serves an [MCP](https://modelcontextprotocol.io) endpoint so coding agents can read what your app captured: requests, form actions, fetches, DB queries, logs and exceptions.

The URL is printed at startup next to the dashboard URL:

```
  ➜  Sveltelens MCP:  http://localhost:5173/__sveltelens/mcp
```

## Connect an agent

Claude Code:

```sh
claude mcp add --transport http sveltelens http://localhost:5173/__sveltelens/mcp
```

Any client that speaks Streamable HTTP works. Point it at the same URL. Change the port if Vite picked a different one, and the path if you set `path`.

## Tools

| Tool            | What it does                                                                                                    |
| --------------- | --------------------------------------------------------------------------------------------------------------- |
| `list_entries`  | Newest-first summary lines. Filters: `type`, `requestId`, `errorsOnly`, `search`, `limit` (default 20), `cursor`. |
| `get_entry`     | Full JSON for one entry: headers, bodies, SQL params, stack traces.                                              |
| `get_request`   | One server request plus every query, log, exception and fetch it caused, in order.                               |
| `clear_entries` | Deletes all entries. Useful before reproducing a bug.                                                            |

`errorsOnly` matches HTTP status ≥ 400, failed form actions, query errors, `error`-level logs and exceptions. `errorsOnly` and `search` only look at the newest 1000 entries.

## Notes

- The endpoint only exists while the dev server runs, because that is where the entries live.
- It follows the same rules as the dashboard API: it is only on when `enabled` is set, cross-origin browser requests get a 403, and captured data has already been redacted.
