<script lang="ts">
  import { base } from "$app/paths";
  import {
    timeAgo,
    statusClass,
    entryTypeClass,
    entryVerb,
    entryVerbClass,
    entryStatus,
    entrySummary,
    formatDuration,
    formatBytes,
    stripAnsi,
  } from "../format";
  import { highlight } from "../highlight";
  import BodyView from "./BodyView.svelte";
  import * as Tabs from "./ui/tabs/index.js";
  import { Badge } from "./ui/badge/index.js";
  import { Button } from "./ui/button/index.js";
  import IconArrowLeft from "@tabler/icons-svelte/icons/arrow-left";
  import { ENTRY_TYPE_BADGE_LABELS, type Entry } from "../types";

  let { entry, related }: { entry: Entry; related: Entry[] } = $props();

  const hasHttpTabs = $derived(
    entry.type === "request" || entry.type === "client-request",
  );

  type Tab = "headers" | "payload" | "response" | "details" | "related";
  let tab = $state<Tab>("payload");

  $effect(() => {
    entry.id;
    tab = hasHttpTabs ? "payload" : "details";
  });

  function headersOf(record: Record<string, string>) {
    return Object.entries(record);
  }
</script>

{#snippet headerTable(rows: [string, string][])}
  <table class="w-full text-xs">
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
  <div class="grid grid-cols-[auto_1fr] items-center gap-x-3 border-b px-4 py-2.5">
    <Button
      variant="ghost"
      size="icon-lg"
      class="row-span-2 shrink-0"
      href="{base}/{entry.type}"
    >
      <IconArrowLeft class="size-5" />
      <span class="sr-only">Back to {entry.type} list</span>
    </Button>
    <div class="flex min-w-0 items-center gap-2">
      <Badge
        variant="soft"
        class="tracking-wide uppercase {entryTypeClass(entry.type)}"
      >
        {ENTRY_TYPE_BADGE_LABELS[entry.type]}
      </Badge>

      {#if entryVerb(entry)}
        <Badge variant="soft" class={entryVerbClass(entry)}>
          {entryVerb(entry)}
        </Badge>
      {/if}
      {#if entryStatus(entry) !== null}
        <Badge variant="soft" class={statusClass(entryStatus(entry))}>
          {entryStatus(entry)}
        </Badge>
      {/if}
      <h2
        class="text-foreground min-w-0 truncate text-sm font-medium"
        title={entrySummary(entry)}
      >
        {entrySummary(entry)}
      </h2>
    </div>
    <p class="text-muted-foreground col-start-2 mt-0.5 text-xs">
      {timeAgo(entry.timestamp)} · {formatDuration(entry.durationMs)}
    </p>
  </div>

  <Tabs.Root bind:value={tab} class="flex min-h-0 flex-1 flex-col gap-0">
    <div class="border-b px-4">
      <Tabs.List variant="line" class="h-auto gap-5 p-0">
        {#if hasHttpTabs}
          <Tabs.Trigger value="headers" class="px-0 py-2.5">Headers</Tabs.Trigger>
          <Tabs.Trigger value="payload" class="px-0 py-2.5">Payload</Tabs.Trigger>
          <Tabs.Trigger value="response" class="px-0 py-2.5">Response</Tabs.Trigger>
        {:else}
          <Tabs.Trigger value="details" class="px-0 py-2.5">Details</Tabs.Trigger>
        {/if}
        <Tabs.Trigger value="related" class="gap-1.5 px-0 py-2.5">
          Related
          {#if related.length}
            <Badge
              variant="soft"
              class="h-4 min-w-4 rounded-full px-1 text-[10px]"
            >
              {related.length}
            </Badge>
          {/if}
        </Tabs.Trigger>
      </Tabs.List>
    </div>

    <div class="min-h-0 flex-1 overflow-auto p-4">
      {#if entry.type === "request" || entry.type === "client-request"}
        <Tabs.Content value="headers" class="space-y-4">
          <div>
            <h3 class="text-muted-foreground mb-1.5 text-xs font-medium">
              Request headers
            </h3>
            {@render headerTable(headersOf(entry.payload.requestHeaders))}
          </div>
          <div>
            <h3 class="text-muted-foreground mb-1.5 text-xs font-medium">
              Response headers
            </h3>
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
          {#if entry.type === "client-request" && entry.payload.error}
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
          {#if entry.type === "query"}
            <pre
              class="bg-muted/40 overflow-x-auto rounded-md border p-3 font-mono text-xs whitespace-pre-wrap">{@html highlight(
                entry.payload.sql,
                "sql",
              )}</pre>
            {#if entry.payload.params.length}
              <h3 class="text-muted-foreground mt-3 mb-1.5 text-xs font-medium">
                Params
              </h3>
              <BodyView text={JSON.stringify(entry.payload.params)} />
            {/if}
          {:else if entry.type === "log"}
            <div
              class="bg-muted/40 overflow-x-auto rounded-md border p-3 text-xs whitespace-pre-wrap"
            >
              {stripAnsi(entry.payload.message)}
            </div>
          {:else if entry.type === "exception"}
            <pre
              class="text-destructive bg-destructive/5 border-destructive/20 overflow-x-auto rounded-md border p-3 font-mono text-xs whitespace-pre-wrap">{entry
                .payload.stack ?? entry.payload.message}</pre>
          {/if}
        </Tabs.Content>
      {/if}

      <Tabs.Content value="related">
        {#if related.length === 0}
          <p class="text-muted-foreground text-xs italic">
            no related entries for this request
          </p>
        {:else}
          <ul class="space-y-1.5">
            {#each related as rel (rel.id)}
              <li>
                <a
                  class="hover:bg-accent hover:text-accent-foreground flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left transition-colors"
                  href="{base}/{rel.id}"
                  title={entrySummary(rel)}
                >
                  <Badge
                    variant="soft"
                    class="shrink-0 tracking-wide uppercase {entryTypeClass(
                      rel.type,
                    )}"
                  >
                    {ENTRY_TYPE_BADGE_LABELS[rel.type]}
                  </Badge>
                  <span class="min-w-0 flex-1 truncate text-xs"
                    >{entrySummary(rel)}</span
                  >
                </a>
              </li>
            {/each}
          </ul>
        {/if}
      </Tabs.Content>
    </div>
  </Tabs.Root>
</div>
