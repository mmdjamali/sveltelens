import type { CommandFailedEvent, CommandStartedEvent, CommandSucceededEvent, MongoClient } from 'mongodb';
import { recordQuery } from '../record.js';

const NOISE_KEYS = new Set(['lsid', '$db', '$clusterTime', '$readPreference', 'txnNumber', 'autocommit']);

/**
 * Wraps a `MongoClient` so every command (find, insert, update, aggregate, ...)
 * is timed and recorded: `mongodb(new MongoClient(uri, { monitorCommands: true }))`.
 *
 * MongoDB has no SQL text — the driver's command monitoring events are the
 * closest equivalent, so the "sql" shown is a rendered `commandName({...})` call
 * rather than a query string. Requires `monitorCommands: true` in the client's
 * constructor options; the events this adapter listens for are silent without it.
 */
export function mongodb<T extends MongoClient>(client: T): T {
  const pending = new Map<number, { sql: string; connection: string }>();

  client.on('commandStarted', (event: CommandStartedEvent) => {
    pending.set(event.requestId, {
      sql: formatCommand(event.commandName, event.command),
      connection: event.databaseName,
    });
  });

  client.on('commandSucceeded', (event: CommandSucceededEvent) => {
    const started = pending.get(event.requestId);
    pending.delete(event.requestId);
    recordQuery({
      sql: started?.sql ?? `${event.commandName}(...)`,
      durationMs: Math.round(event.duration),
      connection: started?.connection ?? event.databaseName,
    });
  });

  client.on('commandFailed', (event: CommandFailedEvent) => {
    const started = pending.get(event.requestId);
    pending.delete(event.requestId);
    recordQuery({
      sql: started?.sql ?? `${event.commandName}(...)`,
      durationMs: Math.round(event.duration),
      connection: started?.connection ?? event.databaseName,
    });
  });

  return client;
}

function formatCommand(name: string, command: Record<string, unknown>): string {
  const filtered: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(command)) {
    if (!NOISE_KEYS.has(key)) filtered[key] = value;
  }
  return `${name}(${JSON.stringify(filtered)})`;
}
