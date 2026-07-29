<script lang="ts">
  import { base } from "$app/paths";
  import { formatDuration, entryTypeClass, interpolateSql, durationClass } from "../format";
  import { highlight } from "../highlight";
  import DetailHeader from "./DetailHeader.svelte";
  import BodyView from "./BodyView.svelte";
  import { Badge } from "./ui/badge/index.js";
  import { ENTRY_TYPE_BADGE_LABELS, type Entry } from "../types";

  import ArrowLeftIcon from "@lucide/svelte/icons/arrow-left";

  let { entry }: { entry: Extract<Entry, { type: "query" }> } = $props();
</script>

<a href="{base}/queries" class="btn btn-ghost border-base-300 mb-5">
  <ArrowLeftIcon class="size-4" />
  Back
</a>

<div class="mx-auto max-w-6xl pb-6">
  <div class="card bg-base-200 rounded-field overflow-hidden">
    <DetailHeader
      badgeLabel={ENTRY_TYPE_BADGE_LABELS.query}
      badgeClass={entryTypeClass("query")}
      timestamp={entry.timestamp}
      durationMs={entry.durationMs}
    />
    <div class="p-4">
      <div class="mb-4 flex items-center gap-2">
        {#if entry.payload.connection}
          <Badge variant="soft" class="bg-base-300 text-base-content/60">{entry.payload.connection}</Badge>
        {/if}
        <Badge variant="soft" class={durationClass(entry.durationMs)}>{formatDuration(entry.durationMs)}</Badge>
      </div>

      <pre
        class="bg-base-300/40 overflow-x-auto rounded-box border border-base-300 p-3 font-mono text-xs whitespace-pre-wrap">{@html highlight(
          interpolateSql(entry.payload.sql, entry.payload.params),
          "sql",
        )}</pre>

      {#if entry.payload.params.length}
        <h3 class="text-base-content/60 mt-4 mb-1.5 text-xs font-medium">Bindings</h3>
        <BodyView text={JSON.stringify(entry.payload.params)} />
      {/if}
    </div>
  </div>
</div>
