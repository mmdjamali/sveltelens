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
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 80 80"
          class="size-7"
        >
          <path
            class="fill-primary"
            d="M0 40a39.87 39.87 0 0 1 11.72-28.28A40 40 0 1 1 0 40zm34 10a4 4 0 0 1-4-4v-2a2 2 0 1 0-4 0v2a4 4 0 0 1-4 4h-2a2 2 0 1 0 0 4h2a4 4 0 0 1 4 4v2a2 2 0 1 0 4 0v-2a4 4 0 0 1 4-4h2a2 2 0 1 0 0-4h-2zm24-24a6 6 0 0 1-6-6v-3a3 3 0 0 0-6 0v3a6 6 0 0 1-6 6h-3a3 3 0 0 0 0 6h3a6 6 0 0 1 6 6v3a3 3 0 0 0 6 0v-3a6 6 0 0 1 6-6h3a3 3 0 0 0 0-6h-3zm-4 36a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM21 28a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"
          />
        </svg>
        <strong class="text-lg font-semibold">Sveltecope</strong>
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
