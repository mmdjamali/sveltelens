<script lang="ts">
  import { base } from "$app/paths";
  import { goto } from "$app/navigation";
  import {
    timeAgo,
    statusClass,
    entryTypeClass,
    entryVerb,
    entryVerbClass,
    entryStatus,
    entrySummary,
    formatDuration,
  } from "../format";
  import {
    ENTRY_TYPE_BADGE_LABELS,
    ENTRY_TYPE_ICONS,
    type Entry,
  } from "../types";
  import * as Table from "./ui/table/index.js";
  import { Badge } from "./ui/badge/index.js";
  import IconInbox from "@tabler/icons-svelte/icons/inbox";

  let { entries }: { entries: Entry[] } = $props();
</script>

<Table.Root>
  <Table.Header class="bg-background sticky top-0 z-10">
    <Table.Row class="hover:bg-transparent">
      <Table.Head class="text-muted-foreground pl-4 text-xs">Type</Table.Head>
      <Table.Head class="text-muted-foreground w-20 text-xs"></Table.Head>
      <Table.Head class="text-muted-foreground text-xs">Detail</Table.Head>
      <Table.Head class="text-muted-foreground w-20 text-xs">Status</Table.Head>
      <Table.Head class="text-muted-foreground w-24 text-xs"
        >Duration</Table.Head
      >
      <Table.Head class="text-muted-foreground w-28 pr-4 text-right text-xs"
        >Time</Table.Head
      >
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {#each entries as entry, i (entry.id)}
      {@const Icon = ENTRY_TYPE_ICONS[entry.type]}
      <Table.Row
        class="h-11 cursor-pointer {i % 2 === 1 ? 'bg-muted/20' : ''}"
        onclick={() => goto(`${base}/${entry.id}`)}
      >
        <Table.Cell class="py-0 max-w-fit w-0 min-w-44 pl-4">
          <Badge
            variant="soft"
            class="tracking-wide uppercase gap-1.5 {entryTypeClass(entry.type)}"
          >
            <Icon class="size-3.5" />
            {ENTRY_TYPE_BADGE_LABELS[entry.type]}
          </Badge>
        </Table.Cell>
        <Table.Cell class="py-0">
          {#if entryVerb(entry)}
            <Badge variant="soft" class={entryVerbClass(entry)}>
              {entryVerb(entry)}
            </Badge>
          {/if}
        </Table.Cell>
        <Table.Cell
          class="text-foreground max-w-0 truncate py-0 text-xs"
          title={entrySummary(entry)}
        >
          {entrySummary(entry)}
        </Table.Cell>
        <Table.Cell class="py-0">
          {#if entryStatus(entry) !== null}
            <Badge variant="soft" class={statusClass(entryStatus(entry))}>
              {entryStatus(entry)}
            </Badge>
          {/if}
        </Table.Cell>
        <Table.Cell class="text-muted-foreground py-0 text-xs"
          >{formatDuration(entry.durationMs)}</Table.Cell
        >
        <Table.Cell class="text-muted-foreground py-0 pr-4 text-right text-xs"
          >{timeAgo(entry.timestamp)}</Table.Cell
        >
      </Table.Row>
    {:else}
      <Table.Row class="hover:bg-transparent">
        <Table.Cell colspan={6} class="h-64 text-center">
          <div class="flex flex-col items-center justify-center gap-2">
            <IconInbox class="text-muted-foreground/40 size-10" />
            <p class="text-foreground text-sm font-medium">No entries yet</p>
            <p class="text-muted-foreground text-xs">
              Trigger a request in your app and it'll show up here.
            </p>
          </div>
        </Table.Cell>
      </Table.Row>
    {/each}
  </Table.Body>
</Table.Root>
