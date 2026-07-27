<script lang="ts">
  import IconSearch from "@tabler/icons-svelte/icons/search";

  let {
    value = $bindable(""),
    placeholder = "Search Tag",
  }: { value?: string; placeholder?: string } = $props();
</script>

<div class="relative w-64">
  <IconSearch
    class="text-base-content/60 z-1 pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2"
  />
  <input
    type="text"
    class="input w-full pl-10 text-xs outline-none"
    {placeholder}
    bind:value
  />
</div>
