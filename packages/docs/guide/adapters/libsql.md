# libSQL / Turso

Adapters wrap the _database driver_, not the ORM on top of it — so one adapter covers Drizzle, Kysely, and raw SQL alike.

```ts
import { createClient } from '@libsql/client';
import { libsql } from '@mmdjamali/sveltelens/adapters/libsql';

const client = libsql(createClient({ url: process.env.DATABASE_URL!, authToken: process.env.DATABASE_AUTH_TOKEN }));
```

Every `execute(sql, args?)` / `execute({ sql, args })` call is timed and recorded with a real `durationMs`, including failed queries. Pass the wrapped client wherever you'd pass the original — `drizzle(client)`, and so on.

`batch()` and interactive transactions aren't wrapped — only single-statement `execute()` calls.

Using something else? See [Everything else](./other).
