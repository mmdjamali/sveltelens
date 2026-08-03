# libSQL / Turso

Adapters wrap the _database driver_, not the ORM on top of it — so one adapter covers Drizzle, Kysely, and raw SQL alike.

```ts
import { createClient } from '@libsql/client';
import { libsql } from 'sveltelens/adapters/libsql';

const client = libsql(createClient({ url: process.env.DATABASE_URL!, authToken: process.env.DATABASE_AUTH_TOKEN }));
```

Every `execute(sql, args?)` / `execute({ sql, args })` call is timed and recorded with a real `durationMs`, including failed queries. Pass the wrapped client wherever you'd pass the original — `drizzle(client)`, and so on.

`batch()` and interactive transactions aren't wrapped — only single-statement `execute()` calls.

## Everything else

Anything that talks HTTP (PocketBase, Supabase, a REST API client, `fetch`) is already captured by the outgoing-HTTP interceptor with no adapter needed. For a non-HTTP data source without a shipped adapter, call `recordQuery` from wherever your library exposes the SQL:

```ts
import { recordQuery } from 'sveltelens';

recordQuery({ sql, params, durationMs, connection: 'primary' });
```

It's a no-op when the plugin isn't running, so it's safe to leave in place.
