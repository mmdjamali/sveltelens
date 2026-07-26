<script lang="ts">
  import { page } from '$app/state';
  import { store } from '$lib/store.svelte';
  import EntryTable from '$lib/components/EntryTable.svelte';
  import type { EntryType } from '$lib/types';

  const type = $derived(page.params.type as EntryType);
</script>

<EntryTable entries={store.filtered(type)} />
