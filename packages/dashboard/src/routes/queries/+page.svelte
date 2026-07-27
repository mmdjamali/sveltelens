<script lang="ts">
  import { store } from "$lib/store.svelte";
  import QueriesTable from "$lib/components/QueriesTable.svelte";
  import IconSearch from "@tabler/icons-svelte/icons/search";

  let search = $state("");
</script>

<div class="card overflow-hidden rounded-lg border border-border bg-card">
  <div class="flex items-center justify-between border-b border-border bg-muted px-4 py-3">
    <h2 class="m-0 text-sm font-semibold">Queries</h2>
    <div class="relative w-48">
      <IconSearch class="text-muted-foreground pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2" />
      <input
        type="text"
        class="w-full rounded-md border border-border bg-card px-3 py-1.5 pl-8 text-xs text-foreground placeholder:text-muted-foreground"
        placeholder="Search Tag"
        bind:value={search}
      />
    </div>
  </div>
  <QueriesTable entries={store.filtered("query")} />
</div>
