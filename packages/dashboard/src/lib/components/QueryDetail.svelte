<script lang="ts">
  import { base } from "$app/paths";
  import { formatDuration, entryTypeClass, interpolateSql, durationClass } from "../format";
  import { highlight } from "../highlight";
  import DetailHeader from "./DetailHeader.svelte";
  import BodyView from "./BodyView.svelte";
  import { Badge } from "./ui/badge/index.js";
  import { ENTRY_TYPE_BADGE_LABELS, type Entry } from "../types";

  let { entry }: { entry: Extract<Entry, { type: "query" }> } = $props();
</script>

<div class="mx-auto max-w-[1140px] px-4 pt-6">
  <div class="card overflow-hidden rounded-lg border border-border bg-card">
    <DetailHeader
      backHref="{base}/queries"
      backLabel="Queries"
      badgeLabel={ENTRY_TYPE_BADGE_LABELS.query}
      badgeClass={entryTypeClass("query")}
      timestamp={entry.timestamp}
      durationMs={entry.durationMs}
    />
    <div class="p-4">
      <div class="mb-4 flex items-center gap-2">
        {#if entry.payload.connection}
          <Badge variant="soft" class="bg-muted text-muted-foreground">{entry.payload.connection}</Badge>
        {/if}
        <Badge variant="soft" class={durationClass(entry.durationMs)}>{formatDuration(entry.durationMs)}</Badge>
      </div>

      <pre
        class="bg-muted/40 overflow-x-auto rounded-md border border-border p-3 font-mono text-xs whitespace-pre-wrap">{@html highlight(
          interpolateSql(entry.payload.sql, entry.payload.params),
          "sql",
        )}</pre>

      {#if entry.payload.params.length}
        <h3 class="text-muted-foreground mt-4 mb-1.5 text-xs font-medium">Bindings</h3>
        <BodyView text={JSON.stringify(entry.payload.params)} />
      {/if}
    </div>
  </div>
</div>
