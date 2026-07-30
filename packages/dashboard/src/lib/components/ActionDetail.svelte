<script lang="ts">
  import {
    formatDuration,
    formatBytes,
    statusClass,
    methodClass,
    resultTypeClass,
  } from "../format";
  import type { Entry } from "../types";
  import { Badge } from "./ui/badge/index.js";
  import DetailShell from "./DetailShell.svelte";
  import DetailSection from "./DetailSection.svelte";
  import OverviewTable from "./OverviewTable.svelte";
  import OverviewRow from "./OverviewRow.svelte";
  import BodySection from "./BodySection.svelte";
  import KeyValueTable from "./KeyValueTable.svelte";
  import RelatedList from "./RelatedList.svelte";

  let {
    entry,
    related,
  }: { entry: Extract<Entry, { type: "action" }>; related: Entry[] } = $props();
</script>

<DetailShell {entry} title={entry.payload.actionName}>
  {#snippet overview()}
    <OverviewTable>
      <OverviewRow label="Method">
        <Badge variant="soft" class={methodClass(entry.payload.method)}
          >{entry.payload.method}</Badge
        >
      </OverviewRow>
      <OverviewRow label="Path" class="break-all font-mono text-xs">
        {entry.payload.path}
      </OverviewRow>
      <OverviewRow label="Route" class="break-all">
        {entry.payload.routeId ?? "—"}
      </OverviewRow>
      <OverviewRow label="Action">
        <Badge variant="soft" class={methodClass(entry.payload.method)}
          >{entry.payload.actionName}</Badge
        >
      </OverviewRow>
      <OverviewRow label="Status">
        <Badge variant="soft" class={statusClass(entry.payload.status)}
          >{entry.payload.status}</Badge
        >
      </OverviewRow>
      {#if entry.payload.resultType}
        <OverviewRow label="Result">
          <Badge variant="soft" class={resultTypeClass(entry.payload.resultType)}
            >{entry.payload.resultType}</Badge
          >
        </OverviewRow>
      {/if}
      <OverviewRow label="Duration">
        {formatDuration(entry.durationMs)}
      </OverviewRow>
      {#if entry.payload.location}
        <OverviewRow label="Redirect" class="break-all font-mono text-xs">
          {entry.payload.location}
        </OverviewRow>
      {/if}
      <OverviewRow label="Hostname" class="break-all">
        {entry.payload.hostname}
      </OverviewRow>
      <OverviewRow label="IP">{entry.payload.ip ?? "—"}</OverviewRow>
      <OverviewRow label="Memory usage">
        {entry.payload.memoryUsageBytes !== null
          ? formatBytes(entry.payload.memoryUsageBytes)
          : "—"}
      </OverviewRow>
    </OverviewTable>
  {/snippet}

  <DetailSection title="Headers">
    <KeyValueTable rows={Object.entries(entry.payload.requestHeaders)} />
  </DetailSection>

  <BodySection
    title="Request Payload"
    body={entry.payload.requestBody}
    emptyMessage="no request body"
  />

  <DetailSection title="Response Headers">
    <KeyValueTable rows={Object.entries(entry.payload.responseHeaders)} />
  </DetailSection>

  <BodySection
    title="Response"
    body={entry.payload.responseBody}
    emptyMessage="no response body"
  />

  <RelatedList {entry} {related} />
</DetailShell>
