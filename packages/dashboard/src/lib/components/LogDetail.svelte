<script lang="ts">
  import { base } from "$app/paths";
  import { levelClass, stripAnsi } from "../format";
  import DetailHeader from "./DetailHeader.svelte";
  import type { Entry } from "../types";

  import ArrowLeftIcon from "@lucide/svelte/icons/arrow-left";

  let { entry }: { entry: Extract<Entry, { type: "log" }> } = $props();
</script>

<a href="{base}/logs" class="btn btn-ghost border-base-300 mb-5">
  <ArrowLeftIcon class="size-4" />
  Back
</a>

<div class="mx-auto max-w-6xl px-4 pb-6">
  <div class="card bg-base-200 rounded-field overflow-hidden">
    <DetailHeader
      badgeLabel={entry.payload.level.toUpperCase()}
      badgeClass={levelClass(entry.payload.level)}
      timestamp={entry.timestamp}
    />
    <div class="p-4">
      <h3 class="text-base-content/60 mb-1.5 text-xs font-medium">Message</h3>
      <div class="bg-base-300/40 overflow-x-auto rounded-box border border-base-300 p-3 font-mono text-xs whitespace-pre-wrap">
        {stripAnsi(entry.payload.message)}
      </div>

      <h3 class="text-base-content/60 mt-4 mb-1.5 text-xs font-medium">Context</h3>
      <p class="text-base-content/60 text-xs italic">no context captured</p>
    </div>
  </div>
</div>
