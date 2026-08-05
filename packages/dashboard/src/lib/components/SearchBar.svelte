<script lang="ts">
  import IconSearch from "@tabler/icons-svelte/icons/search";

  let {
    value = $bindable(""),
    placeholder = "Search Tag",
    debounceMs = 200,
  }: { value?: string; placeholder?: string; debounceMs?: number } = $props();

  let localValue = $state(value);
  let timer: ReturnType<typeof setTimeout> | undefined;

  function handleInput(e: Event) {
    localValue = (e.target as HTMLInputElement).value;
    clearTimeout(timer);
    timer = setTimeout(() => {
      value = localValue;
    }, debounceMs);
  }
</script>

<div class="relative w-64">
  <IconSearch
    class="text-base-content/60 z-1 pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2"
  />
  <input
    type="text"
    class="input w-full pl-10 text-xs outline-none"
    {placeholder}
    value={localValue}
    oninput={handleInput}
  />
</div>
