<script lang="ts">
  import { prettyJson } from "../format";
  import { highlight, languageFor, type Language } from "../highlight";

  let {
    text = null,
    contentType = "application/json",
  }: { text: string | null; contentType?: string | null } = $props();

  const isHtml = $derived(/html/i.test(contentType ?? ""));
  const language = $derived<Language | null>(languageFor(contentType));
  const source = $derived(
    language === "json" ? prettyJson(text) : (text ?? ""),
  );
  const html = $derived(language === null ? "" : highlight(source, language));
</script>

{#if text === null}
  <p class="text-base-content/60 text-xs italic">{"(NO BODY)"}</p>
{:else if isHtml}
  <p class="text-base-content/60 text-xs italic">{"(HTML RESPONSE)"}</p>
{:else}
  <pre
    class="text-xs whitespace-pre-wrap">{#if language === null}{source}{:else}{@html html}{/if}</pre>
{/if}
