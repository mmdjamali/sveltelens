<script lang="ts">
  import ClientRequestDetail from '$lib/components/ClientRequestDetail.svelte';

  let { data } = $props();
</script>

<ClientRequestDetail entry={data.entry} />
