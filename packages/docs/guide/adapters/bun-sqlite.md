# Bun SQLite

Adapters wrap the _database driver_, not the ORM on top of it — so one adapter covers Drizzle, Kysely, and raw SQL alike. This wraps Bun's built-in `bun:sqlite`, for apps that don't want the `better-sqlite3` native dependency and already run on Bun — see [SQLite](./sqlite) for that one.

```ts
import { Database } from 'bun:sqlite';
import { bunSqlite } from 'sveltelens/adapters/bun-sqlite';

const db = bunSqlite(new Database('app.db'));
```

Every prepared statement's `run`/`get`/`all` is timed and recorded with a real `durationMs`. Pass the wrapped database wherever you'd pass the original — `drizzle(db)`, and so on. Only runs under Bun; `bun:sqlite` doesn't exist under Node.

Using something else? See [Everything else](./other).
