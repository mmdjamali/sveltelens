<script lang="ts">
  import type { Snippet } from "svelte";

  let { class: className = "", children }: { class?: string; children: Snippet } =
    $props();
</script>

<div class="table-responsive {className}">
  <table class="w-full border-collapse text-sm">
    <tbody>
      {@render children()}
    </tbody>
  </table>
</div>
