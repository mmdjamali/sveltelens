<script lang="ts">
  import { store } from "$lib/store.svelte";
  import RequestsTable from "$lib/components/RequestsTable.svelte";
  import IconSearch from "@tabler/icons-svelte/icons/search";

  let search = $state("");
</script>

<div class="card bg-base-200">
  <div
    class="flex items-center justify-between border-b border-base-300 bg-base-300 px-4 py-3"
  >
    <h2 class="m-0 text-sm font-semibold">Requests</h2>
    <div class="relative w-48">
      <IconSearch
        class="text-base-content/60 z-1 pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2"
      />
      <input
        type="text"
        class="input w-full pl-8 text-xs"
        placeholder="Search Tag"
        bind:value={search}
      />
    </div>
  </div>
  <RequestsTable entries={store.filtered("request")} />
</div>
