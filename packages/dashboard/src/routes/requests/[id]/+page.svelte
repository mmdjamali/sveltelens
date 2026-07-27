<script lang="ts">
  import RequestDetail from '$lib/components/RequestDetail.svelte';
  import { store } from '$lib/store.svelte';

  let { data } = $props();

  // Entries streamed in after load() ran still belong in the related list.
  const related = $derived.by(() => {
    const byId = new Map(data.related.map((e) => [e.id, e]));
    for (const e of store.entries) {
      if (e.requestId && e.requestId === data.entry.requestId && e.id !== data.entry.id) byId.set(e.id, e);
    }
    return [...byId.values()].sort((a, b) => a.timestamp - b.timestamp);
  });
</script>

<RequestDetail entry={data.entry} {related} />
