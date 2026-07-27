<script lang="ts">
  import ExceptionDetail from '$lib/components/ExceptionDetail.svelte';

  let { data } = $props();
</script>

<ExceptionDetail entry={data.entry} requestEntry={data.requestEntry} />
