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
  import { Badge } from "./ui/badge/index.js";
  import { ENTRY_TYPE_META } from "../entry-types";
  import type { Entry } from "../types";

  import ArrowLeftIcon from "@lucide/svelte/icons/arrow-left";

  let {
    entry,
    related,
  }: { entry: Extract<Entry, { type: "action" }>; related: Entry[] } =
    $props();

  const timelineTotalMs = $derived(
    Math.max(
      1,
      entry.durationMs ?? 0,
      ...related.map((e) => (e.offsetMs ?? 0) + (e.durationMs ?? 0)),
    ),
  );
  const timelineRows = $derived(
    [...related].sort((a, b) => (a.offsetMs ?? 0) - (b.offsetMs ?? 0)),
  );
</script>

<a href="{base}/actions" class="btn btn-ghost border-base-300 mb-5">
  <ArrowLeftIcon class="size-4" />
  Back
</a>

<div class="mx-auto max-w-6xl pb-6">
  <div class="card bg-base-200 rounded-field overflow-hidden">
    <DetailHeader
      badgeLabel={ENTRY_TYPE_META.action.badgeLabel}
      badgeClass={entryTypeClass("action")}
      title={entry.payload.actionName}
      timestamp={entry.timestamp}
      durationMs={entry.durationMs}
    />

    <div class="table-responsive">
      <table class="w-full border-collapse text-sm">
        <tbody>
          <tr class="border-b border-base-300">
            <td class="text-base-content/60 w-44 px-4 py-2.5 align-top"
              >Method</td
            >
            <td class="px-4 py-2.5">
              <Badge variant="soft" class={methodClass(entry.payload.method)}
                >{entry.payload.method}</Badge
              >
            </td>
          </tr>
          <tr class="border-b border-base-300">
            <td class="text-base-content/60 w-44 px-4 py-2.5 align-top">Path</td
            >
            <td class="px-4 py-2.5 break-all font-mono text-xs"
              >{entry.payload.path}</td
            >
          </tr>
          <tr class="border-b border-base-300">
            <td class="text-base-content/60 w-44 px-4 py-2.5 align-top">Route</td
            >
            <td class="px-4 py-2.5 break-all">{entry.payload.routeId ?? "—"}</td
            >
          </tr>
          <tr class="border-b border-base-300">
            <td class="text-base-content/60 w-44 px-4 py-2.5 align-top"
              >Action</td
            >
            <td class="px-4 py-2.5">
              <Badge variant="soft" class={methodClass(entry.payload.method)}
                >{entry.payload.actionName}</Badge
              >
            </td>
          </tr>
          <tr class="border-b border-base-300">
            <td class="text-base-content/60 w-44 px-4 py-2.5 align-top"
              >Status</td
            >
            <td class="px-4 py-2.5">
              <Badge variant="soft" class={statusClass(entry.payload.status)}
                >{entry.payload.status}</Badge
              >
            </td>
          </tr>
          <tr class="border-b border-base-300">
            <td class="text-base-content/60 w-44 px-4 py-2.5 align-top"
              >Duration</td
            >
            <td class="px-4 py-2.5">{formatDuration(entry.durationMs)}</td>
          </tr>
          {#if entry.payload.location}
            <tr class="border-b border-base-300">
              <td class="text-base-content/60 w-44 px-4 py-2.5 align-top"
                >Redirect</td
              >
              <td class="px-4 py-2.5 break-all font-mono text-xs"
                >{entry.payload.location}</td
              >
            </tr>
          {/if}
          <tr class="border-b border-base-300">
            <td class="text-base-content/60 w-44 px-4 py-2.5 align-top"
              >Hostname</td
            >
            <td class="px-4 py-2.5 break-all">{entry.payload.hostname}</td>
          </tr>
          <tr class="border-b border-base-300">
            <td class="text-base-content/60 w-44 px-4 py-2.5 align-top">IP</td>
            <td class="px-4 py-2.5">{entry.payload.ip ?? "—"}</td>
          </tr>
          <tr class="border-b border-base-300">
            <td class="text-base-content/60 w-44 px-4 py-2.5 align-top"
              >Memory usage</td
            >
            <td class="px-4 py-2.5">
              {entry.payload.memoryUsageBytes !== null
                ? formatBytes(entry.payload.memoryUsageBytes)
                : "—"}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Request Headers -->
  <div class="card mt-5 bg-base-200 rounded-field overflow-hidden">
    <div
      class="flex items-center justify-between border-b border-base-300 bg-base-300 px-4 py-3"
    >
      <h2 class="m-0 text-sm font-semibold">Headers</h2>
    </div>
    <KeyValueTable rows={Object.entries(entry.payload.requestHeaders)} />
  </div>

  <!-- Request Payload -->
  <div class="card mt-5 bg-base-200 rounded-field overflow-hidden">
    <div
      class="flex items-center justify-between border-b border-base-300 bg-base-300 px-4 py-3"
    >
      <h2 class="m-0 text-sm font-semibold">Request Payload</h2>
    </div>
    <div class="p-4">
      {#if entry.payload.requestBody}
        {#if entry.payload.requestBody.truncated}
          <p class="mb-2 text-xs text-warning">
            truncated ({formatBytes(entry.payload.requestBody.size)})
          </p>
        {/if}
        <BodyView
          text={entry.payload.requestBody.text}
          contentType={entry.payload.requestBody.contentType}
        />
      {:else}
        <p class="text-base-content/60 text-xs italic">no request body</p>
      {/if}
    </div>
  </div>

  <!-- Response Headers -->
  <div class="card mt-5 bg-base-200 rounded-field overflow-hidden">
    <div
      class="flex items-center justify-between border-b border-base-300 bg-base-300 px-4 py-3"
    >
      <h2 class="m-0 text-sm font-semibold">Response Headers</h2>
    </div>
    <KeyValueTable rows={Object.entries(entry.payload.responseHeaders)} />
  </div>

  <!-- Response -->
  <div class="card mt-5 bg-base-200 rounded-field overflow-hidden">
    <div
      class="flex items-center justify-between border-b border-base-300 bg-base-300 px-4 py-3"
    >
      <h2 class="m-0 text-sm font-semibold">Response</h2>
    </div>
    <div class="p-4">
      {#if entry.payload.responseBody}
        {#if entry.payload.responseBody.truncated}
          <p class="mb-2 text-xs text-warning">
            truncated ({formatBytes(entry.payload.responseBody.size)})
          </p>
        {/if}
        <BodyView
          text={entry.payload.responseBody.text}
          contentType={entry.payload.responseBody.contentType}
        />
      {:else}
        <p class="text-base-content/60 text-xs italic">no response body</p>
      {/if}
    </div>
  </div>

  <!-- Related entries -->
  <div class="card mt-5 bg-base-200 rounded-field overflow-hidden">
    <div
      class="flex items-center justify-between border-b border-base-300 bg-base-300 px-4 py-3"
    >
      <h2 class="m-0 text-sm font-semibold">
        Related entries {#if related.length}({related.length}){/if}
      </h2>
    </div>
    <div class="p-4">
      {#if related.length === 0}
        <p class="text-base-content/60 text-xs italic">
          no related entries for this action
        </p>
      {:else}
        <div class="space-y-1">
          {#each timelineRows as row (row.id)}
            {@const leftPct = ((row.offsetMs ?? 0) / timelineTotalMs) * 100}
            {@const widthPct =
              row.durationMs !== null
                ? Math.max((row.durationMs / timelineTotalMs) * 100, 0.6)
                : 0}
            <a
              href="{base}/{ENTRY_TYPE_META[row.type].slug}/{row.id}"
              class="hover:bg-base-300 grid grid-cols-[minmax(0,240px)_1fr_3.5rem] items-center gap-3 rounded-md px-2 py-1.5 text-left transition-colors"
              title="{ENTRY_TYPE_META[row.type].badgeLabel} · offset {row.offsetMs !== null
                ? formatDuration(row.offsetMs)
                : '-'} · duration {formatDuration(row.durationMs)}"
            >
              <span class="flex min-w-0 items-center gap-1.5">
                <Badge
                  variant="soft"
                  class="shrink-0 tracking-wide uppercase {entryTypeClass(
                    row.type,
                  )}"
                >
                  {ENTRY_TYPE_META[row.type].badgeLabel}
                </Badge>
                <span class="min-w-0 truncate text-xs" title={entrySummary(row)}
                  >{entrySummary(row)}</span
                >
              </span>
              <span
                class="bg-base-300/40 relative h-2 w-full overflow-hidden rounded-full"
              >
                {#if row.durationMs !== null}
                  <span
                    class="absolute inset-y-0 rounded-full {entryTypeBarClass(
                      row.type,
                    )}"
                    style="left: {leftPct}%; width: {widthPct}%"
                  ></span>
                {:else}
                  <span
                    class="absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full {entryTypeBarClass(
                      row.type,
                    )}"
                    style="left: {leftPct}%"
                  ></span>
                {/if}
              </span>
              <span
                class="text-base-content/60 shrink-0 text-right text-xs tabular-nums"
              >
                {row.durationMs !== null ? formatDuration(row.durationMs) : "—"}
              </span>
            </a>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>
