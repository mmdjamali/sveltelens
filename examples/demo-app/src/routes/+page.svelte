<script lang="ts">
  let { data } = $props();
</script>

<h1>Telescope demo app</h1>

<p>Mock API ping: <code>{JSON.stringify(data.ping)}</code></p>

<h2>Todos (from Drizzle)</h2>
<ul>
  {#each data.items as item (item.id)}
    <li>{item.done ? '✅' : '⬜️'} {item.title}</li>
  {/each}
</ul>

<p>Open <a href="/__telescope">/__telescope</a> in dev mode to see this page's request, query, and outgoing fetch call.</p>
