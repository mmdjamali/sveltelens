<script lang="ts">
  import { base } from "$app/paths";
  import { formatBytes, entryTypeClass, statusClass, methodClass } from "../format";
  import DetailHeader from "./DetailHeader.svelte";
  import KeyValueTable from "./KeyValueTable.svelte";
  import BodyView from "./BodyView.svelte";
  import { Badge } from "./ui/badge/index.js";
  import { ENTRY_TYPE_BADGE_LABELS, type Entry } from "../types";

  let { entry }: { entry: Extract<Entry, { type: "client-request" }> } = $props();
</script>

<div class="mx-auto max-w-[1140px] px-4 pt-6">
  <div class="card bg-base-200">
    <DetailHeader
      backHref="{base}/client-requests"
      backLabel="HTTP Client"
      badgeLabel={ENTRY_TYPE_BADGE_LABELS["client-request"]}
      badgeClass={entryTypeClass("client-request")}
      title={entry.payload.url}
      timestamp={entry.timestamp}
      durationMs={entry.durationMs}
    />

    <div class="table-responsive border-t border-base-300">
      <table class="w-full border-collapse text-sm">
        <tbody>
          <tr class="border-b border-base-300">
            <td class="text-base-content/60 w-44 px-4 py-2.5 align-top">Method</td>
            <td class="px-4 py-2.5">
              <Badge variant="soft" class={methodClass(entry.payload.method)}>{entry.payload.method}</Badge>
            </td>
          </tr>
          <tr class="border-b border-base-300">
            <td class="text-base-content/60 w-44 px-4 py-2.5 align-top">Status</td>
            <td class="px-4 py-2.5">
              {#if entry.payload.status !== null}
                <Badge variant="soft" class={statusClass(entry.payload.status)}>{entry.payload.status}</Badge>
              {:else}
                —
              {/if}
            </td>
          </tr>
          {#if entry.payload.error}
            <tr class="border-b border-base-300">
              <td class="text-base-content/60 w-44 px-4 py-2.5 align-top">Error</td>
              <td class="text-error px-4 py-2.5 break-all">{entry.payload.error}</td>
            </tr>
          {/if}
        </tbody>
      </table>
    </div>
  </div>

  <!-- Request Headers -->
  <div class="card mt-5 bg-base-200">
    <div class="flex items-center justify-between border-b border-base-300 bg-base-300 px-4 py-3">
      <h2 class="m-0 text-sm font-semibold">Request Headers</h2>
    </div>
    <KeyValueTable rows={Object.entries(entry.payload.requestHeaders)} />
  </div>

  <!-- Request Payload -->
  <div class="card mt-5 bg-base-200">
    <div class="flex items-center justify-between border-b border-base-300 bg-base-300 px-4 py-3">
      <h2 class="m-0 text-sm font-semibold">Request Payload</h2>
    </div>
    <div class="p-4">
      {#if entry.payload.requestBody}
        {#if entry.payload.requestBody.truncated}
          <p class="mb-2 text-xs text-warning">
            truncated ({formatBytes(entry.payload.requestBody.size)})
          </p>
        {/if}
        <BodyView text={entry.payload.requestBody.text} contentType={entry.payload.requestBody.contentType} />
      {:else}
        <p class="text-base-content/60 text-xs italic">no request body</p>
      {/if}
    </div>
  </div>

  <!-- Response Headers -->
  <div class="card mt-5 bg-base-200">
    <div class="flex items-center justify-between border-b border-base-300 bg-base-300 px-4 py-3">
      <h2 class="m-0 text-sm font-semibold">Response Headers</h2>
    </div>
    <KeyValueTable rows={Object.entries(entry.payload.responseHeaders)} />
  </div>

  <!-- Response -->
  <div class="card mt-5 bg-base-200">
    <div class="flex items-center justify-between border-b border-base-300 bg-base-300 px-4 py-3">
      <h2 class="m-0 text-sm font-semibold">Response</h2>
    </div>
    <div class="p-4">
      {#if entry.payload.responseBody}
        {#if entry.payload.responseBody.truncated}
          <p class="mb-2 text-xs text-warning">
            truncated ({formatBytes(entry.payload.responseBody.size)})
          </p>
        {/if}
        <BodyView text={entry.payload.responseBody.text} contentType={entry.payload.responseBody.contentType} />
      {:else}
        <p class="text-base-content/60 text-xs italic">no response body</p>
      {/if}
    </div>
  </div>
</div>
