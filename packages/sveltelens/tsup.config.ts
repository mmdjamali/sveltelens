import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    hook: 'src/hook.ts',
    'adapters/drizzle': 'src/adapters/drizzle.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  shims: true,
  target: 'node18',
  external: ['vite', '@sveltejs/kit', 'better-sqlite3'],
});
