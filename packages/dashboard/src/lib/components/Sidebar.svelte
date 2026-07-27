<script lang="ts">
  import { base } from '$app/paths';
  import { page } from '$app/state';
  import { store } from '../store.svelte';
  import { ENTRY_TYPES, ENTRY_TYPE_LABELS, ENTRY_TYPE_ICONS, ENTRY_TYPE_SLUGS } from '../types';
  import * as Sidebar from './ui/sidebar/index.js';
  import IconTelescope from '@tabler/icons-svelte/icons/telescope';

  // route.id is the matched pattern (e.g. "/requests/[id]"), unaffected by the configurable base path.
  const current = $derived(page.route.id?.split('/')[1] ?? null);
</script>

<Sidebar.Root>
  <Sidebar.Header>
    <div class="flex items-center gap-2 px-2 py-1.5">
      <div class="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-lg">
        <IconTelescope class="size-4" />
      </div>
      <div class="grid flex-1 leading-tight">
        <span class="truncate text-sm font-semibold">Telescope</span>
        <span class="text-muted-foreground truncate text-xs">
          {store.connected ? 'Live' : 'Disconnected'}
        </span>
      </div>
      <span
        class="size-2 rounded-full {store.connected ? 'bg-emerald-500' : 'bg-muted-foreground/40'}"
        aria-hidden="true"
      ></span>
    </div>
  </Sidebar.Header>

  <Sidebar.Content>
    <Sidebar.Group>
      <Sidebar.GroupContent>
        <Sidebar.Menu>
          {#each ENTRY_TYPES as type (type)}
            {@const Icon = ENTRY_TYPE_ICONS[type]}
            <Sidebar.MenuItem>
              <Sidebar.MenuButton isActive={current === ENTRY_TYPE_SLUGS[type]}>
                {#snippet child({ props })}
                  <a href="{base}/{ENTRY_TYPE_SLUGS[type]}" {...props}>
                    <Icon />
                    <span>{ENTRY_TYPE_LABELS[type]}</span>
                  </a>
                {/snippet}
              </Sidebar.MenuButton>
              <Sidebar.MenuBadge>{store.counts[type]}</Sidebar.MenuBadge>
            </Sidebar.MenuItem>
          {/each}
        </Sidebar.Menu>
      </Sidebar.GroupContent>
    </Sidebar.Group>
  </Sidebar.Content>
</Sidebar.Root>
