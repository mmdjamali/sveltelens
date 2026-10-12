# sveltelens

A local developer observability dashboard for SvelteKit, inspired by [Laravel Telescope](https://laravel.com/docs/telescope). Dev-only, zero-config, and package-agnostic: it captures requests, outgoing HTTP calls, DB queries, logs, and exceptions no matter which HTTP client, SDK, or ORM your app uses.

## Install

```sh
npm i -D sveltelens
```

## Setup

**1. Add the plugin** to `vite.config.ts`:

```ts
import { sveltekit } from '@sveltejs/kit/vite';
import { sveltelens } from 'sveltelens';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit(), sveltelens()],
});
```

**2. Add the hook** to `src/hooks.server.ts`:

```ts
import { sveltelensHandle, sveltelensHandleError } from 'sveltelens/hook';
import { sequence } from '@sveltejs/kit/hooks';

export const handle = sequence(sveltelensHandle /*, ...your other hooks */);
export const handleError = sveltelensHandleError;
```

Run `npm run dev` and open `http://localhost:5173/__sveltelens`.

## Docs

Full guide — configuration, how it works, adapters — lives in [`packages/docs`](https://github.com/mmdjamali/sveltelens/tree/main/packages/docs) in this repo. Run `bun run dev:docs` from the repo root to browse it locally.

## License

MIT
