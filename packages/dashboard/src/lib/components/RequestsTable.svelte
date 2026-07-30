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

  let { entries }: { entries: Extract<Entry, { type: "request" }>[] } =
    $props();

  const columns = [
    { label: "Verb", class: "w-24 pl-4" },
    { label: "Path" },
    { label: "Status", class: "w-20 text-center" },
    { label: "Duration", class: "w-24 text-right" },
    { label: "Happened", class: "w-28 pr-4 text-right" },
  ];
</script>

<EntryTable type="request" rows={entries} id={(e) => e.id} {columns}>
  {#snippet cells(entry)}
    <Table.Cell class="py-0 pl-4">
      <Badge variant="soft" class={methodClass(entry.payload.method)}
        >{entry.payload.method}</Badge
      >
    </Table.Cell>
    <Table.Cell
      class="text-base-content max-w-0 truncate py-0 font-mono text-xs"
      title={entry.payload.path}
    >
      {entry.payload.path}
    </Table.Cell>
    <Table.Cell class="py-0 text-center">
      <Badge variant="soft" class={statusClass(entry.payload.status)}
        >{entry.payload.status}</Badge
      >
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
