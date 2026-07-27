<script lang="ts">
  import { store } from '$lib/store.svelte';
  import QueriesTable from '$lib/components/QueriesTable.svelte';
</script>

<QueriesTable entries={store.filtered('query')} />
