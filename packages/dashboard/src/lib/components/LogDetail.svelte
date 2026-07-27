<script lang="ts">
  import { base } from "$app/paths";
  import { levelClass, stripAnsi } from "../format";
  import DetailHeader from "./DetailHeader.svelte";
  import type { Entry } from "../types";

  let { entry }: { entry: Extract<Entry, { type: "log" }> } = $props();
</script>

<div class="bg-background flex h-full flex-col">
  <DetailHeader
    backHref="{base}/logs"
    badgeLabel={entry.payload.level.toUpperCase()}
    badgeClass={levelClass(entry.payload.level)}
    timestamp={entry.timestamp}
  />

  <div class="min-h-0 flex-1 overflow-auto p-4">
    <h3 class="text-muted-foreground mb-1.5 text-xs font-medium">Message</h3>
    <div class="bg-muted/40 overflow-x-auto rounded-md border p-3 font-mono text-xs whitespace-pre-wrap">
      {stripAnsi(entry.payload.message)}
    </div>

    <h3 class="text-muted-foreground mt-4 mb-1.5 text-xs font-medium">Context</h3>
    <p class="text-muted-foreground text-xs italic">no context captured</p>
  </div>
</div>
