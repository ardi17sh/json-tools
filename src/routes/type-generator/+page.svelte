<script lang="ts">
  import Panel from '$lib/components/Panel.svelte';
  import JsonInput from '$lib/components/JsonInput.svelte';
  import CopyButton from '$lib/components/CopyButton.svelte';
  import { parseJson } from '$lib/jsonParser';
  import { generateType, generateExtractedTypes } from '$lib/typeGenerator';
  import type { ExtractOptions } from '$lib/typeGenerator';

  let input = $state('');
  let typeConstruct = $state<'interface' | 'type'>('interface');
  let arraySyntax = $state<'shorthand' | 'generic'>('shorthand');
  let rootName = $state('Root');
  let indent = $state(2);
  let extractNested = $state(true);

  const placeholder = 'Paste JSON here...\n\nExample:\n{"user":{"name":"Ada"}}';
  const result = $derived.by(() => input.trim() ? parseJson(input) : { data: null, error: '' });
  const parsed = $derived(result.data);
  const error = $derived(result.error);

  function getOptions(): ExtractOptions {
    return { typeConstruct, arraySyntax, rootName: rootName.trim() || 'Root', indent };
  }

  function getOutput(): string {
    if (parsed === null) return '';
    const options = getOptions();
    try {
      if (extractNested) return generateExtractedTypes(parsed, options);
      const inlineType = generateType(parsed, options);
      return options.typeConstruct === 'type'
        ? `type ${options.rootName} = ${inlineType}`
        : inlineType.startsWith('{') ? `interface ${options.rootName} ${inlineType}` : `type ${options.rootName} = ${inlineType}`;
    } catch { return ''; }
  }

  function clearAll() { input = ''; }
</script>

<svelte:head>
  <title>Type Generator — JSON Tools</title>
</svelte:head>

<div class="page type-page">
  <header class="page-header">
    <div>
      <div class="eyebrow">Generate / TypeScript</div>
      <h1>Turn JSON into typed interfaces</h1>
      <p class="page-description">Generate TypeScript types from real JSON with just enough control for your codebase's conventions.</p>
    </div>
  </header>

  <div class="toolbar type-toolbar" aria-label="Type generation options">
    <label>Construct
      <select bind:value={typeConstruct}><option value="interface">interface</option><option value="type">type</option></select>
    </label>
    <label>Arrays
      <select bind:value={arraySyntax}><option value="shorthand">T[]</option><option value="generic">Array&lt;T&gt;</option></select>
    </label>
    <label>Root
      <input class="text-input" type="text" bind:value={rootName} aria-label="Root type name" />
    </label>
    <label>Indent
      <select bind:value={indent}><option value={2}>2 spaces</option><option value={4}>4 spaces</option></select>
    </label>
    <label class="checkbox-label"><input type="checkbox" bind:checked={extractNested} /> Extract nested</label>
    <span class="toolbar-spacer"></span>
    <button type="button" onclick={clearAll} disabled={!input}>Clear</button>
  </div>

  <main class="editor-grid">
    <Panel title="JSON input">
      {#snippet actions()}<span class="panel-meta">Source document</span>{/snippet}
      <JsonInput bind:value={input} {placeholder} />
      {#if error}<div class="error" role="alert">{error}</div>{/if}
    </Panel>

    <Panel title="TypeScript output">
      {#snippet actions()}<CopyButton text={getOutput()} disabled={parsed === null} />{/snippet}
      {#if error}
        <div class="error" role="alert">Fix the input above to generate types.</div>
      {:else if parsed !== null}
        <pre class="output-area code-output">{getOutput()}</pre>
      {:else}
        <div class="empty-state"><div class="empty-mark" aria-hidden="true">TS</div><div><strong>Generated types appear here</strong><p>Paste JSON and tune the options above to create a typed model.</p></div></div>
      {/if}
    </Panel>
  </main>
</div>

<style>
  .type-toolbar { align-items: center; }
  .type-toolbar label { gap: 0.4rem; }
  .panel-meta { color: var(--color-text-dim); font-family: var(--font-mono); font-size: 0.66rem; }
  .code-output { white-space: pre; }
  @media (max-width: 520px) { .type-toolbar label { width: calc(50% - 0.35rem); justify-content: space-between; } .type-toolbar .text-input { max-width: 7rem; } }
</style>
