<script lang="ts">
  import "../app.css";
  import { onMount } from "svelte";
  import { page } from "$app/state";
  import { base } from "$app/paths";
  import { store } from "$lib/store.svelte";
  import AppSidebar from "$lib/components/Sidebar.svelte";
  import IconPlayerPause from "@tabler/icons-svelte/icons/player-pause";
  import IconPlayerPlay from "@tabler/icons-svelte/icons/player-play";
  import IconTrash from "@tabler/icons-svelte/icons/trash";

  let { children } = $props();

  onMount(() => {
    store.init();
  });

  // Every list route is "/<slug>"; every detail route is "/<slug>/[id]".
  const isDetail = $derived(page.route.id?.endsWith("/[id]") ?? false);
</script>

<Sidebar.Provider class="h-svh overflow-hidden">
  <AppSidebar />

  <Sidebar.Inset class="min-w-0 overflow-hidden">
    <header class="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <Sidebar.Trigger class="-ml-1" />
      <Separator orientation="vertical" class="mr-1 !h-4" />
      {#if !isDetail}
        <div class="relative w-full max-w-xs">
          <IconSearch
            class="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
          />
          <Input
            class="h-10 pl-8"
            placeholder="Search entries…"
            bind:value={store.search}
          />
        </div>
        <Button variant="ghost" size="icon" class="ml-auto" onclick={() => store.togglePause()}>
          {#if store.paused}
            <IconPlayerPlay class="size-4" />
            <span class="sr-only">Resume recording</span>
          {:else}
            <IconPlayerPause class="size-4" />
            <span class="sr-only">Pause recording</span>
          {/if}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          class="text-destructive hover:text-destructive hover:bg-destructive/10"
          onclick={() => store.clear()}
        >
          <IconTrash class="size-4" />
          <span class="sr-only">Clear entries</span>
        </Button>
      {/if}
    </header>

    <div class="min-h-0 flex-1 overflow-auto">
      {@render children()}
    </div>
  </Sidebar.Inset>
</Sidebar.Provider>
