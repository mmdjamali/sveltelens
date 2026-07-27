<script lang="ts">
  import ArrowLeftIcon from "@lucide/svelte/icons/arrow-left";
  import { Badge } from "./ui/badge/index.js";

  let {
    badgeLabel,
    badgeClass,
    title,
    timestamp,
    durationMs,
  }: {
    badgeLabel: string;
    badgeClass: string;
    title?: string;
    timestamp: number;
    durationMs?: number | null;
  } = $props();
</script>

<div
  class="flex items-center justify-between border-b border-base-300 bg-base-300 px-4 py-3"
>
  <h2 class="m-0 text-sm font-semibold">Details</h2>
</div>
<table class="w-full border-collapse text-sm">
  <tbody>
    <tr class="border-b border-base-300">
      <td class="text-base-content/60 w-44 px-4 py-2.5 align-top">Happened</td>
      <td class="px-4 py-2.5">
        {new Date(timestamp).toLocaleString()}
        <span class="text-base-content/60"
          >({new Date(timestamp).toLocaleTimeString()})</span
        >
      </td>
    </tr>
    <tr class="border-b border-base-300">
      <td class="text-base-content/60 w-44 px-4 py-2.5 align-top">Type</td>
      <td class="px-4 py-2.5">
        <Badge variant="soft" class={badgeClass}>{badgeLabel}</Badge>
      </td>
    </tr>
    {#if title}
      <tr class="border-b border-base-300">
        <td class="text-base-content/60 w-44 px-4 py-2.5 align-top">Title</td>
        <td class="px-4 py-2.5 break-all font-mono text-xs">{title}</td>
      </tr>
    {/if}
    {#if durationMs !== undefined && durationMs !== null}
      <tr class="border-b border-base-300">
        <td class="text-base-content/60 w-44 px-4 py-2.5 align-top">Duration</td
        >
        <td class="px-4 py-2.5">
          {durationMs}ms
        </td>
      </tr>
    {/if}
  </tbody>
</table>
