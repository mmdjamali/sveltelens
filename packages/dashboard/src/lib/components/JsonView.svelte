<script lang="ts">
  import { untrack } from 'svelte';
  import { prettyJson } from '../format';
  import { highlight } from '../highlight';
  import IconChevronDown from '@tabler/icons-svelte/icons/chevron-down';
  import IconChevronRight from '@tabler/icons-svelte/icons/chevron-right';

  let { text = null, collapsed = false }: { text: string | null; collapsed?: boolean } = $props();
  let open = $state(untrack(() => !collapsed));
  const html = $derived(text === null ? '' : highlight(prettyJson(text), 'json'));
</script>

{#if text === null}
  <p class="text-muted-foreground text-xs italic">no body</p>
{:else}
  <div class="bg-muted/40 rounded-md border">
    <button
      class="text-muted-foreground hover:text-foreground flex w-full items-center gap-1 px-3 py-1.5 text-left text-xs transition-colors"
      onclick={() => (open = !open)}
    >
      {#if open}
        <IconChevronDown class="size-3.5" />
      {:else}
        <IconChevronRight class="size-3.5" />
      {/if}
      {open ? 'Collapse' : 'Expand'}
    </button>
    {#if open}
      <pre class="overflow-x-auto px-3 pb-3 font-mono text-xs whitespace-pre-wrap">{@html html}</pre>
    {/if}
  </div>
{/if}
