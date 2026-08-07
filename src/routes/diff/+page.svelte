<script lang="ts">
  import Panel from '$lib/components/Panel.svelte';
  import JsonInput from '$lib/components/JsonInput.svelte';
  import DiffNode from '$lib/components/DiffNode.svelte';
  import { parseJson } from '$lib/jsonParser';
  import { diffJson } from '$lib/jsonDiff';

  let left = $state('');
  let right = $state('');

  const leftParsed = $derived.by(() => (left.trim() ? parseJson(left) : null));
  const rightParsed = $derived.by(() => (right.trim() ? parseJson(right) : null));

  const diff = $derived.by(() => {
    const l = leftParsed;
    const r = rightParsed;
    if (!l || !r || l.error || r.error) return null;
    return diffJson(l.data, r.data);
  });

  const leftError = $derived(leftParsed?.error ?? '');
  const rightError = $derived(rightParsed?.error ?? '');

  function clearAll() {
    left = '';
    right = '';
  }
</script>

<svelte:head>
  <title>JSON Diff — JSON Tools</title>
</svelte:head>

<div class="app">
  <header>
    <h1>JSON Diff</h1>
    <div class="controls">
      <button onclick={clearAll}>Clear</button>
    </div>
  </header>

  <main>
    <Panel title="JSON Left">
      <JsonInput bind:value={left} placeholder="Paste first JSON here..." />
      {#if leftError}
        <div class="error">{leftError}</div>
      {/if}
    </Panel>

    <Panel title="JSON Right">
      <JsonInput bind:value={right} placeholder="Paste second JSON here..." />
      {#if rightError}
        <div class="error">{rightError}</div>
      {/if}
    </Panel>
  </main>

  {#if diff}
    <section class="diff-output">
      <div class="diff-col">
        <div class="diff-title">Old</div>
        <div class="output-area tree">
          <DiffNode node={diff} side="old" />
        </div>
      </div>
      <div class="diff-col">
        <div class="diff-title">New</div>
        <div class="output-area tree">
          <DiffNode node={diff} side="new" />
        </div>
      </div>
    </section>
  {:else if leftError || rightError}
    <div class="error">Fix the JSON on both sides to see the diff.</div>
  {/if}
</div>

<style>
  .app {
    width: 100%;
    padding: var(--spacing-md) var(--spacing-lg);
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--spacing-lg);
    flex-wrap: wrap;
    gap: var(--spacing-md);
  }

  h1 {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--color-primary);
  }

  .controls {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }

  main {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
  }

  .diff-output {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-md);
    flex: 1;
    min-height: 0;
  }

  .diff-col {
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .diff-title {
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
    margin-bottom: var(--spacing-sm);
  }

  .tree {
    white-space: nowrap;
    overflow: auto;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--spacing-md);
    background: var(--color-bg-secondary);
  }

  @media (max-width: 768px) {
    main,
    .diff-output {
      grid-template-columns: 1fr;
    }
  }
</style>
