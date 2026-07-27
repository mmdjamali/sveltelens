<script lang="ts">
  import QueryDetail from '$lib/components/QueryDetail.svelte';

  let { data } = $props();
</script>

<QueryDetail entry={data.entry} />
