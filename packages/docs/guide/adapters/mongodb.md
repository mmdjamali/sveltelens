# MongoDB

Adapters wrap the _database driver_ — for MongoDB that means the official `mongodb` driver's own command-monitoring events, since there's no SQL text to intercept.

```ts
import { MongoClient } from 'mongodb';
import { mongodb } from 'sveltelens/adapters/mongodb';

const client = mongodb(new MongoClient(process.env.DATABASE_URL!, { monitorCommands: true }));
```

`monitorCommands: true` is required — without it the driver never emits the events this adapter listens for. Every command (`find`, `insertOne`, `updateMany`, `aggregate`, ...) is recorded with the real server-reported `durationMs`, including failed commands. Since there's no SQL string, the dashboard shows a rendered `commandName({...})` call built from the command document, with noisy session/transaction fields (`lsid`, `$db`, `txnNumber`, ...) stripped out.

## Everything else

Anything that talks HTTP (PocketBase, Supabase, a REST API client, `fetch`) is already captured by the outgoing-HTTP interceptor with no adapter needed. For a non-HTTP data source without a shipped adapter, call `recordQuery` from wherever your library exposes the SQL:

```ts
import { recordQuery } from 'sveltelens';

recordQuery({ sql, params, durationMs, connection: 'primary' });
```

It's a no-op when the plugin isn't running, so it's safe to leave in place.
