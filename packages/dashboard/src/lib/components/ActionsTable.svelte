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

  let { entries }: { entries: Extract<Entry, { type: "action" }>[] } = $props();

  const columns = [
    { label: "Action", class: "pl-4" },
    { label: "Route" },
    { label: "Status", class: "w-16" },
    { label: "Duration", class: "w-20" },
    { label: "Happened", class: "w-28 pr-4 text-right" },
  ];
</script>

<EntryTable type="action" rows={entries} id={(e) => e.id} {columns}>
  {#snippet cells(entry)}
    <Table.Cell class="max-w-0 py-0 pl-4">
      <div class="flex min-w-0 items-center gap-2">
        <Badge variant="soft" class={methodClass(entry.payload.method)}
          >{entry.payload.method}</Badge
        >
        <span class="min-w-0 truncate font-mono text-xs font-medium"
          >{entry.payload.actionName}</span
        >
      </div>
    </Table.Cell>
    <Table.Cell class="py-0">
      <span
        class="text-base-content/60 truncate font-mono text-xs"
        title={entry.payload.path}>{entry.payload.path}</span
      >
    </Table.Cell>
    <Table.Cell class="py-0">
      <Badge variant="soft" class={statusClass(entry.payload.status)}
        >{entry.payload.status}</Badge
      >
    </Table.Cell>
    <Table.Cell class="py-0">
      <span class="font-mono text-xs">{formatDuration(entry.durationMs)}</span>
    </Table.Cell>
    <Table.Cell
      class="text-base-content/60 py-0 pr-4 text-right text-xs"
      title={formatAbsoluteTime(entry.timestamp)}
    >
      {timeAgo(entry.timestamp)}
    </Table.Cell>
  {/snippet}
</EntryTable>
