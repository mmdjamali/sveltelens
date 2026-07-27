<script lang="ts">
  let { rows }: { rows: [string, string][] } = $props();
</script>

<div class="overflow-hidden rounded-box border border-base-300">
  <table class="table w-full text-xs">
    <tbody>
      {#each rows as [k, v] (k)}
        <tr class="border-b border-base-300 last:border-0">
          <td class="text-base-content/60 bg-base-300/20 w-44 shrink-0 px-3 py-2 align-top font-medium">{k}</td>
          <td class="px-3 py-2 break-all">{v}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
