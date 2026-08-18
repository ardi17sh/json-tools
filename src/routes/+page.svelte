<script lang="ts">
  import Panel from '$lib/components/Panel.svelte';
  import JsonInput from '$lib/components/JsonInput.svelte';
  import CopyButton from '$lib/components/CopyButton.svelte';
  import SearchControls from '$lib/components/SearchControls.svelte';
  import { parseJson } from '$lib/jsonParser';
  import { formatValue } from '$lib/formatValue';
  import { highlightParts } from '$lib/search';

  let input = $state('');
  let indent = $state(2);
  let outputSearch = $state('');
  let debouncedOutputSearch = $state('');
  let outputMatchIndex = $state(0);
  let outputMatchCount = $state(0);
  let outputElement = $state<HTMLDivElement>();

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


  function navigateOutput(direction: -1 | 1) {
    if (!outputMatchCount) return;
    outputMatchIndex = (outputMatchIndex + direction + outputMatchCount) % outputMatchCount;
  }
  function setAllExpanded(open: boolean) {
    for (const detail of outputElement?.querySelectorAll<HTMLDetailsElement>('details[data-search-path]') ?? []) {
      detail.open = open;
    }
  }
  $effect(() => {
    const query = outputSearch;
    const timeout = setTimeout(() => {
      debouncedOutputSearch = query;
      outputMatchIndex = 0;
    }, 300);
    return () => clearTimeout(timeout);
  });



  function updateOutputSearch() {
    if (!outputElement) {
      outputMatchCount = 0;
      outputMatchIndex = 0;
      return;
    }
    if (!debouncedOutputSearch) {
      outputMatchCount = 0;
      outputMatchIndex = 0;
      return;
    }
    const marks = [...outputElement.querySelectorAll<HTMLElement>('.search-highlight')];
    for (const mark of marks) {
      for (let parent = mark.parentElement; parent; parent = parent.parentElement) {
        if (parent instanceof HTMLDetailsElement) parent.open = true;
      }
    }

    const visibleMarks = marks.filter((mark) => mark.getClientRects().length > 0);
    outputMatchCount = visibleMarks.length;
    if (outputMatchIndex >= outputMatchCount) outputMatchIndex = 0;
    marks.forEach((mark) => mark.classList.remove('search-highlight-active'));
    const active = visibleMarks[outputMatchIndex];
    active?.classList.add('search-highlight-active');
    active?.scrollIntoView({ block: 'nearest' });
  }


  $effect(() => {
    parsed;
    debouncedOutputSearch;
    outputMatchIndex;
    updateOutputSearch();
  });

  const tones = ['#e2c08d', '#7aa2f7', '#bb9af7', '#73daca', '#ff9e64', '#db4b4b'];
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
        <SearchControls bind:query={outputSearch} index={outputMatchIndex} count={outputMatchCount} onprev={() => navigateOutput(-1)} onnext={() => navigateOutput(1)} />
        <button class="small-btn" type="button" onclick={() => setAllExpanded(true)} disabled={parsed === null}>Expand all</button>
        <button class="small-btn" type="button" onclick={() => setAllExpanded(false)} disabled={parsed === null}>Collapse all</button>
        <CopyButton text={getOutput()} disabled={parsed === null} />
      {/snippet}

      {#if error}
        <div class="error">{error}</div>
      {:else if parsed !== null}
        <div class="output-area tree" bind:this={outputElement}>
          {@render JsonNode(parsed)}
        </div>
      {/if}
    </Panel>
  </main>
</div>

{#snippet SearchText(text: string)}
  {#each highlightParts(text, debouncedOutputSearch) as part (part.start)}
    {#if part.match}
      <mark class="search-highlight">{part.text}</mark>
    {:else}
      {part.text}
    {/if}
  {/each}
{/snippet}

{#snippet JsonNode(value: unknown, label?: string, depth = 0, path = 'root')}
  {#if value !== null && typeof value === 'object'}
    {@const entries = Array.isArray(value) ? (value as unknown[]).map((v, i) => [i, v]) : Object.entries(value as Record<string, unknown>)}
    {@const count = entries.length}
    {@const unit = Array.isArray(value) ? (count === 1 ? 'item' : 'items') : (count === 1 ? 'key' : 'keys')}
    {@const openBracket = Array.isArray(value) ? '[' : '{'}
    {@const closeBracket = Array.isArray(value) ? ']' : '}'}
    <details class="block" open data-search-path={path} style:--bc={tones[depth % tones.length]}>
      <summary class="opener">
        {#if label}
          <span class="key">{@render SearchText(label)}</span>
          <span class="colon">{@render SearchText(': ')}</span>
        {/if}
        <span class="bracket">{@render SearchText(openBracket)}</span>
        <span class="collapsed-hint">{count} {unit}</span>
        <span class="inline-close bracket">{@render SearchText(closeBracket)}</span>
      </summary>
      <div class="children">
        {#each entries as [key, val], i (i)}
          {#if val !== null && typeof val === 'object'}
            {@render JsonNode(val, Array.isArray(value) ? String(key) : `"${key}"`, depth + 1, `${path}.${i}`)}
          {:else}
            {@const fmt = formatValue(val)}
            <div class="leaf">
              <span class="key">{@render SearchText(Array.isArray(value) ? String(key) : `"${key}"`)}</span>
              <span class="colon">{@render SearchText(': ')}</span>
              <span class={fmt.cls}>{@render SearchText(fmt.text)}</span>
              <span class="comma">{@render SearchText(i < entries.length - 1 ? ',' : '')}</span>
            </div>
          {/if}
        {/each}
      </div>
      <div class="closer">
        <span class="bracket">{@render SearchText(closeBracket)}</span>
      </div>
    </details>
  {:else}
    {@const fmt = formatValue(value)}
    <div class="leaf">
      {#if label}
        <span class="key">{@render SearchText(label)}</span>
        <span class="colon">{@render SearchText(': ')}</span>
      {/if}
      <span class={fmt.cls}>{@render SearchText(fmt.text)}</span>
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

  :global(.comma) {
    color: var(--color-text-muted);
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
