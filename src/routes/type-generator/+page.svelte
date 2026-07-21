<script lang="ts">
  import Panel from '$lib/components/Panel.svelte';
  import JsonInput from '$lib/components/JsonInput.svelte';
  import CopyButton from '$lib/components/CopyButton.svelte';
  import { parseJson } from '$lib/jsonParser';
  import { generateType, generateExtractedTypes } from '$lib/typeGenerator';
  import type { ExtractOptions } from '$lib/typeGenerator';

  let input = $state('');
  let parsed = $state<unknown>(null);
  let error = $state('');

  let typeConstruct = $state<'interface' | 'type'>('interface');
  let arraySyntax = $state<'shorthand' | 'generic'>('shorthand');
  let rootName = $state('Root');
  let indent = $state(2);
  let extractNested = $state(true);

  const placeholder = 'Paste JSON here, e.g. {"name": "John", "age": 30}';

  $effect(() => {
    if (!input.trim()) {
      parsed = null;
      error = '';
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
  });

  function getOptions(): ExtractOptions {
    return {
      typeConstruct,
      arraySyntax,
      rootName: rootName.trim() || 'Root',
      indent
    };
  }

  function getOutput(): string {
    if (parsed === null) return '';
    const options = getOptions();
    try {
      if (extractNested) {
        return generateExtractedTypes(parsed, options);
      }
      const construct = options.typeConstruct;
      const name = options.rootName;
      const inlineType = generateType(parsed, options);
      if (construct === 'type') {
        return `type ${name} = ${inlineType}`;
      }
      if (inlineType.startsWith('{')) {
        return `interface ${name} ${inlineType}`;
      }
      return `type ${name} = ${inlineType}`;
    } catch {
      return '';
    }
  }

  function clearAll() {
    input = '';
    parsed = null;
    error = '';
  }
</script>

<svelte:head>
  <title>Type Generator — JSON Tools</title>
</svelte:head>

<div class="app">
  <header>
    <h1>TypeScript Type Generator</h1>
    <div class="controls">
      <label>
        Construct:
        <select bind:value={typeConstruct}>
          <option value="interface">interface</option>
          <option value="type">type</option>
        </select>
      </label>
      <label>
        Arrays:
        <select bind:value={arraySyntax}>
          <option value="shorthand">T[]</option>
          <option value="generic">Array&lt;T&gt;</option>
        </select>
      </label>
      <label>
        Root name:
        <input type="text" bind:value={rootName} class="text-input" />
      </label>
      <label>
        Indent:
        <select bind:value={indent}>
          <option value={2}>2 spaces</option>
          <option value={4}>4 spaces</option>
        </select>
      </label>
      <label class="checkbox-label">
        <input type="checkbox" bind:checked={extractNested} />
        Extract nested
      </label>
      <button onclick={clearAll}>Clear</button>
    </div>
  </header>

  <main>
    <Panel title="JSON Input">
      <JsonInput bind:value={input} {placeholder} />
    </Panel>

    <Panel title="TypeScript Output">
      {#snippet actions()}
        <CopyButton text={getOutput()} disabled={parsed === null} />
      {/snippet}

      {#if error}
        <div class="error">{error}</div>
      {:else if parsed !== null}
        <pre class="output-area">{getOutput()}</pre>
      {/if}
    </Panel>
  </main>
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
    flex-wrap: wrap;
  }

  main {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-md);
    flex: 1;
    min-height: 0;
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
