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

  const isDetail = $derived(page.route.id?.endsWith("/[id]") ?? false);
</script>

<div class="min-h-screen bg-base-100">
  <header class="border-b bg-base-100 border-base-300 sticky top-0 z-50">
    <div class="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
      <a href={base} class="flex items-center gap-3">
        <img src="{base}/logo.svg" alt="" class="size-7" />
        <strong class="text-lg font-semibold">Sveltelens</strong>
      </a>

      {#if !isDetail}
        <div class="flex items-center gap-2">
          <button
            class="btn btn-ghost btn-square text-primary border border-base-300"
            onclick={() => store.togglePause()}
            title={store.paused ? "Resume recording" : "Pause recording"}
          >
            {#if store.paused}
              <IconPlayerPlay class="size-5" />
            {:else}
              <IconPlayerPause class="size-5" />
            {/if}
          </button>
          <button
            class="btn btn-ghost btn-square text-error border border-base-300"
            onclick={() => store.clear()}
            title="Clear entries"
          >
            <IconTrash class="size-5" />
          </button>
        </div>
      {/if}
    </div>
  </header>

  <div class="mx-auto relative flex max-w-6xl gap-8 px-4 pt-6">
    <nav class="w-52 h-fit shrink-0 block sticky top-20.25">
      <AppSidebar />
    </nav>
    <main class="w-full min-w-0">
      {@render children()}
    </main>
  </div>
</div>
