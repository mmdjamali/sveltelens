# PostgreSQL (postgres.js)

Adapters wrap the _database driver_, not the ORM on top of it — so one adapter covers Drizzle, Kysely, and raw SQL alike. This is the `postgres` package specifically — for `pg` (node-postgres), see [PostgreSQL](./pg).

```ts
import postgres from 'postgres';
import { postgresJs } from '@mmdjamali/sveltelens/adapters/postgres-js';

const sql = postgresJs(postgres(process.env.DATABASE_URL!));
```

Every tagged-template query and `sql.unsafe()` call is timed and recorded, including failed queries. Pass the wrapped `sql` wherever you'd pass the original — `drizzle(sql)`, and so on.

postgres.js queries are lazy — nothing runs until you `await` the result or otherwise call `.then()` on it. The adapter only patches the returned query's own `.then`, so laziness and chaining (`.cursor()`, `.raw()`, ...) still work as normal. Two things aren't captured:

- Iterating with `.forEach()` or `for await` — those bypass `.then()`.
- Nested `sql` fragments get an approximate `$1..$n` placeholder numbering rather than their true one — fine for the dashboard, not meant to be copy-pastable back into `psql`.

Using something else? See [Everything else](./other).
