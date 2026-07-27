<script lang="ts">
  import { store } from '$lib/store.svelte';
  import ExceptionsTable from '$lib/components/ExceptionsTable.svelte';
</script>

<ExceptionsTable entries={store.filtered('exception')} />
