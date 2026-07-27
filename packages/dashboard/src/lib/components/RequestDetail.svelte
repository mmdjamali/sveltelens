<script lang="ts">
  import { base } from "$app/paths";
  import {
    formatDuration,
    formatBytes,
    statusClass,
    methodClass,
    entryTypeClass,
    entryTypeBarClass,
    entrySummary,
  } from "../format";
  import DetailHeader from "./DetailHeader.svelte";
  import KeyValueTable from "./KeyValueTable.svelte";
  import BodyView from "./BodyView.svelte";
  import * as Tabs from "./ui/tabs/index.js";
  import { Badge } from "./ui/badge/index.js";
  import { ENTRY_TYPE_BADGE_LABELS, ENTRY_TYPE_SLUGS, type Entry } from "../types";

  let { entry, related }: { entry: Extract<Entry, { type: "request" }>; related: Entry[] } = $props();

  let tab = $state<"request" | "headers" | "payload" | "session" | "response-headers" | "response">("request");
  $effect(() => {
    entry.id;
    tab = "request";
  });

  const timelineTotalMs = $derived(Math.max(1, entry.durationMs ?? 0, ...related.map((e) => (e.offsetMs ?? 0) + (e.durationMs ?? 0))));
  const timelineRows = $derived([...related].sort((a, b) => (a.offsetMs ?? 0) - (b.offsetMs ?? 0)));
</script>

<div class="bg-background flex h-full flex-col">
  <DetailHeader
    backHref="{base}/requests"
    badgeLabel={ENTRY_TYPE_BADGE_LABELS.request}
    badgeClass={entryTypeClass("request")}
    title={entry.payload.path}
    timestamp={entry.timestamp}
    durationMs={entry.durationMs}
  />

  <Tabs.Root bind:value={tab} class="flex min-h-0 flex-1 flex-col gap-0">
    <div class="border-b px-4">
      <Tabs.List variant="line" class="h-auto gap-5 p-0">
        <Tabs.Trigger value="request" class="px-0 py-2.5">Request</Tabs.Trigger>
        <Tabs.Trigger value="headers" class="px-0 py-2.5">Headers</Tabs.Trigger>
        <Tabs.Trigger value="payload" class="px-0 py-2.5">Payload</Tabs.Trigger>
        <Tabs.Trigger value="session" class="px-0 py-2.5">Session</Tabs.Trigger>
        <Tabs.Trigger value="response-headers" class="px-0 py-2.5">Response Headers</Tabs.Trigger>
        <Tabs.Trigger value="response" class="px-0 py-2.5">Response</Tabs.Trigger>
      </Tabs.List>
    </div>

    <div class="min-h-0 flex-1 overflow-auto p-4">
      <Tabs.Content value="request">
        <div class="overflow-hidden rounded-lg border">
          <table class="w-full text-xs">
            <tbody>
              <tr class="border-b last:border-0">
                <td class="text-muted-foreground bg-muted/20 w-44 shrink-0 px-3 py-2 align-top font-medium">Method</td>
                <td class="px-3 py-2">
                  <Badge variant="soft" class={methodClass(entry.payload.method)}>{entry.payload.method}</Badge>
                </td>
              </tr>
              <tr class="border-b last:border-0">
                <td class="text-muted-foreground bg-muted/20 w-44 shrink-0 px-3 py-2 align-top font-medium">Path</td>
                <td class="px-3 py-2 break-all">{entry.payload.path}</td>
              </tr>
              <tr class="border-b last:border-0">
                <td class="text-muted-foreground bg-muted/20 w-44 shrink-0 px-3 py-2 align-top font-medium">
                  Controller / route handler
                </td>
                <td class="px-3 py-2 break-all">{entry.payload.routeId ?? "—"}</td>
              </tr>
              <tr class="border-b last:border-0">
                <td class="text-muted-foreground bg-muted/20 w-44 shrink-0 px-3 py-2 align-top font-medium">Status</td>
                <td class="px-3 py-2">
                  <Badge variant="soft" class={statusClass(entry.payload.status)}>{entry.payload.status}</Badge>
                </td>
              </tr>
              <tr class="border-b last:border-0">
                <td class="text-muted-foreground bg-muted/20 w-44 shrink-0 px-3 py-2 align-top font-medium">Duration</td>
                <td class="px-3 py-2">{formatDuration(entry.durationMs)}</td>
              </tr>
              <tr class="border-b last:border-0">
                <td class="text-muted-foreground bg-muted/20 w-44 shrink-0 px-3 py-2 align-top font-medium">Hostname</td>
                <td class="px-3 py-2 break-all">{entry.payload.hostname}</td>
              </tr>
              <tr class="border-b last:border-0">
                <td class="text-muted-foreground bg-muted/20 w-44 shrink-0 px-3 py-2 align-top font-medium">IP</td>
                <td class="px-3 py-2">{entry.payload.ip ?? "—"}</td>
              </tr>
              <tr class="border-b last:border-0">
                <td class="text-muted-foreground bg-muted/20 w-44 shrink-0 px-3 py-2 align-top font-medium">Memory usage</td>
                <td class="px-3 py-2">
                  {entry.payload.memoryUsageBytes !== null ? formatBytes(entry.payload.memoryUsageBytes) : "—"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Tabs.Content>

      <Tabs.Content value="headers">
        <KeyValueTable rows={Object.entries(entry.payload.requestHeaders)} />
      </Tabs.Content>

      <Tabs.Content value="payload">
        {#if entry.payload.requestBody}
          {#if entry.payload.requestBody.truncated}
            <p class="mb-2 text-xs text-amber-600 dark:text-amber-400">
              truncated ({formatBytes(entry.payload.requestBody.size)})
            </p>
          {/if}
          <BodyView text={entry.payload.requestBody.text} contentType={entry.payload.requestBody.contentType} />
        {:else}
          <p class="text-muted-foreground text-xs italic">no request body</p>
        {/if}
      </Tabs.Content>

      <Tabs.Content value="session">
        <p class="text-muted-foreground text-xs italic">no session data captured</p>
      </Tabs.Content>

      <Tabs.Content value="response-headers">
        <KeyValueTable rows={Object.entries(entry.payload.responseHeaders)} />
      </Tabs.Content>

      <Tabs.Content value="response">
        {#if entry.payload.responseBody}
          {#if entry.payload.responseBody.truncated}
            <p class="mb-2 text-xs text-amber-600 dark:text-amber-400">
              truncated ({formatBytes(entry.payload.responseBody.size)})
            </p>
          {/if}
          <BodyView text={entry.payload.responseBody.text} contentType={entry.payload.responseBody.contentType} />
        {:else}
          <p class="text-muted-foreground text-xs italic">no response body</p>
        {/if}
      </Tabs.Content>
    </div>
  </Tabs.Root>

  <details class="border-t px-4 py-2.5">
    <summary class="text-muted-foreground hover:text-foreground cursor-pointer text-xs font-medium">
      Related entries {#if related.length}({related.length}){/if}
    </summary>
    {#if related.length === 0}
      <p class="text-muted-foreground mt-2 text-xs italic">no related entries for this request</p>
    {:else}
      <div class="mt-2 space-y-1 pb-1">
        {#each timelineRows as row (row.id)}
          {@const leftPct = ((row.offsetMs ?? 0) / timelineTotalMs) * 100}
          {@const widthPct = row.durationMs !== null ? Math.max((row.durationMs / timelineTotalMs) * 100, 0.6) : 0}
          <a
            href="{base}/{ENTRY_TYPE_SLUGS[row.type]}/{row.id}"
            class="hover:bg-accent hover:text-accent-foreground grid grid-cols-[minmax(0,240px)_1fr_3.5rem] items-center gap-3 rounded-md px-2 py-1.5 text-left transition-colors"
            title="{ENTRY_TYPE_BADGE_LABELS[row.type]} · offset {formatDuration(row.offsetMs)} · duration {formatDuration(row.durationMs)}"
          >
            <span class="flex min-w-0 items-center gap-1.5">
              <Badge variant="soft" class="shrink-0 tracking-wide uppercase {entryTypeClass(row.type)}">
                {ENTRY_TYPE_BADGE_LABELS[row.type]}
              </Badge>
              <span class="min-w-0 truncate text-xs" title={entrySummary(row)}>{entrySummary(row)}</span>
            </span>
            <span class="bg-muted/40 relative h-2 w-full overflow-hidden rounded-full">
              {#if row.durationMs !== null}
                <span
                  class="absolute inset-y-0 rounded-full {entryTypeBarClass(row.type)}"
                  style="left: {leftPct}%; width: {widthPct}%"
                ></span>
              {:else}
                <span
                  class="absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full {entryTypeBarClass(row.type)}"
                  style="left: {leftPct}%"
                ></span>
              {/if}
            </span>
            <span class="text-muted-foreground shrink-0 text-right text-xs tabular-nums">
              {row.durationMs !== null ? formatDuration(row.durationMs) : "—"}
            </span>
          </a>
        {/each}
      </div>
    {/if}
  </details>
</div>
