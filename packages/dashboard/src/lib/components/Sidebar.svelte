<script lang="ts">
  import { base } from "$app/paths";
  import { page } from "$app/state";
  import { ENTRY_TYPES, ENTRY_TYPE_LABELS, ENTRY_TYPE_ICONS, ENTRY_TYPE_SLUGS } from "../types";

  const current = $derived(page.route.id?.split("/")[1] ?? null);
</script>

<ul class="flex flex-col gap-0.5">
  {#each ENTRY_TYPES as type (type)}
    {@const Icon = ENTRY_TYPE_ICONS[type]}
    {@const slug = ENTRY_TYPE_SLUGS[type]}
    {@const active = current === slug}
    <li>
      <a
        href="{base}/{slug}"
        class="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors {active ? 'text-indigo-300 bg-accent' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}"
      >
        <Icon
          class="size-5 shrink-0 {active ? 'text-indigo-400' : 'text-muted-foreground'}"
        />
        <span>{ENTRY_TYPE_LABELS[type]}</span>
      </a>
    </li>
  {/each}
</ul>
