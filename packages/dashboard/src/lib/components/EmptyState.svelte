<script lang="ts">
  import IconInbox from "@tabler/icons-svelte/icons/inbox";

  let { message }: { message: string } = $props();
</script>

<div class="flex flex-col items-center justify-center gap-2 py-16">
  <IconInbox class="text-muted-foreground/40 size-10" />
  <p class="text-foreground text-sm font-medium">No entries yet</p>
  <p class="text-muted-foreground text-xs">{message}</p>
</div>
