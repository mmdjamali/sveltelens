import { sveltekit } from '@sveltejs/kit/vite';
import { telescope } from 'sveltecope';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit(), telescope()],
});
