<script lang="ts">
  import LogDetail from '$lib/components/LogDetail.svelte';

  let { data } = $props();
</script>

<LogDetail entry={data.entry} />
