# Adapters

Adapters wrap the _database driver_, not the ORM on top of it — so one adapter covers Drizzle, Kysely, and raw SQL alike, and it sees each query finish rather than only start.

## SQLite

```ts
import Database from 'better-sqlite3';
import { betterSqlite3 } from 'sveltelens/adapters/sqlite';

const sqlite = betterSqlite3(new Database('app.db'));
```

Every prepared statement's `run`/`get`/`all` is timed and recorded with a real `durationMs`. Pass the wrapped database wherever you'd pass the original — `drizzle(sqlite)`, and so on.

Running on Bun without the `better-sqlite3` native dependency? See [Bun SQLite](./bun-sqlite) for the built-in equivalent.

## Everything else

Anything that talks HTTP (PocketBase, Supabase, a REST API client, `fetch`) is already captured by the outgoing-HTTP interceptor with no adapter needed. For a non-HTTP data source without a shipped adapter, call `recordQuery` from wherever your library exposes the SQL:

```ts
import { recordQuery } from 'sveltelens';

recordQuery({ sql, params, durationMs, connection: 'primary' });
```

It's a no-op when the plugin isn't running, so it's safe to leave in place.
