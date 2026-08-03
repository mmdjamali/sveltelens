import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    hook: 'src/hook.ts',
    'adapters/sqlite': 'src/adapters/sqlite.ts',
    'adapters/pg': 'src/adapters/pg.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  shims: true,
  target: 'node18',
  external: ['vite', '@sveltejs/kit', 'better-sqlite3', 'pg'],
});
