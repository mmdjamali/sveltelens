<script lang="ts">
  import { base } from '$app/paths';
  import { page } from '$app/state';
  import { store } from '../store.svelte';
  import { ENTRY_TYPES, ENTRY_TYPE_LABELS, ENTRY_TYPE_ICONS } from '../types';
  import * as Sidebar from './ui/sidebar/index.js';
  import IconListDetails from '@tabler/icons-svelte/icons/list-details';
  import IconPlayerPause from '@tabler/icons-svelte/icons/player-pause';
  import IconPlayerPlay from '@tabler/icons-svelte/icons/player-play';
  import IconTelescope from '@tabler/icons-svelte/icons/telescope';
  import IconTrash from '@tabler/icons-svelte/icons/trash';

  const total = $derived(Object.values(store.counts).reduce((a, b) => a + b, 0));
  const current = $derived(page.params.type ?? (page.route.id === '/' ? 'all' : null));
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
      <Sidebar.GroupLabel>Entries</Sidebar.GroupLabel>
      <Sidebar.GroupContent>
        <Sidebar.Menu>
          <Sidebar.MenuItem>
            <Sidebar.MenuButton isActive={current === 'all'}>
              {#snippet child({ props })}
                <a href="{base}/" {...props}>
                  <IconListDetails />
                  <span>All entries</span>
                </a>
              {/snippet}
            </Sidebar.MenuButton>
            <Sidebar.MenuBadge>{total}</Sidebar.MenuBadge>
          </Sidebar.MenuItem>

          {#each ENTRY_TYPES as type (type)}
            {@const Icon = ENTRY_TYPE_ICONS[type]}
            <Sidebar.MenuItem>
              <Sidebar.MenuButton isActive={current === type}>
                {#snippet child({ props })}
                  <a href="{base}/{type}" {...props}>
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

  <Sidebar.Footer>
    <Sidebar.Menu>
      <Sidebar.MenuItem>
        <Sidebar.MenuButton onclick={() => store.togglePause()}>
          {#if store.paused}
            <IconPlayerPlay />
            <span>Resume stream</span>
          {:else}
            <IconPlayerPause />
            <span>Pause stream</span>
          {/if}
        </Sidebar.MenuButton>
      </Sidebar.MenuItem>
      <Sidebar.MenuItem>
        <Sidebar.MenuButton
          class="text-destructive hover:text-destructive hover:bg-destructive/10"
          onclick={() => store.clear()}
        >
          <IconTrash />
          <span>Clear entries</span>
        </Sidebar.MenuButton>
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  </Sidebar.Footer>
</Sidebar.Root>
