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
      // Only `/` is prerendered; sirv (single: true) serves that index.html for the
      // dynamic routes. A real `fallback` page would emit absolute /_app/ URLs, which
      // break under the configurable mount path — the prerendered page uses relative ones.
      strict: false,
    }),
  },
};

export default config;
