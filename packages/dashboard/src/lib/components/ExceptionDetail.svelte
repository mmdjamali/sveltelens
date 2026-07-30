<script lang="ts">
  import { base } from "$app/paths";
  import {
    exceptionLocation,
    statusClass,
    methodClass,
    formatDuration,
  } from "../format";
  import type { Entry } from "../types";
  import { Badge } from "./ui/badge/index.js";
  import DetailShell from "./DetailShell.svelte";

  let {
    entry,
    related,
  }: { entry: Extract<Entry, { type: "exception" }>; related: Entry[] } =
    $props();

  // The request this was thrown during, picked out of everything captured alongside it.
  const requestEntry = $derived(
    related.find((e) => e.type === "request") as
      | Extract<Entry, { type: "request" }>
      | undefined,
  );

  const location = $derived(exceptionLocation(entry.payload.stack));
</script>

<DetailShell {entry} badgeLabel={entry.payload.name}>
  {#snippet overview()}
    <div class="p-4">
      {#if location}
        <p class="text-base-content/60 mb-3 font-mono text-xs">{location}</p>
      {/if}

      <h3 class="text-base-content/60 mb-1.5 text-xs font-medium">Message</h3>
      <p class="text-error mb-4 text-xs break-all">{entry.payload.message}</p>

      <h3 class="text-base-content/60 mb-1.5 text-xs font-medium">
        Stack trace
      </h3>
      <pre
        class="text-error bg-error/5 border-error/20 max-h-96 overflow-auto rounded-box border border-base-300 p-3 font-mono text-xs whitespace-pre-wrap">{entry
          .payload.stack ?? entry.payload.message}</pre>

      <h3 class="text-base-content/60 mt-4 mb-1.5 text-xs font-medium">
        Request context
      </h3>
      {#if requestEntry}
        <a
          href="{base}/requests/{requestEntry.id}"
          class="hover:bg-base-300 flex items-center gap-2 rounded-box border border-base-300 p-2.5 text-xs transition-colors"
        >
          <Badge variant="soft" class={methodClass(requestEntry.payload.method)}
            >{requestEntry.payload.method}</Badge
          >
          <span class="min-w-0 flex-1 truncate font-mono"
            >{requestEntry.payload.path}</span
          >
          <Badge variant="soft" class={statusClass(requestEntry.payload.status)}
            >{requestEntry.payload.status}</Badge
          >
          <span class="text-base-content/60 shrink-0"
            >{formatDuration(requestEntry.durationMs)}</span
          >
        </a>
      {:else}
        <p class="text-base-content/60 text-xs italic">
          not triggered during a request
        </p>
      {/if}
    </div>
  {/snippet}
</DetailShell>
