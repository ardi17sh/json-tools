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

  function getOutput(): string {
    if (parsed === null) return '';
    return JSON.stringify(parsed, null, indent === 0 ? '\t' : indent);
  }

  function formatInput() {
    if (parsed !== null) input = getOutput();
  }
  function handleShortcut(event: KeyboardEvent) {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      formatInput();
    }
  }

  function clearAll() {
    input = '';
    outputSearch = '';
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
    }, 240);
    return () => clearTimeout(timeout);
  });

  function updateOutputSearch() {
    if (!outputElement || !debouncedOutputSearch) {
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

  const tones = ['#f2c879', '#8ab4ff', '#c9a7ff', '#7ed6a5', '#f8b26a', '#f38ba8'];
</script>

<svelte:head>
  <title>JSON Formatter — JSON Tools</title>
</svelte:head>
<svelte:window onkeydown={handleShortcut} />

<div class="page formatter-page">
  <header class="page-header">
    <div>
      <div class="eyebrow">Formatter / JSON</div>
      <h1>Format JSON without leaving your editor</h1>
      <p class="page-description">Paste raw JSON, choose your indentation, and get a readable structure instantly. Everything runs locally in your browser.</p>
    </div>
    <div class="header-meta"><span class="privacy-pill">● No uploads · no tracking</span></div>
  </header>

  <div class="toolbar" aria-label="Formatter controls">
    <label class="control-label">Indent
      <select bind:value={indent} aria-label="Indentation">
        <option value={2}>2 spaces</option>
        <option value={4}>4 spaces</option>
        <option value={0}>Tab (\t)</option>
      </select>
    </label>
    <button class="primary" type="button" onclick={formatInput} disabled={parsed === null}>Format JSON</button>
    <button type="button" onclick={clearAll} disabled={!input}>Clear</button>
    <span class="toolbar-spacer"></span>
    <span class="toolbar-note">Output updates as you type</span>
  </div>

  <main class="editor-grid">
    <Panel title="Input">
      {#snippet actions()}
        <span class="panel-meta">{input ? `${input.split('\n').length} lines` : 'Waiting for JSON'}</span>
      {/snippet}
      <JsonInput bind:value={input} placeholder={'Paste JSON here...\n\nExample:\n{"name":"Ada","active":true}'} />
      {#if error}<div class="error" role="alert">{error}</div>{/if}
    </Panel>

    <Panel title="Formatted output">
      {#snippet actions()}
        <SearchControls bind:query={outputSearch} index={outputMatchIndex} count={outputMatchCount} onprev={() => navigateOutput(-1)} onnext={() => navigateOutput(1)} />
        <button class="small-btn" type="button" onclick={() => setAllExpanded(true)} disabled={parsed === null}>Expand all</button>
        <button class="small-btn" type="button" onclick={() => setAllExpanded(false)} disabled={parsed === null}>Collapse</button>
        <CopyButton text={getOutput()} disabled={parsed === null} />
      {/snippet}

      {#if error}
        <div class="error" role="alert">Fix the input above to preview formatted JSON.</div>
      {:else if parsed !== null}
        <div class="output-area tree" bind:this={outputElement}>
          {@render JsonNode(parsed)}
        </div>
      {:else}
        <div class="empty-state">
          <div class="empty-mark" aria-hidden="true">&#123;&#125;</div>
          <div><strong>Your formatted JSON appears here</strong><p>Paste an object or array into the input panel to get started.</p></div>
        </div>
      {/if}
    </Panel>
  </main>
</div>

{#snippet SearchText(text: string)}
  {#each highlightParts(text, debouncedOutputSearch) as part (part.start)}
    {#if part.match}<mark class="search-highlight">{part.text}</mark>{:else}{part.text}{#if part.truncated}<span class="search-truncated" role="note"> … more matches hidden</span>{/if}{/if}
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
        {#if label}<span class="key">{@render SearchText(label)}</span><span class="colon">{@render SearchText(': ')}</span>{/if}
        <span class="bracket">{@render SearchText(openBracket)}</span><span class="collapsed-hint">{count} {unit}</span><span class="inline-close bracket">{@render SearchText(closeBracket)}</span>
      </summary>
      <div class="children">
        {#each entries as [key, val], i (i)}
          {#if val !== null && typeof val === 'object'}
            {@render JsonNode(val, Array.isArray(value) ? String(key) : `"${key}"`, depth + 1, `${path}.${i}`)}
          {:else}
            {@const fmt = formatValue(val)}
            <div class="leaf"><span class="key">{@render SearchText(Array.isArray(value) ? String(key) : `"${key}"`)}</span><span class="colon">{@render SearchText(': ')}</span><span class={fmt.cls}>{@render SearchText(fmt.text)}</span><span class="comma">{@render SearchText(i < entries.length - 1 ? ',' : '')}</span></div>
          {/if}
        {/each}
      </div>
      <div class="closer"><span class="bracket">{@render SearchText(closeBracket)}</span></div>
    </details>
  {:else}
    {@const fmt = formatValue(value)}
    <div class="leaf">{#if label}<span class="key">{@render SearchText(label)}</span><span class="colon">{@render SearchText(': ')}</span>{/if}<span class={fmt.cls}>{@render SearchText(fmt.text)}</span></div>
  {/if}
{/snippet}

<style>
  .formatter-page :global(.panel) { min-height: 0; }
  .header-meta { align-self: flex-start; }
  .privacy-pill, .toolbar-note, .panel-meta { color: var(--color-text-dim); font-family: var(--font-mono); font-size: 0.66rem; }
  .privacy-pill { white-space: nowrap; }
  .privacy-pill::first-letter { color: var(--color-success); }
  @media (max-width: 800px) { .header-meta { display: none; } }
</style>
