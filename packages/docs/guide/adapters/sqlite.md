# SQLite

Adapters wrap the _database driver_, not the ORM on top of it — so one adapter covers Drizzle, Kysely, and raw SQL alike, and it sees each query finish rather than only start.

```ts
import Database from 'better-sqlite3';
import { betterSqlite3 } from '@mmdjamali/sveltelens/adapters/sqlite';

const sqlite = betterSqlite3(new Database('app.db'));
```

Every prepared statement's `run`/`get`/`all` is timed and recorded with a real `durationMs`. Pass the wrapped database wherever you'd pass the original — `drizzle(sqlite)`, and so on.

Running on Bun without the `better-sqlite3` native dependency? See [Bun SQLite](./bun-sqlite) for the built-in equivalent. On Node, see [Node SQLite](./node-sqlite) for the same idea using `node:sqlite`.

Using something else? See [Everything else](./other).
