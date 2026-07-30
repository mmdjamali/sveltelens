<script lang="ts">
  import { timeAgo, formatAbsoluteTime, exceptionLocation } from "../format";
  import type { Entry } from "../types";
  import * as Table from "./ui/table/index.js";
  import { Badge } from "./ui/badge/index.js";
  import EntryTable from "./EntryTable.svelte";

  let { entries }: { entries: Extract<Entry, { type: "exception" }>[] } =
    $props();

  const columns = [
    { label: "Class", class: "w-48 pl-4" },
    { label: "Message" },
    { label: "Location", class: "w-56" },
    { label: "Happened", class: "w-28 pr-4 text-right" },
  ];

  // The same error thrown repeatedly is one row with a count, not N rows.
  const grouped = $derived.by(() => {
    const byKey = new Map<
      string,
      { entry: (typeof entries)[number]; location: string | null; count: number }
    >();
    for (const entry of entries) {
      const location = exceptionLocation(entry.payload.stack);
      const key = `${entry.payload.name}\x00${entry.payload.message}\x00${location ?? ""}`;
      const existing = byKey.get(key);
      if (existing) existing.count++;
      else byKey.set(key, { entry, location, count: 1 });
    }
    return [...byKey.values()];
  });
</script>

<EntryTable
  type="exception"
  rows={grouped}
  id={(row) => row.entry.id}
  {columns}
>
  {#snippet cells({ entry, location, count })}
    <Table.Cell class="py-0 pl-4">
      <span class="flex items-center gap-1.5">
        <span class="text-error truncate font-mono text-xs font-bold"
          >{entry.payload.name}</span
        >
        {#if count > 1}
          <Badge
            variant="soft"
            class="badge-error h-4 min-w-4 rounded-full px-1 text-[10px]"
          >
            {count}
          </Badge>
        {/if}
      </span>
    </Table.Cell>
    <Table.Cell
      class="text-base-content max-w-0 truncate py-0 text-xs"
      title={entry.payload.message}
    >
      {entry.payload.message}
    </Table.Cell>
    <Table.Cell
      class="text-base-content/60 max-w-0 truncate py-0 font-mono text-xs"
      title={location ?? ""}
    >
      {location ?? "—"}
    </Table.Cell>
    <Table.Cell
      class="text-base-content/60 py-0 pr-4 text-right text-xs"
      title={formatAbsoluteTime(entry.timestamp)}
    >
      {timeAgo(entry.timestamp)}
    </Table.Cell>
  {/snippet}
</EntryTable>
