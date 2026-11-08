<script lang="ts">
  import { splitTail } from '$lib/format';

  let { text }: { text: string } = $props();
  const parts = $derived(splitTail(text));
</script>

<!-- ponytail: the head truncates with CSS, the tail never shrinks; no width measuring. -->
<span class="flex min-w-0" title={text}>
  <span class="truncate">{parts[0]}</span>
  <span class="shrink-0 whitespace-pre">{parts[1]}</span>
</span>
