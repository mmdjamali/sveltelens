# SvelteLens

A local developer observability dashboard for SvelteKit, inspired by
Laravel Telescope. See [packages/docs](./packages/docs) for the full guide,
or [packages/sveltelens](./packages/sveltelens) for the published package.

## Workspace layout

| Path | What it is |
|---|---|
| `packages/sveltelens` | The published npm package — the Vite plugin, adapters, and interceptors |
| `packages/dashboard` | The SvelteKit UI that renders captured data |
| `packages/docs` | The VitePress documentation site |
| `examples/demo-app` | A SvelteKit app demonstrating the package end-to-end |

## Getting started

Requires [Bun](https://bun.sh) (`bun@1.3.14`, per `packageManager`).

```sh
bun install
bun run build:dashboard # builds the dashboard UI and copies it into
                         # packages/sveltelens/dashboard-dist
bun run build:package   # packages/sveltelens must be built before the
                         # demo app can resolve it
bun run dev:demo        # starts the demo app with sveltelens attached
```

Other useful scripts (see root `package.json`):

- `bun run test` — runs the sveltelens and dashboard test suites
- `bun run dev:docs` — runs the docs site locally
- `bun run build` — builds all publishable packages

## License

MIT — see [LICENSE](./LICENSE).
