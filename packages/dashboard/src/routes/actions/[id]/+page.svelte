<script lang="ts">
  import ActionDetail from '$lib/components/ActionDetail.svelte';

  let { data } = $props();
</script>

<ActionDetail entry={data.entry} related={data.related} />
