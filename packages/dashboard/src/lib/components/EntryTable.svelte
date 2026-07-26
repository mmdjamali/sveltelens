<script lang="ts">
  import { base } from '$app/paths';
  import { goto } from '$app/navigation';
  import {
    timeAgo,
    statusClass,
    methodClass,
    levelClass,
    entryTypeClass,
    formatDuration,
  } from '../format';
  import { ENTRY_TYPE_ICONS, type Entry } from '../types';
  import * as Table from './ui/table/index.js';
  import { Badge } from './ui/badge/index.js';

  let { entries }: { entries: Entry[] } = $props();

  function verb(entry: Entry): string | null {
    if (entry.type === 'request' || entry.type === 'client-request') return entry.payload.method;
    if (entry.type === 'log') return entry.payload.level.toUpperCase();
    if (entry.type === 'exception') return 'ERR';
    return null;
  }

  function verbClass(entry: Entry): string {
    if (entry.type === 'log') return levelClass(entry.payload.level);
    if (entry.type === 'exception') return entryTypeClass('exception');
    return methodClass(verb(entry) ?? '');
  }

  function primary(entry: Entry): string {
    switch (entry.type) {
      case 'request':
        return entry.payload.path;
      case 'client-request':
        return entry.payload.url;
      case 'query':
        return entry.payload.sql;
      case 'log':
        return entry.payload.message;
      case 'exception':
        return `${entry.payload.name}: ${entry.payload.message}`;
    }
  }

  function status(entry: Entry): number | null {
    if (entry.type === 'request' || entry.type === 'client-request') return entry.payload.status;
    return null;
  }
</script>

<Table.Root>
  <Table.Header class="bg-background sticky top-0 z-10">
    <Table.Row class="hover:bg-transparent">
      <Table.Head class="text-muted-foreground pl-4 text-xs">Type</Table.Head>
      <Table.Head class="text-muted-foreground w-20 text-xs"></Table.Head>
      <Table.Head class="text-muted-foreground text-xs">Detail</Table.Head>
      <Table.Head class="text-muted-foreground w-20 text-xs">Status</Table.Head>
      <Table.Head class="text-muted-foreground w-24 text-xs">Duration</Table.Head>
      <Table.Head class="text-muted-foreground w-28 pr-4 text-right text-xs">Time</Table.Head>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {#each entries as entry (entry.id)}
      {@const Icon = ENTRY_TYPE_ICONS[entry.type]}
      <Table.Row class="cursor-pointer" onclick={() => goto(`${base}/${entry.id}`)}>
        <Table.Cell class="pl-4">
          <Badge variant="outline" class="gap-1.5 {entryTypeClass(entry.type)}">
            <Icon class="size-3.5" />
            {entry.type}
          </Badge>
        </Table.Cell>
        <Table.Cell>
          {#if verb(entry)}
            <Badge variant="outline" class="font-mono {verbClass(entry)}">
              {verb(entry)}
            </Badge>
          {/if}
        </Table.Cell>
        <Table.Cell class="text-foreground max-w-0 truncate font-mono text-xs">
          {primary(entry)}
        </Table.Cell>
        <Table.Cell>
          {#if status(entry) !== null}
            <Badge variant="outline" class="font-mono {statusClass(status(entry))}">
              {status(entry)}
            </Badge>
          {/if}
        </Table.Cell>
        <Table.Cell class="text-muted-foreground text-xs">{formatDuration(entry.durationMs)}</Table.Cell>
        <Table.Cell class="text-muted-foreground pr-4 text-right text-xs">{timeAgo(entry.timestamp)}</Table.Cell>
      </Table.Row>
    {:else}
      <Table.Row class="hover:bg-transparent">
        <Table.Cell colspan={6} class="text-muted-foreground h-32 text-center text-sm">
          No entries yet — trigger a request in your app.
        </Table.Cell>
      </Table.Row>
    {/each}
  </Table.Body>
</Table.Root>
