<script lang="ts">
  import { base } from "$app/paths";
  import {
    formatDuration,
    entryTypeClass,
    entryTypeBarClass,
    entrySummary,
  } from "../format";
  import { ENTRY_TYPE_META } from "../entry-types";
  import type { Entry } from "../types";
  import { Badge } from "./ui/badge/index.js";
  import DetailSection from "./DetailSection.svelte";

  let { entry, related }: { entry: Entry; related: Entry[] } = $props();

  // Bars are drawn as a percentage of the widest thing on screen, which is
  // normally the request itself but may be a child that outlived it.
  const totalMs = $derived(
    Math.max(
      1,
      entry.durationMs ?? 0,
      ...related.map((e) => (e.offsetMs ?? 0) + (e.durationMs ?? 0)),
    ),
  );
  const rows = $derived(
    [...related].sort((a, b) => (a.offsetMs ?? 0) - (b.offsetMs ?? 0)),
  );
</script>

<DetailSection
  title="Related entries {related.length ? `(${related.length})` : ''}"
>
  <div class="p-4">
    {#if rows.length === 0}
      <p class="text-base-content/60 text-xs italic">
        no related entries for this {ENTRY_TYPE_META[
          entry.type
        ].badgeLabel.toLowerCase()}
      </p>
    {:else}
      <div class="space-y-1">
        {#each rows as row (row.id)}
          {@const leftPct = ((row.offsetMs ?? 0) / totalMs) * 100}
          {@const widthPct =
            row.durationMs !== null
              ? Math.max((row.durationMs / totalMs) * 100, 0.6)
              : 0}
          <a
            href="{base}/{ENTRY_TYPE_META[row.type].slug}/{row.id}"
            class="hover:bg-base-300 grid grid-cols-[minmax(0,240px)_1fr_3.5rem] items-center gap-3 rounded-md px-2 py-1.5 text-left transition-colors"
            title="{ENTRY_TYPE_META[row.type].badgeLabel} · offset {row.offsetMs !==
            null
              ? formatDuration(row.offsetMs)
              : '-'} · duration {formatDuration(row.durationMs)}"
          >
            <span class="flex min-w-0 items-center gap-1.5">
              <Badge
                variant="soft"
                class="shrink-0 tracking-wide uppercase {entryTypeClass(
                  row.type,
                )}"
              >
                {ENTRY_TYPE_META[row.type].badgeLabel}
              </Badge>
              <span class="min-w-0 truncate text-xs" title={entrySummary(row)}
                >{entrySummary(row)}</span
              >
            </span>
            <span
              class="bg-base-300/40 relative h-2 w-full overflow-hidden rounded-full"
            >
              {#if row.durationMs !== null}
                <span
                  class="absolute inset-y-0 rounded-full {entryTypeBarClass(
                    row.type,
                  )}"
                  style="left: {leftPct}%; width: {widthPct}%"
                ></span>
              {:else}
                <span
                  class="absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full {entryTypeBarClass(
                    row.type,
                  )}"
                  style="left: {leftPct}%"
                ></span>
              {/if}
            </span>
            <span
              class="text-base-content/60 shrink-0 text-right text-xs tabular-nums"
            >
              {row.durationMs !== null ? formatDuration(row.durationMs) : "—"}
            </span>
          </a>
        {/each}
      </div>
    {/if}
  </div>
</DetailSection>
