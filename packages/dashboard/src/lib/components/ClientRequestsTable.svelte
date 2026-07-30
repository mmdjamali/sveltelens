<script lang="ts">
  import {
    timeAgo,
    formatAbsoluteTime,
    statusClass,
    methodClass,
    formatDuration,
  } from "../format";
  import type { Entry } from "../types";
  import * as Table from "./ui/table/index.js";
  import { Badge } from "./ui/badge/index.js";
  import EntryTable from "./EntryTable.svelte";

  let { entries }: { entries: Extract<Entry, { type: "client-request" }>[] } =
    $props();

  const columns = [
    { label: "Method", class: "w-24 pl-4" },
    { label: "URI" },
    { label: "Status", class: "w-20 text-center" },
    { label: "Duration", class: "w-24 text-right" },
    { label: "Happened", class: "w-28 pr-4 text-right" },
  ];
</script>

<EntryTable type="client-request" rows={entries} id={(e) => e.id} {columns}>
  {#snippet cells(entry)}
    <Table.Cell class="py-0 pl-4">
      <Badge variant="soft" class={methodClass(entry.payload.method)}
        >{entry.payload.method}</Badge
      >
    </Table.Cell>
    <Table.Cell
      class="text-base-content max-w-0 truncate py-0 font-mono text-xs"
      title={entry.payload.url}
    >
      {entry.payload.url}
    </Table.Cell>
    <Table.Cell class="py-0 text-center">
      {#if entry.payload.status !== null}
        <Badge variant="soft" class={statusClass(entry.payload.status)}
          >{entry.payload.status}</Badge
        >
      {:else}
        <span class="text-base-content/60 text-xs">—</span>
      {/if}
    </Table.Cell>
    <Table.Cell class="text-base-content/60 py-0 text-right text-xs"
      >{formatDuration(entry.durationMs)}</Table.Cell
    >
    <Table.Cell
      class="text-base-content/60 py-0 pr-4 text-right text-xs"
      title={formatAbsoluteTime(entry.timestamp)}
    >
      {timeAgo(entry.timestamp)}
    </Table.Cell>
  {/snippet}
</EntryTable>
