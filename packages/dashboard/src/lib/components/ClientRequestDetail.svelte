<script lang="ts">
  import { statusClass, methodClass } from "../format";
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
  }: {
    entry: Extract<Entry, { type: "client-request" | "browser-request" }>;
    related: Entry[];
  } =
    $props();
</script>

<DetailShell {entry} title={entry.payload.url}>
  {#snippet overview()}
    <OverviewTable class="border-t border-base-300">
      <OverviewRow label="Method">
        <Badge variant="soft" class={methodClass(entry.payload.method)}
          >{entry.payload.method}</Badge
        >
      </OverviewRow>
      <OverviewRow label="Status">
        {#if entry.payload.status !== null}
          <Badge variant="soft" class={statusClass(entry.payload.status)}
            >{entry.payload.status}</Badge
          >
        {:else}
          —
        {/if}
      </OverviewRow>
      {#if entry.payload.error}
        <OverviewRow label="Error" class="text-error break-all">
          {entry.payload.error}
        </OverviewRow>
      {/if}
    </OverviewTable>
  {/snippet}

  <DetailSection title="Request Headers">
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
