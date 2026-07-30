<script lang="ts">
  import { formatDuration, interpolateSql, durationClass } from "../format";
  import { highlight } from "../highlight";
  import type { Entry } from "../types";
  import { Badge } from "./ui/badge/index.js";
  import DetailShell from "./DetailShell.svelte";
  import BodyView from "./BodyView.svelte";
  import RelatedList from "./RelatedList.svelte";

  let {
    entry,
    related,
  }: { entry: Extract<Entry, { type: "query" }>; related: Entry[] } =
    $props();
</script>

<DetailShell {entry}>
  {#snippet overview()}
    <div class="p-4">
      <div class="mb-4 flex items-center gap-2">
        {#if entry.payload.connection}
          <Badge variant="soft" class="bg-base-300 text-base-content/60"
            >{entry.payload.connection}</Badge
          >
        {/if}
        <Badge variant="soft" class={durationClass(entry.durationMs)}
          >{formatDuration(entry.durationMs)}</Badge
        >
      </div>

      <pre
        class="bg-base-300/40 overflow-x-auto rounded-box border border-base-300 p-3 font-mono text-xs whitespace-pre-wrap">{@html highlight(
          interpolateSql(entry.payload.sql, entry.payload.params),
          "sql",
        )}</pre>

      {#if entry.payload.params.length}
        <h3 class="text-base-content/60 mt-4 mb-1.5 text-xs font-medium">
          Bindings
        </h3>
        <BodyView text={JSON.stringify(entry.payload.params)} />
      {/if}
    </div>
  {/snippet}

  <RelatedList {entry} {related} />
</DetailShell>
