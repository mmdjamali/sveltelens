<script lang="ts">
  import { store } from '$lib/store.svelte';
  import RequestsTable from '$lib/components/RequestsTable.svelte';
</script>

<RequestsTable entries={store.filtered('request')} />
