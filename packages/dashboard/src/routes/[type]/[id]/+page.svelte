<script lang="ts">
  import { store } from "$lib/store.svelte";
  import { ENTRY_TYPE_META } from "$lib/entry-types";

  let { data } = $props();

  const Detail = $derived(ENTRY_TYPE_META[data.type].detail);

  // Entries streamed in after load() ran still belong in the related list.
  const related = $derived.by(() => {
    const byId = new Map(data.related.map((e) => [e.id, e]));
    for (const e of store.entries) {
      if (
        e.requestId &&
        e.requestId === data.entry.requestId &&
        e.id !== data.entry.id
      )
        byId.set(e.id, e);
    }
    return [...byId.values()].sort((a, b) => a.timestamp - b.timestamp);
  });
</script>

<Detail entry={data.entry} {related} />
