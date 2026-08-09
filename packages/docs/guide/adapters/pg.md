# PostgreSQL

Adapters wrap the _database driver_, not the ORM on top of it — so one adapter covers Drizzle, Kysely, and raw SQL alike. This is the `pg` (node-postgres) package specifically — for `postgres` (postgres.js), see [PostgreSQL (postgres.js)](./postgres-js).

```ts
import { Pool } from 'pg';
import { pg } from 'sveltelens/adapters/pg';

const pool = pg(new Pool({ connectionString: process.env.DATABASE_URL }));
```

Every `query(text, params)` or `query(config)` call is timed and recorded with a real `durationMs`, including failed queries. Pass the wrapped pool wherever you'd pass the original — `drizzle(pool)`, and so on. Works the same for a single `Client`.

The callback form of `query()` and query streams (`pg-query-stream`) pass through unwrapped rather than being misrecorded — switch those call sites to the promise form to have them captured.

Using something else? See [Everything else](./other).
