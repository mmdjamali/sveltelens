# What is Sveltelens?

Sveltelens is a local developer observability dashboard for SvelteKit, inspired by [Laravel Telescope](https://laravel.com/docs/telescope). It's dev-only, zero-config, and package-agnostic: it captures requests, outgoing HTTP calls, DB queries, logs, and exceptions no matter which HTTP client, SDK, or ORM your app uses.

## Why

SvelteKit apps talk to a lot of things during development — outgoing APIs, databases, third-party SDKs — and most of that is invisible unless you reach for `console.log` or a debugger. Sveltelens patches Node's platform primitives inside the Vite dev server process, so it sees everything happening during a request without requiring you to instrument your own code.

## Design goals

- **Zero-config** — install the plugin and the hook, and requests, outgoing HTTP, and exceptions are already captured.
- **Package-agnostic** — works whether you're using `fetch`, `axios`, `got`, an ORM, or a third-party SDK, because it intercepts at the platform level rather than wrapping specific libraries.
- **Agent-ready** — the same data is served over [MCP](./mcp), so a coding agent can look up failing requests, queries, and stack traces itself instead of you pasting them in.
- **Dev-only** — the plugin only runs during `vite dev` ([`apply: 'serve'`](https://vite.dev/guide/api-plugin.html#conditional-application)). Nothing runs in production builds, so it's safe to leave installed.

Continue to [Getting Started](./getting-started) to install it.
