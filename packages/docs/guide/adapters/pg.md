# PostgreSQL

Adapters wrap the _database driver_, not the ORM on top of it — so one adapter covers Drizzle, Kysely, and raw SQL alike.

```ts
import { Pool } from 'pg';
import { pg } from 'sveltelens/adapters/pg';

const pool = pg(new Pool({ connectionString: process.env.DATABASE_URL }));
```

Every `query(text, params)` or `query(config)` call is timed and recorded with a real `durationMs`, including failed queries. Pass the wrapped pool wherever you'd pass the original — `drizzle(pool)`, and so on. Works the same for a single `Client`.

The callback form of `query()` and query streams (`pg-query-stream`) pass through unwrapped rather than being misrecorded — switch those call sites to the promise form to have them captured.

## Everything else

Anything that talks HTTP (PocketBase, Supabase, a REST API client, `fetch`) is already captured by the outgoing-HTTP interceptor with no adapter needed. For a non-HTTP data source without a shipped adapter, call `recordQuery` from wherever your library exposes the SQL:

```ts
import { recordQuery } from 'sveltelens';

recordQuery({ sql, params, durationMs, connection: 'primary' });
```

It's a no-op when the plugin isn't running, so it's safe to leave in place.
