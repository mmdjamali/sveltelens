<script lang="ts">
  import IconInbox from "@tabler/icons-svelte/icons/inbox";

  let { message }: { message: string } = $props();
</script>

<div class="flex flex-col items-center justify-center gap-2 py-16">
  <IconInbox class="text-base-content opacity-30 size-10" />
  <p class="text-base-content text-sm font-medium">No entries yet</p>
  <p class="text-base-content/60 text-xs">{message}</p>
</div>
