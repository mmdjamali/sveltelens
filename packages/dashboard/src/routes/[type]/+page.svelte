<script lang="ts">
  import { store } from "$lib/store.svelte";
  import { ENTRY_TYPE_META } from "$lib/entry-types";
  import SearchBar from "$lib/components/SearchBar.svelte";

  let { data } = $props();

  const meta = $derived(ENTRY_TYPE_META[data.type]);
  const Table = $derived(meta.table);
</script>

<div class="card rounded-field overflow-hidden pb-6">
  <div
    class="flex items-center justify-between border-b border-base-300 bg-base-300 rounded-box mb-4 ps-6 pe-3 py-3"
  >
    <h2 class="m-0 text-sm font-semibold">{meta.label}</h2>
    <SearchBar bind:value={store.search} />
  </div>

  <Table type={data.type} entries={store.filtered(data.type)} />
</div>
