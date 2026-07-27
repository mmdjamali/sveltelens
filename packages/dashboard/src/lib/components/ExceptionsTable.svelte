<script lang="ts">
  import { base } from "$app/paths";
  import { goto } from "$app/navigation";
  import { timeAgo, formatAbsoluteTime, exceptionLocation } from "../format";
  import type { Entry } from "../types";
  import * as Table from "./ui/table/index.js";
  import { Badge } from "./ui/badge/index.js";
  import EmptyState from "./EmptyState.svelte";

  let { entries }: { entries: Extract<Entry, { type: "exception" }>[] } = $props();

  const grouped = $derived.by(() => {
    const byKey = new Map<string, { entry: (typeof entries)[number]; location: string | null; count: number }>();
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

<Table.Root class="rounded-field overflow-hidden bg-base-200">
  <Table.Header class="bg-base-300">
    <Table.Row>
      <Table.Head class="text-base-content/60 w-48 pl-4 text-xs">Class</Table.Head>
      <Table.Head class="text-base-content/60 text-xs">Message</Table.Head>
      <Table.Head class="text-base-content/60 w-56 text-xs">Location</Table.Head>
      <Table.Head class="text-base-content/60 w-28 pr-4 text-right text-xs">Happened</Table.Head>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {#each grouped as { entry, location, count } (entry.id)}
      <Table.Row
        class="h-11 cursor-pointer"
        onclick={() => goto(`${base}/exceptions/${entry.id}`)}
      >
        <Table.Cell class="py-0 pl-4">
          <span class="flex items-center gap-1.5">
            <span class="text-error truncate font-mono text-xs font-bold">{entry.payload.name}</span>
            {#if count > 1}
              <Badge variant="soft" class="badge-error h-4 min-w-4 rounded-full px-1 text-[10px]">
                {count}
              </Badge>
            {/if}
          </span>
        </Table.Cell>
        <Table.Cell class="text-base-content max-w-0 truncate py-0 text-xs" title={entry.payload.message}>
          {entry.payload.message}
        </Table.Cell>
        <Table.Cell class="text-base-content/60 max-w-0 truncate py-0 font-mono text-xs" title={location ?? ""}>
          {location ?? "—"}
        </Table.Cell>
        <Table.Cell class="text-base-content/60 py-0 pr-4 text-right text-xs" title={formatAbsoluteTime(entry.timestamp)}>
          {timeAgo(entry.timestamp)}
        </Table.Cell>
      </Table.Row>
    {:else}
      <Table.Row>
        <Table.Cell colspan={4}>
          <EmptyState message="Throw an exception in your app and it'll show up here." />
        </Table.Cell>
      </Table.Row>
    {/each}
  </Table.Body>
</Table.Root>
