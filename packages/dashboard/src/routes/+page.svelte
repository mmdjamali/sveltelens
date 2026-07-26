<script lang="ts">
  import { store } from '$lib/store.svelte';
  import EntryTable from '$lib/components/EntryTable.svelte';
</script>

<EntryTable entries={store.filtered('all')} />
