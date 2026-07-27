<script lang="ts">
  import { timeAgo, formatDuration } from "../format";
  import { Badge } from "./ui/badge/index.js";
  import { Button } from "./ui/button/index.js";
  import IconArrowLeft from "@tabler/icons-svelte/icons/arrow-left";

  let {
    backHref,
    badgeLabel,
    badgeClass,
    title,
    timestamp,
    durationMs,
  }: {
    backHref: string;
    badgeLabel: string;
    badgeClass: string;
    title?: string;
    timestamp: number;
    durationMs?: number | null;
  } = $props();
</script>

<div class="grid grid-cols-[auto_1fr] items-center gap-x-3 border-b px-4 py-2.5">
  <Button variant="ghost" size="icon-lg" class="row-span-2 shrink-0" href={backHref}>
    <IconArrowLeft class="size-5" />
    <span class="sr-only">Back to list</span>
  </Button>
  <div class="flex min-w-0 items-center gap-2">
    <Badge variant="soft" class="tracking-wide uppercase {badgeClass}">{badgeLabel}</Badge>
    {#if title}
      <h2 class="text-foreground min-w-0 truncate text-sm font-medium" {title}>{title}</h2>
    {/if}
  </div>
  <p class="text-muted-foreground col-start-2 mt-0.5 text-xs">
    {timeAgo(timestamp)}{durationMs !== undefined ? ` · ${formatDuration(durationMs)}` : ""}
  </p>
</div>
