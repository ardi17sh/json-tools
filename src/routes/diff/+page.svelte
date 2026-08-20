<script lang="ts">
  import Panel from '$lib/components/Panel.svelte';
  import JsonInput from '$lib/components/JsonInput.svelte';
  import DiffNode from '$lib/components/DiffNode.svelte';
  import CopyButton from '$lib/components/CopyButton.svelte';
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

  function formatted(value: unknown, source: string) {
    return source.trim() ? JSON.stringify(value, null, 2) : '';
  }
</script>

<svelte:head>
  <title>JSON Diff — JSON Tools</title>
</svelte:head>

<div class="page diff-page">
  <header class="page-header">
    <div>
      <div class="eyebrow">Compare / JSON</div>
      <h1>See exactly what changed</h1>
      <p class="page-description">Compare two JSON documents side by side. Added and removed values stay aligned so changes are easy to scan.</p>
    </div>
    <div class="diff-legend" aria-label="Diff legend"><span class="legend-added">+ Added</span><span class="legend-removed">− Removed</span></div>
  </header>

  <div class="toolbar" aria-label="Diff controls">
    <span class="toolbar-label">Paste two versions to compare</span>
    <span class="toolbar-spacer"></span>
    <button type="button" onclick={clearAll} disabled={!left && !right}>Clear all</button>
  </div>

  <main class="editor-grid">
    <Panel title="Original">
      {#snippet actions()}<span class="panel-meta">Before</span>{/snippet}
      <JsonInput bind:value={left} placeholder={'Paste original JSON...\n\nExample:\n{"version":1,"enabled":false}'} />
      {#if leftError}<div class="error" role="alert">{leftError}</div>{/if}
    </Panel>
    <Panel title="Modified">
      {#snippet actions()}<span class="panel-meta">After</span>{/snippet}
      <JsonInput bind:value={right} placeholder={'Paste modified JSON...\n\nExample:\n{"version":2,"enabled":true}'} />
      {#if rightError}<div class="error" role="alert">{rightError}</div>{/if}
    </Panel>
  </main>

  {#if diff}
    <section class="diff-output" aria-label="Comparison result">
      <Panel title="Original result">
        {#snippet actions()}<CopyButton text={formatted(leftParsed?.data, left)} disabled={!left.trim()} />{/snippet}
        <div class="output-area tree"><DiffNode node={diff} side="old" /></div>
      </Panel>
      <Panel title="Modified result">
        {#snippet actions()}<CopyButton text={formatted(rightParsed?.data, right)} disabled={!right.trim()} />{/snippet}
        <div class="output-area tree"><DiffNode node={diff} side="new" /></div>
      </Panel>
    </section>
  {:else if leftError || rightError}
    <div class="error diff-error" role="alert">Fix both JSON inputs to see the comparison.</div>
  {:else}
    <div class="diff-empty"><span class="empty-mark" aria-hidden="true">±</span><div><strong>Your diff appears here</strong><p>Provide an original and modified document above.</p></div></div>
  {/if}
</div>

<style>
  .diff-output { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.85rem; margin-top: 0.85rem; min-height: 0; }
  .diff-output :global(.output-area) { min-height: 21rem; }
  .diff-legend { display: flex; gap: 0.8rem; align-items: center; font-family: var(--font-mono); font-size: 0.68rem; }
  .legend-added { color: var(--color-success); }
  .legend-removed { color: var(--color-error); }
  .toolbar-label { color: var(--color-text-muted); font-size: 0.74rem; }
  .panel-meta { color: var(--color-text-dim); font-family: var(--font-mono); font-size: 0.66rem; }
  .diff-error { margin-top: 0.85rem; }
  .diff-empty { display: grid; place-items: center; align-content: center; min-height: 11rem; margin-top: 0.85rem; color: var(--color-text-muted); text-align: center; }
  .diff-empty .empty-mark { margin: 0 auto 0.75rem; }
  .diff-empty strong { display: block; margin-bottom: 0.3rem; color: var(--color-text); font-size: 0.84rem; }
  .diff-empty p { font-size: 0.74rem; }
  @media (max-width: 800px) { .diff-output { grid-template-columns: 1fr; } }
</style>
