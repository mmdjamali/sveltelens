<script lang="ts">
  import { base } from '$app/paths';
  import { timeAgo, statusClass, methodClass, formatDuration, formatBytes } from '../format';
  import { highlight } from '../highlight';
  import BodyView from './BodyView.svelte';
  import * as Tabs from './ui/tabs/index.js';
  import { Badge } from './ui/badge/index.js';
  import { Button } from './ui/button/index.js';
  import IconArrowLeft from '@tabler/icons-svelte/icons/arrow-left';
  import type { Entry } from '../types';

  let { entry, related }: { entry: Entry; related: Entry[] } = $props();

  const hasHttpTabs = $derived(entry.type === 'request' || entry.type === 'client-request');

  type Tab = 'headers' | 'payload' | 'response' | 'details' | 'related';
  let tab = $state<Tab>('payload');

  $effect(() => {
    entry.id;
    tab = hasHttpTabs ? 'payload' : 'details';
  });

  function headersOf(record: Record<string, string>) {
    return Object.entries(record);
  }
</script>

{#snippet headerTable(rows: [string, string][])}
  <table class="w-full font-mono text-xs">
    <tbody>
      {#each rows as [k, v] (k)}
        <tr class="border-b last:border-0">
          <td class="text-muted-foreground py-1.5 pr-3 align-top">{k}</td>
          <td class="py-1.5 break-all">{v}</td>
        </tr>
      {/each}
    </tbody>
  </table>
{/snippet}

<div class="bg-background flex h-full flex-col">
    <div class="flex items-start gap-3 border-b px-4 py-3">
      <Button variant="ghost" size="icon-lg" class="shrink-0" href="{base}/{entry.type}">
        <IconArrowLeft class="size-5" />
        <span class="sr-only">Back to {entry.type} list</span>
      </Button>
      <div class="min-w-0">
        <div class="flex items-center gap-2">
          <span class="text-muted-foreground text-xs tracking-wide uppercase">{entry.type}</span>
          {#if entry.type === 'request' || entry.type === 'client-request'}
            <Badge variant="outline" class="font-mono {methodClass(entry.payload.method)}">
              {entry.payload.method}
            </Badge>
            <Badge variant="outline" class="font-mono {statusClass(entry.payload.status)}">
              {entry.payload.status ?? '—'}
            </Badge>
          {/if}
        </div>
        <h2 class="mt-1 truncate font-mono text-sm font-medium">
          {#if entry.type === 'request'}{entry.payload.path}
          {:else if entry.type === 'client-request'}{entry.payload.url}
          {:else if entry.type === 'query'}{entry.payload.sql}
          {:else if entry.type === 'log'}{entry.payload.message}
          {:else}{entry.payload.name}: {entry.payload.message}{/if}
        </h2>
        <p class="text-muted-foreground mt-1 text-xs">
          {timeAgo(entry.timestamp)} · {formatDuration(entry.durationMs)}
        </p>
      </div>
    </div>

    <Tabs.Root bind:value={tab} class="flex min-h-0 flex-1 flex-col gap-0">
      <div class="border-b px-4 py-2">
        <Tabs.List>
          {#if hasHttpTabs}
            <Tabs.Trigger value="headers">Headers</Tabs.Trigger>
            <Tabs.Trigger value="payload">Payload</Tabs.Trigger>
            <Tabs.Trigger value="response">Response</Tabs.Trigger>
          {:else}
            <Tabs.Trigger value="details">Details</Tabs.Trigger>
          {/if}
          <Tabs.Trigger value="related">
            Related
            {#if related.length}
              <Badge variant="secondary" class="ml-1.5">{related.length}</Badge>
            {/if}
          </Tabs.Trigger>
        </Tabs.List>
      </div>

      <div class="min-h-0 flex-1 overflow-auto p-4">
        {#if entry.type === 'request' || entry.type === 'client-request'}
          <Tabs.Content value="headers" class="space-y-4">
            <div>
              <h3 class="text-muted-foreground mb-1.5 text-xs font-medium">Request headers</h3>
              {@render headerTable(headersOf(entry.payload.requestHeaders))}
            </div>
            <div>
              <h3 class="text-muted-foreground mb-1.5 text-xs font-medium">Response headers</h3>
              {@render headerTable(headersOf(entry.payload.responseHeaders))}
            </div>
          </Tabs.Content>

          <Tabs.Content value="payload">
            {#if entry.payload.requestBody}
              {#if entry.payload.requestBody.truncated}
                <p class="mb-2 text-xs text-amber-600 dark:text-amber-400">
                  truncated ({formatBytes(entry.payload.requestBody.size)})
                </p>
              {/if}
              <BodyView
                text={entry.payload.requestBody.text}
                contentType={entry.payload.requestBody.contentType}
              />
            {:else}
              <p class="text-muted-foreground text-xs italic">no request body</p>
            {/if}
          </Tabs.Content>

          <Tabs.Content value="response">
            {#if entry.type === 'client-request' && entry.payload.error}
              <p class="text-destructive mb-2 text-xs">{entry.payload.error}</p>
            {/if}
            {#if entry.payload.responseBody}
              {#if entry.payload.responseBody.truncated}
                <p class="mb-2 text-xs text-amber-600 dark:text-amber-400">
                  truncated ({formatBytes(entry.payload.responseBody.size)})
                </p>
              {/if}
              <BodyView
                text={entry.payload.responseBody.text}
                contentType={entry.payload.responseBody.contentType}
              />
            {:else}
              <p class="text-muted-foreground text-xs italic">no response body</p>
            {/if}
          </Tabs.Content>
        {:else}
          <Tabs.Content value="details">
            {#if entry.type === 'query'}
              <pre class="bg-muted/40 overflow-x-auto rounded-md border p-3 font-mono text-xs whitespace-pre-wrap">{@html highlight(entry.payload.sql, 'sql')}</pre>
              {#if entry.payload.params.length}
                <h3 class="text-muted-foreground mt-3 mb-1.5 text-xs font-medium">Params</h3>
                <BodyView text={JSON.stringify(entry.payload.params)} />
              {/if}
            {:else if entry.type === 'log'}
              <pre class="bg-muted/40 overflow-x-auto rounded-md border p-3 font-mono text-xs whitespace-pre-wrap">{entry.payload.message}</pre>
            {:else if entry.type === 'exception'}
              <pre class="text-destructive bg-destructive/5 border-destructive/20 overflow-x-auto rounded-md border p-3 font-mono text-xs whitespace-pre-wrap">{entry.payload.stack ?? entry.payload.message}</pre>
            {/if}
          </Tabs.Content>
        {/if}

        <Tabs.Content value="related">
          {#if related.length === 0}
            <p class="text-muted-foreground text-xs italic">no related entries for this request</p>
          {:else}
            <ul class="space-y-1.5">
              {#each related as rel (rel.id)}
                <li>
                  <a
                    class="hover:bg-accent hover:text-accent-foreground block w-full rounded-md border px-3 py-2 text-left transition-colors"
                    href="{base}/{rel.id}"
                  >
                    <span class="text-muted-foreground text-xs uppercase">{rel.type}</span>
                    <span class="ml-2 font-mono text-xs">
                      {rel.type === 'request'
                        ? rel.payload.path
                        : rel.type === 'client-request'
                          ? rel.payload.url
                          : rel.type === 'query'
                            ? rel.payload.sql
                            : rel.type === 'log'
                              ? rel.payload.message
                              : `${rel.payload.name}: ${rel.payload.message}`}
                    </span>
                  </a>
                </li>
              {/each}
            </ul>
          {/if}
        </Tabs.Content>
      </div>
    </Tabs.Root>
</div>
