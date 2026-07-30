<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    label,
    class: className = "",
    children,
  }: { label: string; class?: string; children: Snippet } = $props();
</script>

<tr class="border-b border-base-300">
  <td class="text-base-content/60 w-44 px-4 py-2.5 align-top">{label}</td>
  <td class="px-4 py-2.5 {className}">{@render children()}</td>
</tr>
