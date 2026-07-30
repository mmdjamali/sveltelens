<script lang="ts">
  import { formatBytes } from "../format";
  import type { BodyCapture } from "../types";
  import DetailSection from "./DetailSection.svelte";
  import BodyView from "./BodyView.svelte";

  let {
    title,
    body,
    emptyMessage,
  }: { title: string; body: BodyCapture | null; emptyMessage: string } =
    $props();
</script>

<DetailSection {title}>
  <div class="p-4">
    {#if body}
      {#if body.truncated}
        <p class="mb-2 text-xs text-warning">
          truncated ({formatBytes(body.size)})
        </p>
      {/if}
      <BodyView text={body.text} contentType={body.contentType} />
    {:else}
      <p class="text-base-content/60 text-xs italic">{emptyMessage}</p>
    {/if}
  </div>
</DetailSection>
