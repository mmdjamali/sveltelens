<script lang="ts">
  import { store } from "$lib/store.svelte";
  import ActionsTable from "$lib/components/ActionsTable.svelte";
  import SearchBar from "$lib/components/SearchBar.svelte";
</script>

<div class="card rounded-field overflow-hidden pb-6">
  <div
    class="flex items-center justify-between border-b border-base-300 bg-base-300 rounded-box mb-4 ps-6 pe-3 py-3"
  >
    <h2 class="m-0 text-sm font-semibold">Actions</h2>
    <SearchBar bind:value={store.search} />
  </div>
  <ActionsTable entries={store.filtered("action")} />
</div>
