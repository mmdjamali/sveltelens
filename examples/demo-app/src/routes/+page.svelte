<script lang="ts">
  import "../app.css";
  import { enhance } from "$app/forms";
  import { invalidateAll } from "$app/navigation";

  let { data } = $props();

  function submit() {
    return async ({ update }) => {
      await update();
      await invalidateAll();
    };
  }
</script>

<div class="mx-auto max-w-lg px-4 py-10">
  <div class="mb-8">
    <h1 class="text-2xl font-bold">sveltecope demo</h1>
    <p class="text-base-content/40 mt-1 text-xs">
      Mock API ping: <code class="font-mono">{JSON.stringify(data.ping)}</code>
    </p>
  </div>

  <div class="card bg-base-200 rounded-field overflow-hidden">
    <div class="flex items-center justify-between border-b border-base-300 bg-base-300 px-4 py-3">
      <h2 class="m-0 text-sm font-semibold">Add todo</h2>
    </div>
    <form method="POST" action="?/create" use:enhance={submit} class="flex gap-2 p-4">
      <input
        type="text"
        name="title"
        placeholder="What needs doing?"
        required
        class="input input-bordered input-sm flex-1"
      />
      <button class="btn btn-primary btn-sm">Add</button>
    </form>
  </div>

  <div class="card bg-base-200 rounded-field overflow-hidden mt-5">
    <div class="flex items-center justify-between border-b border-base-300 bg-base-300 px-4 py-3">
      <h2 class="m-0 text-sm font-semibold">Todos</h2>
      <span class="text-base-content/40 text-xs">{data.items.length} total</span>
    </div>
    <ul class="divide-base-300 divide-y">
      {#each data.items as item (item.id)}
        <li class="hover:bg-base-300/30 flex items-center gap-3 px-4 py-3 transition-colors">
          <form method="POST" action="?/toggle" use:enhance={submit}>
            <input type="hidden" name="id" value={item.id} />
            <button class="btn btn-ghost btn-xs btn-square text-base">
              {item.done ? '✅' : '⬜️'}
            </button>
          </form>
          <span class="flex-1 min-w-0 truncate text-sm {item.done ? 'text-base-content/30 line-through' : ''}">
            {item.title}
          </span>
          <form method="POST" action="?/delete" use:enhance={submit}>
            <input type="hidden" name="id" value={item.id} />
            <button
              class="btn btn-ghost btn-xs btn-square text-base-content/30 hover:text-error transition-colors"
              title="Delete"
            >✕</button>
          </form>
        </li>
      {:else}
        <li class="text-base-content/40 px-4 py-10 text-center text-sm">
          No todos yet. Add one above!
        </li>
      {/each}
    </ul>
    <div class="border-t border-base-300 px-4 py-3">
      <form method="POST" action="?/reset" use:enhance={submit} class="flex justify-center">
        <button class="btn btn-ghost btn-xs text-base-content/40">Reset todos</button>
      </form>
    </div>
  </div>

  <p class="text-base-content/30 mt-10 text-center text-xs">
    Open <a href="/__telescope" class="link link-hover text-primary">/__telescope</a>
    to see captured actions, requests, queries, and logs.
  </p>
</div>
