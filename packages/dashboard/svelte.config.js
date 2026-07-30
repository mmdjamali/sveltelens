import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: undefined,
      precompress: false,
      // Only `/` is prerendered. The plugin serves that index.html for every dynamic
      // route, rewriting it to pin both the asset base and SvelteKit's router base to
      // the configured mount path — see pinShellToMountPath. A real `fallback` page
      // would emit absolute /_app/ URLs, which break under a configurable mount path.
      strict: false,
    }),
    // The wire format is owned by the package that produces it. Type-only, so this
    // never resolves at runtime — but Vite needs the alias to agree with TypeScript.
    alias: {
      sveltelens: '../sveltelens/src/index.ts',
    },
  },
};

export default config;
