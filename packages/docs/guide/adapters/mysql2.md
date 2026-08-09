# MySQL

Adapters wrap the _database driver_, not the ORM on top of it — so one adapter covers Drizzle, Kysely, and raw SQL alike.

```ts
import { createPool } from 'mysql2/promise';
import { mysql2 } from 'sveltelens/adapters/mysql2';

const pool = mysql2(createPool({ uri: process.env.DATABASE_URL }));
```

Every `query()` and `execute()` call is timed and recorded with a real `durationMs`, including failed queries. Pass the wrapped pool wherever you'd pass the original — `drizzle(pool)`, and so on. Works the same for a single `Connection`.

Only the promise API (`mysql2/promise`) is supported — the callback-style `mysql2` client has no return value to attach timing to.

Using something else? See [Everything else](./other).
