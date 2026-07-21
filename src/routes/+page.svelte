<script lang="ts">
  import Panel from '$lib/components/Panel.svelte';
  import JsonInput from '$lib/components/JsonInput.svelte';
  import CopyButton from '$lib/components/CopyButton.svelte';
  import { parseJson } from '$lib/jsonParser';

  let input = $state('');
  let parsed = $state<unknown>(null);
  let error = $state('');
  let indent = $state(2);
  let collapsed = $state<Set<string>>(new Set());

  $effect(() => {
    if (!input.trim()) {
      parsed = null;
      error = '';
      collapsed = new Set();
      return;
    }

    const result = parseJson(input);
    if (result.error) {
      error = result.error;
      parsed = null;
    } else {
      error = '';
      parsed = result.data;
    }
    collapsed = new Set();
  });

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
    parsed = null;
    error = '';
    collapsed = new Set();
  }

  function toggle(path: string) {
    const next = new Set(collapsed);
    if (next.has(path)) {
      next.delete(path);
    } else {
      next.add(path);
    }
    collapsed = next;
  }

  function collapseAll() {
    const paths = new Set<string>();
    if (parsed !== null && typeof parsed === 'object') {
      collectPaths(parsed, 'root');
    }
    collapsed = paths;

    function collectPaths(val: unknown, path: string) {
      if (val && typeof val === 'object') {
        paths.add(path);
        const entries = Array.isArray(val)
          ? val.map((v, i) => [i, v])
          : Object.entries(val as Record<string, unknown>);
        for (const [k, v] of entries) {
          collectPaths(v, `${path}.${k}`);
        }
      }
    }
  }

  function expandAll() {
    collapsed = new Set();
  }

  function isCollapsible(val: unknown): boolean {
    return val !== null && typeof val === 'object';
  }

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
        {#if parsed !== null}
          <button class="small-btn" onclick={collapseAll}>Collapse All</button>
          <button class="small-btn" onclick={expandAll}>Expand All</button>
        {/if}
        <CopyButton text={getOutput()} disabled={parsed === null} />
      {/snippet}

      {#if error}
        <div class="error">{error}</div>
      {:else if parsed !== null}
        <div class="output-area tree">
          {@render JsonNode(parsed, 'root', 0)}
        </div>
      {/if}
    </Panel>
  </main>
</div>

{#snippet JsonNode(value: unknown, path: string, depth: number, label?: string)}
  {#if isCollapsible(value)}
    {@const isArr = Array.isArray(value)}
    {@const entries = isArr ? (value as unknown[]).map((v, i) => [i, v]) : Object.entries(value as Record<string, unknown>)}
    {@const isCollapsed = collapsed.has(path)}
    {@const open = isArr ? '[' : '{'}
    {@const close = isArr ? ']' : '}'}
    <div class="block">
      <div class="opener">
        <button class="toggle" type="button" onclick={() => toggle(path)} aria-label={isCollapsed ? 'Expand' : 'Collapse'}>{isCollapsed ? '▶' : '▼'}</button>
        {#if label}
          <span class="key">{label}</span>
          <span class="colon">:&nbsp;</span>
        {/if}
        <span class="bracket">{open}</span>
        {#if isCollapsed}
          <span class="collapsed-hint">&nbsp;{entries.length} {isArr ? 'items' : 'keys'}&nbsp;</span>
          <span class="bracket">{close}</span>
        {/if}
      </div>
      {#if !isCollapsed}
        <div class="children">
          {#each entries as [key, val], i}
            {#if isCollapsible(val)}
              {@render JsonNode(val, `${path}.${key}`, depth + 1, isArr ? String(key) : `"${key}"`)}
            {:else}
              {@const fmt = formatValue(val)}
              <div class="leaf">
                <span class="gutter"></span>
                <span class="key">{isArr ? key : `"${key}"`}</span>
                <span class="colon">:&nbsp;</span>
                <span class={fmt.cls}>{fmt.text}</span>
                <span class="comma">{i < entries.length - 1 ? ',' : ''}</span>
              </div>
            {/if}
          {/each}
        </div>
        <div class="closer">
          <span class="gutter"></span>
          <span class="bracket">{close}</span>
        </div>
      {/if}
    </div>
  {:else}
    {@const fmt = formatValue(value)}
    <div class="leaf">
      {#if label}
        <span class="gutter"></span>
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
  :global(.closer),
  :global(.leaf) {
    display: flex;
    align-items: baseline;
  }

  :global(.toggle) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--gutter);
    height: 1.25rem;
    flex-shrink: 0;
    background: none;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    user-select: none;
    color: var(--color-text-dim);
    font-size: 0.6rem;
    padding: 0;
    transition: color 0.1s, background 0.1s;
  }

  :global(.toggle:hover) {
    color: var(--color-primary);
    background: var(--color-bg-secondary);
  }

  :global(.gutter) {
    display: inline-block;
    width: var(--gutter);
    flex-shrink: 0;
  }

  :global(.children) {
    padding-left: var(--gutter);
  }

  :global(.bracket) {
    color: var(--color-json-string);
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
