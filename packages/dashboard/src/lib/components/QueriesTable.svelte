<script lang="ts">
  import {
    timeAgo,
    formatAbsoluteTime,
    durationClass,
    interpolateSql,
    formatDuration,
  } from "../format";
  import { highlight } from "../highlight";
  import type { Entry } from "../types";
  import * as Table from "./ui/table/index.js";
  import { Badge } from "./ui/badge/index.js";
  import EntryTable from "./EntryTable.svelte";

  let { entries }: { entries: Extract<Entry, { type: "query" }>[] } = $props();

  const columns = [
    { label: "SQL", class: "pl-4" },
    { label: "Time", class: "w-24" },
    { label: "Happened", class: "w-28 pr-4 text-right" },
  ];
</script>

<EntryTable type="query" rows={entries} id={(e) => e.id} {columns}>
  {#snippet cells(entry)}
    {@const sql = interpolateSql(entry.payload.sql, entry.payload.params)}
    <Table.Cell class="max-w-0 py-0 pl-4">
      <div class="flex min-w-0 items-center gap-2">
        {#if entry.payload.connection}
          <Badge variant="soft" class="bg-base-300 text-base-content/60 shrink-0"
            >{entry.payload.connection}</Badge
          >
        {/if}
        <code class="min-w-0 truncate font-mono text-xs" title={sql}
          >{@html highlight(sql, "sql")}</code
        >
      </div>
    </Table.Cell>
    <Table.Cell class="py-0">
      <Badge variant="soft" class={durationClass(entry.durationMs)}
        >{formatDuration(entry.durationMs)}</Badge
      >
    </Table.Cell>
    <Table.Cell
      class="text-base-content/60 py-0 pr-4 text-right text-xs"
      title={formatAbsoluteTime(entry.timestamp)}
    >
      {timeAgo(entry.timestamp)}
    </Table.Cell>
  {/snippet}
</EntryTable>
