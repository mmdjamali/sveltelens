<script lang="ts">
  import { base } from "$app/paths";
  import { levelClass, stripAnsi } from "../format";
  import DetailHeader from "./DetailHeader.svelte";
  import type { Entry } from "../types";

  let { entry }: { entry: Extract<Entry, { type: "log" }> } = $props();
</script>

<div class="mx-auto max-w-[1140px] px-4 pt-6">
  <div class="card overflow-hidden rounded-lg border border-border bg-card">
    <DetailHeader
      backHref="{base}/logs"
      backLabel="Logs"
      badgeLabel={entry.payload.level.toUpperCase()}
      badgeClass={levelClass(entry.payload.level)}
      timestamp={entry.timestamp}
    />
    <div class="p-4">
      <h3 class="text-muted-foreground mb-1.5 text-xs font-medium">Message</h3>
      <div class="bg-muted/40 overflow-x-auto rounded-md border border-border p-3 font-mono text-xs whitespace-pre-wrap">
        {stripAnsi(entry.payload.message)}
      </div>

      <h3 class="text-muted-foreground mt-4 mb-1.5 text-xs font-medium">Context</h3>
      <p class="text-muted-foreground text-xs italic">no context captured</p>
    </div>
  </div>
</div>
