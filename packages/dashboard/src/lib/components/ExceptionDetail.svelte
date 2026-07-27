<script lang="ts">
  import { base } from "$app/paths";
  import { entryTypeClass, exceptionLocation, statusClass, methodClass, formatDuration } from "../format";
  import DetailHeader from "./DetailHeader.svelte";
  import { Badge } from "./ui/badge/index.js";
  import type { Entry } from "../types";

  let {
    entry,
    requestEntry,
  }: { entry: Extract<Entry, { type: "exception" }>; requestEntry: Extract<Entry, { type: "request" }> | null } = $props();

  const location = $derived(exceptionLocation(entry.payload.stack));
</script>

<div class="bg-background flex h-full flex-col">
  <DetailHeader
    backHref="{base}/exceptions"
    badgeLabel={entry.payload.name}
    badgeClass={entryTypeClass("exception")}
    timestamp={entry.timestamp}
  />

  <div class="min-h-0 flex-1 overflow-auto p-4">
    {#if location}
      <p class="text-muted-foreground mb-3 font-mono text-xs">{location}</p>
    {/if}

    <h3 class="text-muted-foreground mb-1.5 text-xs font-medium">Message</h3>
    <p class="text-destructive mb-4 text-xs break-all">{entry.payload.message}</p>

    <h3 class="text-muted-foreground mb-1.5 text-xs font-medium">Stack trace</h3>
    <pre
      class="text-destructive bg-destructive/5 border-destructive/20 max-h-96 overflow-auto rounded-md border p-3 font-mono text-xs whitespace-pre-wrap">{entry.payload.stack ??
        entry.payload.message}</pre>

    <h3 class="text-muted-foreground mt-4 mb-1.5 text-xs font-medium">Request context</h3>
    {#if requestEntry}
      <a
        href="{base}/requests/{requestEntry.id}"
        class="hover:bg-accent hover:text-accent-foreground flex items-center gap-2 rounded-md border p-2.5 text-xs transition-colors"
      >
        <Badge variant="soft" class={methodClass(requestEntry.payload.method)}>{requestEntry.payload.method}</Badge>
        <span class="min-w-0 flex-1 truncate font-mono">{requestEntry.payload.path}</span>
        <Badge variant="soft" class={statusClass(requestEntry.payload.status)}>{requestEntry.payload.status}</Badge>
        <span class="text-muted-foreground shrink-0">{formatDuration(requestEntry.durationMs)}</span>
      </a>
    {:else}
      <p class="text-muted-foreground text-xs italic">not triggered during a request</p>
    {/if}
  </div>
</div>
