import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    hook: 'src/hook.ts',
    'adapters/sqlite': 'src/adapters/sqlite.ts',
    'adapters/pg': 'src/adapters/pg.ts',
    'adapters/mysql2': 'src/adapters/mysql2.ts',
    'adapters/libsql': 'src/adapters/libsql.ts',
    'adapters/postgres-js': 'src/adapters/postgres-js.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  shims: true,
  target: 'node18',
  external: ['vite', '@sveltejs/kit', 'better-sqlite3', 'pg', 'mysql2', '@libsql/client', 'postgres'],
});
