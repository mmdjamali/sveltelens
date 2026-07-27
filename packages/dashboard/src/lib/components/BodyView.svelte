<script lang="ts">
  import { untrack } from 'svelte';
  import { prettyJson } from '../format';
  import { highlight, languageFor, type Language } from '../highlight';
  import IconChevronDown from '@tabler/icons-svelte/icons/chevron-down';
  import IconChevronRight from '@tabler/icons-svelte/icons/chevron-right';

  let {
    text = null,
    contentType = 'application/json',
    collapsed = false,
  }: { text: string | null; contentType?: string | null; collapsed?: boolean } = $props();

  let open = $state(untrack(() => !collapsed));

  const language = $derived<Language | null>(languageFor(contentType));
  const source = $derived(language === 'json' ? prettyJson(text) : (text ?? ''));
  const html = $derived(language === null ? '' : highlight(source, language));
</script>

{#if text === null}
  <p class="text-base-content/60 text-xs italic">no body</p>
{:else}
  <div class="bg-base-300/40 rounded-box border border-base-300">
    <button
      class="text-base-content/60 hover:text-base-content flex w-full items-center gap-1 px-3 py-1.5 text-left text-xs transition-colors"
      onclick={() => (open = !open)}
    >
      {#if open}
        <IconChevronDown class="size-3.5" />
      {:else}
        <IconChevronRight class="size-3.5" />
      {/if}
      {open ? 'Collapse' : 'Expand'}
      <span class="ml-auto text-[10px] tracking-wide uppercase">{language ?? 'text'}</span>
    </button>
    {#if open}
      <pre class="overflow-x-auto px-3 pb-3 font-mono text-xs whitespace-pre-wrap">{#if language === null}{source}{:else}{@html html}{/if}</pre>
    {/if}
  </div>
{/if}
