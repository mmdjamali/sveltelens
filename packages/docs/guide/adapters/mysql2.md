# MySQL

Adapters wrap the _database driver_, not the ORM on top of it — so one adapter covers Drizzle, Kysely, and raw SQL alike.

```ts
import { createPool } from 'mysql2/promise';
import { mysql2 } from 'sveltelens/adapters/mysql2';

const pool = mysql2(createPool({ uri: process.env.DATABASE_URL }));
```

Every `query()` and `execute()` call is timed and recorded with a real `durationMs`, including failed queries. Pass the wrapped pool wherever you'd pass the original — `drizzle(pool)`, and so on. Works the same for a single `Connection`.

Only the promise API (`mysql2/promise`) is supported — the callback-style `mysql2` client has no return value to attach timing to.

## Everything else

Anything that talks HTTP (PocketBase, Supabase, a REST API client, `fetch`) is already captured by the outgoing-HTTP interceptor with no adapter needed. For a non-HTTP data source without a shipped adapter, call `recordQuery` from wherever your library exposes the SQL:

```ts
import { recordQuery } from 'sveltelens';

recordQuery({ sql, params, durationMs, connection: 'primary' });
```

It's a no-op when the plugin isn't running, so it's safe to leave in place.
