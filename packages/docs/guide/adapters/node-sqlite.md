# Node SQLite

Adapters wrap the _database driver_, not the ORM on top of it — so one adapter covers Drizzle, Kysely, and raw SQL alike. This wraps Node's built-in `node:sqlite`, for apps that don't want the `better-sqlite3` native dependency — see [SQLite](./sqlite) for that one.

```ts
import { DatabaseSync } from 'node:sqlite';
import { nodeSqlite } from '@mmdjamali/sveltelens/adapters/node-sqlite';

const db = nodeSqlite(new DatabaseSync('app.db'));
```

Every prepared statement's `run`/`get`/`all` is timed and recorded with a real `durationMs`. Pass the wrapped database wherever you'd pass the original — `drizzle(db)`, and so on. Requires Node 22.5+; `node:sqlite` is still experimental on some Node versions and may need `--experimental-sqlite`.

Using something else? See [Everything else](./other).
