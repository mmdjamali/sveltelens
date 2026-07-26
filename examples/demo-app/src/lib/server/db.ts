import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { telescopeDrizzleLogger } from 'sveltecope/adapters/drizzle';

export const todos = sqliteTable('todos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  done: integer('done', { mode: 'boolean' }).notNull().default(false),
});

const sqlite = new Database(':memory:');
sqlite.exec(
  `CREATE TABLE todos (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, done INTEGER NOT NULL DEFAULT 0)`
);
sqlite.exec(`INSERT INTO todos (title, done) VALUES ('Write docs', 0), ('Ship telescope', 1)`);

export const db = drizzle(sqlite, { logger: telescopeDrizzleLogger() });
