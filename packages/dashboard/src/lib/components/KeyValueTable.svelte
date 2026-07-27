<script lang="ts">
  let { rows }: { rows: [string, string][] } = $props();
</script>

<table class="w-full text-xs">
  <tbody>
    {#each rows as [k, v] (k)}
      <tr class="border-b last:border-0">
        <td class="text-muted-foreground bg-muted/20 w-44 shrink-0 px-3 py-2 align-top font-medium">{k}</td>
        <td class="px-3 py-2 break-all">{v}</td>
      </tr>
    {/each}
  </tbody>
</table>
