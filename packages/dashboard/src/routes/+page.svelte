<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { store } from '$lib/store.svelte';
  import AppSidebar from '$lib/components/Sidebar.svelte';
  import EntryTable from '$lib/components/EntryTable.svelte';
  import EntryDetail from '$lib/components/EntryDetail.svelte';
  import * as Sidebar from '$lib/components/ui/sidebar/index.js';
  import * as Select from '$lib/components/ui/select/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Separator } from '$lib/components/ui/separator/index.js';
  import IconSearch from '@tabler/icons-svelte/icons/search';

  onMount(() => {
    store.init();
  });

  const methods = ['all', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
</script>

<Sidebar.Provider class="h-svh overflow-hidden">
  <AppSidebar />

  <Sidebar.Inset class="min-w-0 overflow-hidden">
    <header class="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <Sidebar.Trigger class="-ml-1" />
      <Separator orientation="vertical" class="mr-1 !h-4" />
      <div class="relative w-full max-w-xs">
        <IconSearch class="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
        <Input class="h-10 pl-8" placeholder="Search entries…" bind:value={store.search} />
      </div>
      <Select.Root type="single" bind:value={store.methodFilter}>
        <Select.Trigger class="ml-auto w-36">
          {store.methodFilter === 'all' ? 'All methods' : store.methodFilter}
        </Select.Trigger>
        <Select.Content>
          {#each methods as m (m)}
            <Select.Item value={m} label={m === 'all' ? 'All methods' : m} />
          {/each}
        </Select.Content>
      </Select.Root>
    </header>

    <div class="flex min-h-0 flex-1">
      <div class="min-w-0 flex-1 overflow-auto">
        <EntryTable />
      </div>
      {#if store.selectedEntry}
        <div class="w-[420px] shrink-0 border-l">
          <EntryDetail />
        </div>
      {/if}
    </div>
  </Sidebar.Inset>
</Sidebar.Provider>
