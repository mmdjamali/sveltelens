import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

// Separate from vite.config.ts so tests skip Tailwind. The SvelteKit plugin stays:
// the registry imports .svelte components and the store is a .svelte.ts rune module.
export default defineConfig({
  plugins: [sveltekit()],
  // Svelte packages ship their source under the "svelte" condition, which node
  // resolution alone doesn't pick up.
  resolve: { conditions: ['svelte'] },
  ssr: { resolve: { conditions: ['svelte'] } },
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
  },
});
