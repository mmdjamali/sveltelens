<script lang="ts">
  import { store } from '$lib/store.svelte';
  import LogsTable from '$lib/components/LogsTable.svelte';
</script>

<LogsTable entries={store.filtered('log')} />
