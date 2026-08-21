<script lang="ts">
  import DiffNode from "./DiffNode.svelte";
  import type { DiffNode as DiffNodeType } from "$lib/jsonDiff";
  import { formatValue } from "$lib/formatValue";

  const tones = [
    '#f2c879',
    '#8ab4ff',
    '#c9a7ff',
    '#7ed6a5',
    '#f8b26a',
    '#f38ba8',
  ];

  let {
    node,
    side = "old",
    depth = 0,
  }: { node: DiffNodeType; side: "old" | "new"; depth?: number } = $props();

  const val = $derived(side === "old" ? node.oldValue : node.newValue);
  const propCls = $derived(node.status === "added" && side === "new" ? "diff-added" : node.status === "removed" && side === "old" ? "diff-removed" : "");
  const statusCls = $derived(node.status === "changed" ? (side === "new" ? "diff-added" : "diff-removed") : propCls);
</script>

{#if val !== null && typeof val === "object"}
  {@const isArr = Array.isArray(val)}
  {@const count = isArr
    ? (val as unknown[]).length
    : Object.keys(val as Record<string, unknown>).length}
  {@const open = isArr ? "[" : "{"}
  {@const close = isArr ? "]" : "}"}
  {@const visible = (node.children ?? []).filter((c) =>
    side === "old" ? c.status !== "added" : c.status !== "removed",
  )}
  {@const ordered = isArr
    ? visible
    : visible
        .slice()
        .sort(
          (a, b) =>
            Object.keys(val as Record<string, unknown>).indexOf(a.key) -
            Object.keys(val as Record<string, unknown>).indexOf(b.key),
        )}
  <details class="block" open style:--bc={tones[depth % tones.length]}>
      <summary class="opener {propCls}">
        {#if node.key !== "root"}
          <span class="key">{node.key}</span>
          <span class="colon">:&nbsp;</span>
        {/if}
        <span class="bracket">{open}</span>
        <span class="collapsed-hint"
          >{count}
          {isArr
            ? count === 1
              ? "item"
              : "items"
            : count === 1
              ? "key"
              : "keys"}</span
        >
        <span class="inline-close bracket">{close}</span>
      </summary>
      <div class="children">
        {#each ordered as child, i (i)}
          <DiffNode node={child} {side} depth={depth + 1} />
        {/each}
      </div>
      <div class="closer">
        <span class="bracket">{close}</span>
      </div>
    </details>
  {:else}
    <div class="leaf {statusCls}">
      {#if node.key !== "root"}
        <span class="key">{node.key}</span>
        <span class="colon">:&nbsp;</span>
      {/if}
      <span class={formatValue(val).cls}>{formatValue(val).text}</span>
    </div>
  {/if}

<style>
  summary {
    cursor: pointer;
    list-style: none;
    user-select: none;
  }

  summary::-webkit-details-marker {
    display: none;
  }

  details[open] > summary .collapsed-hint,
  details[open] > summary .inline-close {
    display: none;
  }

  .children {
    padding-left: var(--gutter);
    border-left: 1px solid var(--bc, var(--color-border));
  }

  .bracket {
    color: var(--bc, var(--color-json-string));
  }

  .diff-added {
    background-color: rgba(154, 206, 106, 0.18);
  }

  .diff-removed {
    background-color: rgba(247, 118, 142, 0.18);
  }
</style>
