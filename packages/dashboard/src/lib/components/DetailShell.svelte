<script lang="ts">
  import { base } from "$app/paths";
  import type { Snippet } from "svelte";
  import { entryTypeClass } from "../format";
  import { ENTRY_TYPE_META } from "../entry-types";
  import type { Entry } from "../types";
  import DetailHeader from "./DetailHeader.svelte";

  import ArrowLeftIcon from "@lucide/svelte/icons/arrow-left";

  let {
    entry,
    badgeLabel,
    badgeClass,
    title,
    overview,
    children,
  }: {
    entry: Entry;
    /** Defaults to the entry type's own badge. Logs and exceptions show the level/class instead. */
    badgeLabel?: string;
    badgeClass?: string;
    title?: string;
    /** Rendered inside the first card, under the header. */
    overview?: Snippet;
    /** Further cards below it. */
    children?: Snippet;
  } = $props();

  const meta = $derived(ENTRY_TYPE_META[entry.type]);
</script>

<a href="{base}/{meta.slug}" class="btn btn-ghost border-base-300 mb-5">
  <ArrowLeftIcon class="size-4" />
  Back
</a>

<div class="mx-auto max-w-6xl pb-6">
  <div class="card bg-base-200 rounded-field overflow-hidden">
    <DetailHeader
      badgeLabel={badgeLabel ?? meta.badgeLabel}
      badgeClass={badgeClass ?? entryTypeClass(entry.type)}
      {title}
      timestamp={entry.timestamp}
      durationMs={entry.durationMs}
    />
    {@render overview?.()}
  </div>

  {@render children?.()}
</div>
