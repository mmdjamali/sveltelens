<script lang="ts">
  import { base } from "$app/paths";
  import { goto } from "$app/navigation";
  import { timeAgo, formatAbsoluteTime, statusClass, methodClass, formatDuration } from "../format";
  import type { Entry } from "../types";
  import * as Table from "./ui/table/index.js";
  import { Badge } from "./ui/badge/index.js";
  import EmptyState from "./EmptyState.svelte";

  let { entries }: { entries: Extract<Entry, { type: "request" }>[] } = $props();
</script>

<Table.Root>
  <Table.Header>
    <Table.Row>
      <Table.Head class="text-base-content/60 w-24 pl-4 text-xs">Verb</Table.Head>
      <Table.Head class="text-base-content/60 text-xs">Path</Table.Head>
      <Table.Head class="text-base-content/60 w-20 text-center text-xs">Status</Table.Head>
      <Table.Head class="text-base-content/60 w-24 text-right text-xs">Duration</Table.Head>
      <Table.Head class="text-base-content/60 w-28 pr-4 text-right text-xs">Happened</Table.Head>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {#each entries as entry (entry.id)}
      <Table.Row
        class="h-11 cursor-pointer"
        onclick={() => goto(`${base}/requests/${entry.id}`)}
      >
        <Table.Cell class="py-0 pl-4">
          <Badge variant="soft" class={methodClass(entry.payload.method)}>{entry.payload.method}</Badge>
        </Table.Cell>
        <Table.Cell class="text-base-content max-w-0 truncate py-0 font-mono text-xs" title={entry.payload.path}>
          {entry.payload.path}
        </Table.Cell>
        <Table.Cell class="py-0 text-center">
          <Badge variant="soft" class={statusClass(entry.payload.status)}>{entry.payload.status}</Badge>
        </Table.Cell>
        <Table.Cell class="text-base-content/60 py-0 text-right text-xs">{formatDuration(entry.durationMs)}</Table.Cell>
        <Table.Cell class="text-base-content/60 py-0 pr-4 text-right text-xs" title={formatAbsoluteTime(entry.timestamp)}>
          {timeAgo(entry.timestamp)}
        </Table.Cell>
      </Table.Row>
    {:else}
      <Table.Row>
        <Table.Cell colspan={5}>
          <EmptyState message="Trigger a request in your app and it'll show up here." />
        </Table.Cell>
      </Table.Row>
    {/each}
  </Table.Body>
</Table.Root>
