<script lang="ts">
  import { store } from "$lib/store.svelte";
  import RequestsTable from "$lib/components/RequestsTable.svelte";
  import SearchBar from "$lib/components/SearchBar.svelte";
</script>

<div class="card bg-base-200">
  <div class="flex items-center justify-between border-b border-base-300 bg-base-300 px-4 py-3">
    <h2 class="m-0 text-sm font-semibold">Requests</h2>
    <SearchBar bind:value={store.search} />
  </div>
  <RequestsTable entries={store.filtered("request")} />
</div>
