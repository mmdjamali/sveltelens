<script lang="ts">
  import { timeAgo, formatAbsoluteTime, levelClass, stripAnsi } from "../format";
  import type { Entry } from "../types";
  import * as Table from "./ui/table/index.js";
  import { Badge } from "./ui/badge/index.js";
  import EntryTable from "./EntryTable.svelte";

  let { entries }: { entries: Extract<Entry, { type: "log" }>[] } = $props();

  const columns = [
    { label: "Level", class: "w-24 pl-4" },
    { label: "Message" },
    { label: "Happened", class: "w-28 pr-4 text-right" },
  ];
</script>

<EntryTable type="log" rows={entries} id={(e) => e.id} {columns}>
  {#snippet cells(entry)}
    <Table.Cell class="py-0 pl-4">
      <Badge variant="soft" class="uppercase {levelClass(entry.payload.level)}"
        >{entry.payload.level}</Badge
      >
    </Table.Cell>
    <Table.Cell
      class="text-base-content max-w-0 truncate py-0 font-mono text-xs"
      title={stripAnsi(entry.payload.message)}
    >
      {stripAnsi(entry.payload.message)}
    </Table.Cell>
    <Table.Cell
      class="text-base-content/60 py-0 pr-4 text-right text-xs"
      title={formatAbsoluteTime(entry.timestamp)}
    >
      {timeAgo(entry.timestamp)}
    </Table.Cell>
  {/snippet}
</EntryTable>
