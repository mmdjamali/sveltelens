<script lang="ts">
  import { levelClass, stripAnsi } from "../format";
  import type { Entry } from "../types";
  import DetailShell from "./DetailShell.svelte";

  let { entry }: { entry: Extract<Entry, { type: "log" }> } = $props();
</script>

<DetailShell
  {entry}
  badgeLabel={entry.payload.level.toUpperCase()}
  badgeClass={levelClass(entry.payload.level)}
>
  {#snippet overview()}
    <div class="p-4">
      <h3 class="text-base-content/60 mb-1.5 text-xs font-medium">Message</h3>
      <div
        class="bg-base-300/40 overflow-x-auto rounded-box border border-base-300 p-3 font-mono text-xs whitespace-pre-wrap"
      >
        {stripAnsi(entry.payload.message)}
      </div>

      <h3 class="text-base-content/60 mt-4 mb-1.5 text-xs font-medium">
        Context
      </h3>
      <p class="text-base-content/60 text-xs italic">no context captured</p>
    </div>
  {/snippet}
</DetailShell>
