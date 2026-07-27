<script lang="ts">
  import { store } from '$lib/store.svelte';
  import ClientRequestsTable from '$lib/components/ClientRequestsTable.svelte';
</script>

<ClientRequestsTable entries={store.filtered('client-request')} />
