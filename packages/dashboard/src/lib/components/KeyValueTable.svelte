<script lang="ts">
  let { rows }: { rows: [string, string][] } = $props();
</script>

<div class="table-responsive">
  <table class="w-full border-collapse text-sm">
    <tbody>
      {#each rows as [k, v] (k)}
        <tr class="border-b border-base-300 last:border-0">
          <td class="text-base-content/60 w-44 px-4 py-2.5 align-top">{k}</td>
          <td class="px-4 py-2.5 break-all">{v}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
