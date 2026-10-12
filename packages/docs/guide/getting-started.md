# Getting Started

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

`sveltelensHandleError` is optional but recommended: SvelteKit resolves `load` errors into an error page internally, so they never reach `sveltelensHandle`'s catch — `handleError` is the only hook SvelteKit calls for them. If you already have a `handleError`, call `sveltelensHandleError(input)` from it instead of assigning it directly.

**3. (Optional) Capture browser requests** in `src/hooks.client.ts` (or a plain Vite app's entry file):

```ts
import { installClient } from 'sveltelens/client';

if (import.meta.env.DEV) installClient();
```

This patches `fetch` in the page and reports each call to the dev server. They appear on their own **Browser Requests** page, separate from server-side **HTTP Client** calls. They aren't tied to a server request, so this works for frontend-only apps too (SPA mode, `adapter-static`). If you set a custom `path`, pass it: `installClient('/my-path')`. XHR-based clients aren't captured.

Run `npm run dev` and open `http://localhost:5173/__sveltelens`.

**4. (Optional) Connect a coding agent** over MCP:

```sh
claude mcp add --transport http sveltelens http://localhost:5173/__sveltelens/mcp
```

See [MCP Server](./mcp) for the tools and other clients.

Nothing runs in production builds — the plugin is dev-only (`apply: 'serve'`), and `sveltelensHandle` becomes a no-op passthrough when the plugin isn't active, so it's safe to leave the import in place.

## Next steps

- [Configuration](./configuration) — every option `sveltelens()` accepts.
- [How It Works](./how-it-works) — what gets captured and how.
- [Adapters](./adapters/sqlite) — wiring up a database driver directly.
- [MCP Server](./mcp) — letting coding agents query captured data.
