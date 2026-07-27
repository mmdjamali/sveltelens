<script lang="ts">
  import { Badge } from "./ui/badge/index.js";

  let {
    backHref,
    backLabel,
    badgeLabel,
    badgeClass,
    title,
    timestamp,
    durationMs,
  }: {
    backHref: string;
    backLabel: string;
    badgeLabel: string;
    badgeClass: string;
    title?: string;
    timestamp: number;
    durationMs?: number | null;
  } = $props();
</script>

<div class="card-header flex items-center justify-between border-b border-border bg-muted px-4 py-3">
  <h2 class="m-0 text-sm font-semibold">
    <a href={backHref} class="text-indigo-400 hover:text-indigo-300">← {backLabel}</a>
    <span class="ml-2 font-normal text-muted-foreground">/</span>
  </h2>
</div>
<table class="w-full border-collapse text-sm">
  <tbody>
    <tr class="border-b border-border">
      <td class="text-muted-foreground w-44 px-4 py-2.5 align-top">Happened</td>
      <td class="px-4 py-2.5">
        {new Date(timestamp).toLocaleString()}
        <span class="text-muted-foreground">({new Date(timestamp).toLocaleTimeString()})</span>
      </td>
    </tr>
    <tr class="border-b border-border">
      <td class="text-muted-foreground w-44 px-4 py-2.5 align-top">Type</td>
      <td class="px-4 py-2.5">
        <Badge variant="soft" class={badgeClass}>{badgeLabel}</Badge>
      </td>
    </tr>
    {#if title}
      <tr class="border-b border-border">
        <td class="text-muted-foreground w-44 px-4 py-2.5 align-top">Title</td>
        <td class="px-4 py-2.5 break-all font-mono text-xs">{title}</td>
      </tr>
    {/if}
    {#if durationMs !== undefined && durationMs !== null}
      <tr class="border-b border-border">
        <td class="text-muted-foreground w-44 px-4 py-2.5 align-top">Duration</td>
        <td class="px-4 py-2.5">
          {durationMs}ms
        </td>
      </tr>
    {/if}
  </tbody>
</table>
