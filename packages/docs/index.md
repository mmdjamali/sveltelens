---
layout: home

hero:
  name: Svelte<span class="accent">Lens</span>
  text: Observability for SvelteKit, dev-only.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: What is Sveltelens?
      link: /guide/what-is-sveltelens

features:
  - title: Zero-config
    details: Add the plugin and the hook. There's nothing else to wire up for the common case.
  - title: Package-agnostic
    details: Captures plain fetch, axios, got, and SDKs like the PocketBase client without any adapter.
  - title: Dev-only, by design
    details: The plugin only runs during `vite dev`. Nothing ships in production builds.
  - title: Everything related
    details: Every query, outgoing call, and log line during a request is linked back to it, even across libraries that don't know Sveltelens exists.
  - title: Agent-ready
    details: A built-in MCP endpoint lets coding agents list failing requests, read request timelines, and inspect bodies and stack traces on their own.
---
