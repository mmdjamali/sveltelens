<script lang="ts">
  import { base } from "$app/paths";
  import { goto } from "$app/navigation";
  import { timeAgo, formatAbsoluteTime, levelClass, stripAnsi } from "../format";
  import type { Entry } from "../types";
  import * as Table from "./ui/table/index.js";
  import { Badge } from "./ui/badge/index.js";
  import EmptyState from "./EmptyState.svelte";

  let { entries }: { entries: Extract<Entry, { type: "log" }>[] } = $props();
</script>

<Table.Root>
  <Table.Header>
    <Table.Row>
      <Table.Head class="text-muted-foreground w-24 pl-4 text-xs">Level</Table.Head>
      <Table.Head class="text-muted-foreground text-xs">Message</Table.Head>
      <Table.Head class="text-muted-foreground w-28 pr-4 text-right text-xs">Happened</Table.Head>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {#each entries as entry (entry.id)}
      <Table.Row
        class="h-11 cursor-pointer"
        onclick={() => goto(`${base}/logs/${entry.id}`)}
      >
        <Table.Cell class="py-0 pl-4">
          <Badge variant="soft" class="uppercase {levelClass(entry.payload.level)}">{entry.payload.level}</Badge>
        </Table.Cell>
        <Table.Cell
          class="text-foreground max-w-0 truncate py-0 font-mono text-xs"
          title={stripAnsi(entry.payload.message)}
        >
          {stripAnsi(entry.payload.message)}
        </Table.Cell>
        <Table.Cell class="text-muted-foreground py-0 pr-4 text-right text-xs" title={formatAbsoluteTime(entry.timestamp)}>
          {timeAgo(entry.timestamp)}
        </Table.Cell>
      </Table.Row>
    {:else}
      <Table.Row>
        <Table.Cell colspan={3}>
          <EmptyState message="Log something from your app and it'll show up here." />
        </Table.Cell>
      </Table.Row>
    {/each}
  </Table.Body>
</Table.Root>
