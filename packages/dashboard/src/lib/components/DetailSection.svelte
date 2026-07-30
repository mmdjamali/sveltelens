<script lang="ts">
  import type { Snippet } from "svelte";

  let { title, children }: { title: string; children: Snippet } = $props();
</script>

<div class="card mt-5 bg-base-200 rounded-field overflow-hidden">
  <div
    class="flex items-center justify-between border-b border-base-300 bg-base-300 px-4 py-3"
  >
    <h2 class="m-0 text-sm font-semibold">{title}</h2>
  </div>
  {@render children()}
</div>
