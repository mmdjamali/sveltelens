<script lang="ts" generics="T">
  import { base } from "$app/paths";
  import { goto } from "$app/navigation";
  import type { Snippet } from "svelte";
  import type { EntryType } from "../types";
  import { ENTRY_TYPE_META } from "../entry-types";
  import * as Table from "./ui/table/index.js";
  import EmptyState from "./EmptyState.svelte";

  let {
    type,
    rows,
    id,
    columns,
    cells,
  }: {
    type: EntryType;
    /** Usually the entries themselves, but a table may group or reshape them first. */
    rows: T[];
    /** The entry id a row links to. */
    id: (row: T) => string;
    columns: { label: string; class?: string }[];
    cells: Snippet<[T]>;
  } = $props();

  const meta = $derived(ENTRY_TYPE_META[type]);
</script>

<Table.Root class="rounded-field overflow-hidden bg-base-200">
  <Table.Header class="bg-base-300">
    <Table.Row>
      {#each columns as column (column.label)}
        <Table.Head
          class="text-base-content/60 text-xs tracking-wider uppercase {column.class ??
            ''}">{column.label}</Table.Head
        >
      {/each}
    </Table.Row>
  </Table.Header>

  <Table.Body>
    {#each rows as row (id(row))}
      <Table.Row
        class="h-11 cursor-pointer"
        onclick={() => goto(`${base}/${meta.slug}/${id(row)}`)}
      >
        {@render cells(row)}
      </Table.Row>
    {:else}
      <Table.Row>
        <Table.Cell colspan={columns.length}>
          <EmptyState message={meta.emptyMessage} />
        </Table.Cell>
      </Table.Row>
    {/each}
  </Table.Body>
</Table.Root>
