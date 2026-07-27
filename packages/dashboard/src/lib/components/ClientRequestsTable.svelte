<script lang="ts">
  import { base } from "$app/paths";
  import { goto } from "$app/navigation";
  import { timeAgo, formatAbsoluteTime, statusClass, methodClass, formatDuration } from "../format";
  import type { Entry } from "../types";
  import * as Table from "./ui/table/index.js";
  import { Badge } from "./ui/badge/index.js";
  import EmptyState from "./EmptyState.svelte";

  let { entries }: { entries: Extract<Entry, { type: "client-request" }>[] } = $props();
</script>

<Table.Root>
  <Table.Header>
    <Table.Row>
      <Table.Head class="text-muted-foreground w-24 pl-4 text-xs">Method</Table.Head>
      <Table.Head class="text-muted-foreground text-xs">URI</Table.Head>
      <Table.Head class="text-muted-foreground w-20 text-center text-xs">Status</Table.Head>
      <Table.Head class="text-muted-foreground w-24 text-right text-xs">Duration</Table.Head>
      <Table.Head class="text-muted-foreground w-28 pr-4 text-right text-xs">Happened</Table.Head>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {#each entries as entry (entry.id)}
      <Table.Row
        class="h-11 cursor-pointer"
        onclick={() => goto(`${base}/client-requests/${entry.id}`)}
      >
        <Table.Cell class="py-0 pl-4">
          <Badge variant="soft" class={methodClass(entry.payload.method)}>{entry.payload.method}</Badge>
        </Table.Cell>
        <Table.Cell class="text-foreground max-w-0 truncate py-0 font-mono text-xs" title={entry.payload.url}>
          {entry.payload.url}
        </Table.Cell>
        <Table.Cell class="py-0">
          {#if entry.payload.status !== null}
            <Badge variant="soft" class={statusClass(entry.payload.status)}>{entry.payload.status}</Badge>
          {:else}
            <span class="text-muted-foreground text-xs">—</span>
          {/if}
        </Table.Cell>
        <Table.Cell class="text-muted-foreground py-0 text-right text-xs">{formatDuration(entry.durationMs)}</Table.Cell>
        <Table.Cell class="text-muted-foreground py-0 pr-4 text-right text-xs" title={formatAbsoluteTime(entry.timestamp)}>
          {timeAgo(entry.timestamp)}
        </Table.Cell>
      </Table.Row>
    {:else}
      <Table.Row class="hover:bg-transparent">
        <Table.Cell colspan={5}>
          <EmptyState message="Make an outgoing HTTP call and it'll show up here." />
        </Table.Cell>
      </Table.Row>
    {/each}
  </Table.Body>
</Table.Root>
