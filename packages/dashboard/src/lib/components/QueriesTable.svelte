<script lang="ts">
  import { base } from "$app/paths";
  import { goto } from "$app/navigation";
  import { timeAgo, formatAbsoluteTime, durationClass, interpolateSql, formatDuration } from "../format";
  import { highlight } from "../highlight";
  import type { Entry } from "../types";
  import * as Table from "./ui/table/index.js";
  import { Badge } from "./ui/badge/index.js";
  import EmptyState from "./EmptyState.svelte";

  let { entries }: { entries: Extract<Entry, { type: "query" }>[] } = $props();
</script>

<Table.Root>
  <Table.Header class="bg-background sticky top-0 z-10">
    <Table.Row class="hover:bg-transparent">
      <Table.Head class="text-muted-foreground pl-4 text-xs">SQL</Table.Head>
      <Table.Head class="text-muted-foreground w-24 text-xs">Time</Table.Head>
      <Table.Head class="text-muted-foreground w-28 pr-4 text-right text-xs">Time</Table.Head>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {#each entries as entry, i (entry.id)}
      <Table.Row
        class="h-11 cursor-pointer {i % 2 === 1 ? 'bg-muted/20' : ''}"
        onclick={() => goto(`${base}/queries/${entry.id}`)}
      >
        <Table.Cell class="max-w-0 py-0 pl-4">
          <div class="flex min-w-0 items-center gap-2">
            {#if entry.payload.connection}
              <Badge variant="soft" class="bg-muted text-muted-foreground shrink-0">{entry.payload.connection}</Badge>
            {/if}
            <code
              class="min-w-0 truncate font-mono text-xs"
              title={interpolateSql(entry.payload.sql, entry.payload.params)}
              >{@html highlight(interpolateSql(entry.payload.sql, entry.payload.params), "sql")}</code
            >
          </div>
        </Table.Cell>
        <Table.Cell class="py-0">
          <Badge variant="soft" class={durationClass(entry.durationMs)}>{formatDuration(entry.durationMs)}</Badge>
        </Table.Cell>
        <Table.Cell class="text-muted-foreground py-0 pr-4 text-right text-xs" title={formatAbsoluteTime(entry.timestamp)}>
          {timeAgo(entry.timestamp)}
        </Table.Cell>
      </Table.Row>
    {:else}
      <Table.Row class="hover:bg-transparent">
        <Table.Cell colspan={3}>
          <EmptyState message="Run a query in your app and it'll show up here." />
        </Table.Cell>
      </Table.Row>
    {/each}
  </Table.Body>
</Table.Root>
