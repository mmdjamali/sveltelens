<script lang="ts">
  import { base } from "$app/paths";
  import { goto } from "$app/navigation";
  import { timeAgo, formatAbsoluteTime, statusClass, methodClass, formatDuration } from "../format";
  import type { Entry } from "../types";
  import * as Table from "./ui/table/index.js";
  import { Badge } from "./ui/badge/index.js";
  import EmptyState from "./EmptyState.svelte";

  let { entries }: { entries: Extract<Entry, { type: "action" }>[] } = $props();
</script>

<Table.Root class="rounded-field overflow-hidden bg-base-200">
  <Table.Header class="bg-base-300">
    <Table.Row>
      <Table.Head class="text-base-content/60 uppercase tracking-wider pl-4 text-xs">Action</Table.Head>
      <Table.Head class="text-base-content/60 uppercase tracking-wider text-xs">Route</Table.Head>
      <Table.Head class="text-base-content/60 uppercase tracking-wider w-16 text-xs">Status</Table.Head>
      <Table.Head class="text-base-content/60 uppercase tracking-wider w-20 text-xs">Duration</Table.Head>
      <Table.Head class="text-base-content/60 uppercase tracking-wider w-28 pr-4 text-right text-xs">Happened</Table.Head>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {#each entries as entry (entry.id)}
      <Table.Row
        class="h-11 cursor-pointer"
        onclick={() => goto(`${base}/actions/${entry.id}`)}
      >
        <Table.Cell class="max-w-0 py-0 pl-4">
          <div class="flex min-w-0 items-center gap-2">
            <Badge variant="soft" class={methodClass(entry.payload.method)}>{entry.payload.method}</Badge>
            <span class="min-w-0 truncate font-mono text-xs font-medium">{entry.payload.actionName}</span>
          </div>
        </Table.Cell>
        <Table.Cell class="py-0">
          <span class="text-base-content/60 truncate font-mono text-xs" title={entry.payload.path}>{entry.payload.path}</span>
        </Table.Cell>
        <Table.Cell class="py-0">
          <Badge variant="soft" class={statusClass(entry.payload.status)}>{entry.payload.status}</Badge>
        </Table.Cell>
        <Table.Cell class="py-0">
          <span class="font-mono text-xs">{formatDuration(entry.durationMs)}</span>
        </Table.Cell>
        <Table.Cell class="text-base-content/60 py-0 pr-4 text-right text-xs" title={formatAbsoluteTime(entry.timestamp)}>
          {timeAgo(entry.timestamp)}
        </Table.Cell>
      </Table.Row>
    {:else}
      <Table.Row>
        <Table.Cell colspan={5}>
          <EmptyState message="Submit a form action in your app and it'll show up here." />
        </Table.Cell>
      </Table.Row>
    {/each}
  </Table.Body>
</Table.Root>
