<script lang="ts">
  import Panel from '$lib/components/Panel.svelte';
  import JsonInput from '$lib/components/JsonInput.svelte';
  import CopyButton from '$lib/components/CopyButton.svelte';
  import { parseJson } from '$lib/jsonParser';

  let input = $state('');
  let indent = $state(2);

  const result = $derived.by(() =>
    input.trim() ? parseJson(input) : { data: null, error: '' }
  );
  const parsed = $derived(result.data);
  const error = $derived(result.error);

  function handleIndentChange(e: Event) {
    indent = Number((e.target as HTMLSelectElement).value);
  }

  function getOutput(): string {
    if (parsed === null) return '';
    const space = indent === 0 ? '\t' : indent;
    return JSON.stringify(parsed, null, space);
  }

  function clearAll() {
    input = '';
  }

  const tones = ['#e2c08d', '#7aa2f7', '#bb9af7', '#73daca', '#ff9e64', '#db4b4b'];

  function formatValue(val: unknown): { text: string; cls: string } {
    if (val === null) return { text: 'null', cls: 'json-null' };
    if (typeof val === 'boolean') return { text: String(val), cls: 'json-bool' };
    if (typeof val === 'number') return { text: String(val), cls: 'json-number' };
    if (typeof val === 'string') return { text: `"${val}"`, cls: 'json-string' };
    return { text: String(val), cls: '' };
  }
</script>

<div class="app">
  <header>
    <h1>JSON Formatter</h1>
    <div class="controls">
      <label>
        Indent:
        <select value={indent} onchange={handleIndentChange}>
          <option value={2}>2 spaces</option>
          <option value={4}>4 spaces</option>
          <option value={0}>Tab (\t)</option>
        </select>
      </label>
      <button onclick={clearAll}>Clear</button>
    </div>
  </header>

  <main>
    <Panel title="Input">
      <JsonInput bind:value={input} placeholder="Paste your JSON here..." />
    </Panel>

    <Panel title="Output">
      {#snippet actions()}
        <CopyButton text={getOutput()} disabled={parsed === null} />
      {/snippet}

      {#if error}
        <div class="error">{error}</div>
      {:else if parsed !== null}
        <div class="output-area tree">
          {@render JsonNode(parsed)}
        </div>
      {/if}
    </Panel>
  </main>
</div>

{#snippet JsonNode(value: unknown, label?: string, depth = 0)}
  {#if value !== null && typeof value === 'object'}
    {@const entries = Array.isArray(value) ? (value as unknown[]).map((v, i) => [i, v]) : Object.entries(value as Record<string, unknown>)}
    {@const count = entries.length}
    {@const unit = Array.isArray(value) ? (count === 1 ? 'item' : 'items') : (count === 1 ? 'key' : 'keys')}
    {@const openBracket = Array.isArray(value) ? '[' : '{'}
    {@const closeBracket = Array.isArray(value) ? ']' : '}'}
    <details class="block" open style:--bc={tones[depth % tones.length]}>
      <summary class="opener">
        {#if label}
          <span class="key">{label}</span>
          <span class="colon">:&nbsp;</span>
        {/if}
        <span class="bracket">{openBracket}</span>
        <span class="collapsed-hint">{count} {unit}</span>
        <span class="inline-close bracket">{closeBracket}</span>
      </summary>
      <div class="children">
        {#each entries as [key, val], i (i)}
          {#if val !== null && typeof val === 'object'}
            {@render JsonNode(val, Array.isArray(value) ? String(key) : `"${key}"`, depth + 1)}
          {:else}
            {@const fmt = formatValue(val)}
            <div class="leaf">
              <span class="key">{Array.isArray(value) ? key : `"${key}"`}</span>
              <span class="colon">:&nbsp;</span>
              <span class={fmt.cls}>{fmt.text}</span>
              <span class="comma">{i < entries.length - 1 ? ',' : ''}</span>
            </div>
          {/if}
        {/each}
      </div>
      <div class="closer">
        <span class="bracket">{closeBracket}</span>
      </div>
    </details>
  {:else}
    {@const fmt = formatValue(value)}
    <div class="leaf">
      {#if label}
        <span class="key">{label}</span>
        <span class="colon">:&nbsp;</span>
      {/if}
      <span class={fmt.cls}>{fmt.text}</span>
    </div>
  {/if}
{/snippet}

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
    flex-wrap: wrap;
  }

  main {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-md);
    flex: 1;
    min-height: 0;
  }

  :global(.tree) {
    white-space: nowrap;
  }

  :global(.block) {
    display: block;
  }

  :root {
    --gutter: 1.5rem;
  }

  :global(.opener),
  :global(.leaf) {
    display: flex;
    align-items: baseline;
  }

  :global(summary) {
    cursor: pointer;
    list-style: none;
    user-select: none;
  }

  :global(summary::-webkit-details-marker) {
    display: none;
  }

  :global(details[open] > summary .collapsed-hint),
  :global(details[open] > summary .inline-close) {
    display: none;
  }

  :global(.children) {
    padding-left: var(--gutter);
    border-left: 1px solid var(--bc, var(--color-border));
  }

  :global(.bracket) {
    color: var(--bc, var(--color-json-string));
  }

  :global(.collapsed-hint) {
    color: var(--color-text-dim);
    font-style: italic;
    font-size: 0.8rem;
  }

  :global(.key) {
    color: var(--color-primary);
  }

  :global(.colon) {
    color: var(--color-text-muted);
  }

  :global(.comma) {
    color: var(--color-text-muted);
  }

  :global(.json-string) {
    color: var(--color-json-string);
  }

  :global(.json-number) {
    color: var(--color-json-number);
  }

  :global(.json-bool) {
    color: var(--color-json-bool);
  }

  :global(.json-null) {
    color: var(--color-json-null);
  }

  @media (max-width: 768px) {
    main {
      grid-template-columns: 1fr;
    }

    header {
      flex-direction: column;
      align-items: flex-start;
    }
  }
</style>
