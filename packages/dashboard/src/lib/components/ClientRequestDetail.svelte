<script lang="ts">
  import { base } from "$app/paths";
  import { formatBytes, entryTypeClass, statusClass, methodClass } from "../format";
  import DetailHeader from "./DetailHeader.svelte";
  import KeyValueTable from "./KeyValueTable.svelte";
  import BodyView from "./BodyView.svelte";
  import * as Tabs from "./ui/tabs/index.js";
  import { Badge } from "./ui/badge/index.js";
  import { ENTRY_TYPE_BADGE_LABELS, type Entry } from "../types";

  let { entry }: { entry: Extract<Entry, { type: "client-request" }> } = $props();

  let tab = $state<"request-headers" | "request-payload" | "response-headers" | "response">("request-payload");
  $effect(() => {
    entry.id;
    tab = "request-payload";
  });
</script>

<div class="bg-background flex h-full flex-col">
  <DetailHeader
    backHref="{base}/client-requests"
    badgeLabel={ENTRY_TYPE_BADGE_LABELS["client-request"]}
    badgeClass={entryTypeClass("client-request")}
    title={entry.payload.url}
    timestamp={entry.timestamp}
    durationMs={entry.durationMs}
  />

  <div class="border-b p-4">
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
            <td class="text-muted-foreground bg-muted/20 w-44 shrink-0 px-3 py-2 align-top font-medium">Status</td>
            <td class="px-3 py-2">
              {#if entry.payload.status !== null}
                <Badge variant="soft" class={statusClass(entry.payload.status)}>{entry.payload.status}</Badge>
              {:else}
                —
              {/if}
            </td>
          </tr>
          {#if entry.payload.error}
            <tr class="border-b last:border-0">
              <td class="text-muted-foreground bg-muted/20 w-44 shrink-0 px-3 py-2 align-top font-medium">Error</td>
              <td class="text-destructive px-3 py-2 break-all">{entry.payload.error}</td>
            </tr>
          {/if}
        </tbody>
      </table>
    </div>
  </div>

  <Tabs.Root bind:value={tab} class="flex min-h-0 flex-1 flex-col gap-0">
    <div class="border-b px-4">
      <Tabs.List variant="line" class="h-auto gap-5 p-0">
        <Tabs.Trigger value="request-headers" class="px-0 py-2.5">Request Headers</Tabs.Trigger>
        <Tabs.Trigger value="request-payload" class="px-0 py-2.5">Request Payload</Tabs.Trigger>
        <Tabs.Trigger value="response-headers" class="px-0 py-2.5">Response Headers</Tabs.Trigger>
        <Tabs.Trigger value="response" class="px-0 py-2.5">Response</Tabs.Trigger>
      </Tabs.List>
    </div>

    <div class="min-h-0 flex-1 overflow-auto p-4">
      <Tabs.Content value="request-headers">
        <KeyValueTable rows={Object.entries(entry.payload.requestHeaders)} />
      </Tabs.Content>

      <Tabs.Content value="request-payload">
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
</div>
