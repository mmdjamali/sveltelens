<script lang="ts">
  import { base } from "$app/paths";
  import { page } from "$app/state";
  import { ENTRY_TYPES, ENTRY_TYPE_META } from "../entry-types";

  const current = $derived(page.params.type ?? null);
</script>

<ul class="flex flex-col gap-0.5">
  {#each ENTRY_TYPES as type (type)}
    {@const meta = ENTRY_TYPE_META[type]}
    {@const Icon = meta.icon}
    {@const slug = meta.slug}
    {@const active = current === slug}
    <li>
      <a
        href="{base}/{slug}"
        class="flex items-center gap-3 rounded-field px-3 py-2 text-sm transition-colors {active
          ? 'text-primary bg-base-300'
          : 'text-base-content/60 hover:text-base-content hover:bg-base-300'}"
      >
        <Icon
          class="size-5 shrink-0 {active
            ? 'text-primary'
            : 'text-base-content opacity-60'}"
        />
        <span>{meta.label}</span>
      </a>
    </li>
  {/each}
</ul>
