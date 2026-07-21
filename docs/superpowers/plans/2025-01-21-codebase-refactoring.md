# Codebase Refactoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the JSON Tools codebase to be clean, modular, DRY, and consistent in styling. Extract shared Svelte components, shared utilities, and shared CSS.

**Architecture:** Extract reusable components (CopyButton, JsonInput, Panel), shared utilities (clipboard, jsonParser), and shared CSS (global.css with design tokens). Reduce page components from monolithic files (~380-480 lines) to thin orchestrators (~200-250 lines) that compose shared pieces.

**Tech Stack:** SvelteKit 2, Svelte 5 (Runes mode), TypeScript, Vitest 4, Vite 8, adapter-static

## Global Constraints

- All existing tests must continue to pass
- No visual regressions — app must look identical before and after
- No behavioral regressions — all features must work exactly as before
- No new dependencies
- No changes to `typeGenerator.ts` or its tests
- Use design tokens (CSS custom properties) for all colors/spacing/typography
- Each file must have one clear responsibility

---

## File Structure

### New files to create

| File | Responsibility |
|------|----------------|
| `src/lib/clipboard.ts` | Clipboard utility with fallback |
| `src/lib/clipboard.test.ts` | Tests for clipboard utility |
| `src/lib/jsonParser.ts` | JSON parsing utility with auto-detect |
| `src/lib/jsonParser.test.ts` | Tests for JSON parsing utility |
| `src/styles/global.css` | Design tokens + shared component styles |
| `src/lib/components/CopyButton.svelte` | Copy-to-clipboard button with feedback |
| `src/lib/components/JsonInput.svelte` | Styled textarea for JSON input |
| `src/lib/components/Panel.svelte` | Container with title + actions slot |

### Files to modify

| File | Changes |
|------|---------|
| `src/routes/+page.svelte` | Remove duplicated logic, use shared components/utilities, reduce from ~480 to ~250 lines |
| `src/routes/type-generator/+page.svelte` | Remove duplicated logic, use shared components/utilities, reduce from ~380 to ~200 lines |
| `src/routes/+layout.svelte` | Import global.css, remove duplicated styles, keep only layout-specific styles |

---

## Task 1: Create clipboard utility with tests

**Files:**
- Create: `src/lib/clipboard.ts`
- Create: `src/lib/clipboard.test.ts`

**Interfaces:**
- Produces: `export async function copyToClipboard(text: string): Promise<boolean>`

- [ ] **Step 1: Write failing test for successful clipboard copy**

Create `src/lib/clipboard.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { copyToClipboard } from './clipboard';

describe('copyToClipboard', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined)
      }
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should copy text using navigator.clipboard.writeText', async () => {
    const result = await copyToClipboard('test text');
    
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test text');
    expect(result).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/clipboard.test.ts`
Expected: FAIL with "Cannot find module './clipboard'"

- [ ] **Step 3: Create clipboard utility**

Create `src/lib/clipboard.ts`:

```typescript
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for environments where clipboard API is unavailable
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch {
      document.body.removeChild(textarea);
      return false;
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/clipboard.test.ts`
Expected: PASS

- [ ] **Step 5: Write failing test for fallback behavior**

Add to `src/lib/clipboard.test.ts`:

```typescript
  it('should fallback to execCommand when clipboard API fails', async () => {
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: vi.fn().mockRejectedValue(new Error('Clipboard unavailable'))
      }
    });

    const execCommandSpy = vi.spyOn(document, 'execCommand').mockReturnValue(true);
    
    const result = await copyToClipboard('test text');
    
    expect(execCommandSpy).toHaveBeenCalledWith('copy');
    expect(result).toBe(true);
    
    execCommandSpy.mockRestore();
  });
```

- [ ] **Step 6: Run test to verify fallback works**

Run: `npm test -- src/lib/clipboard.test.ts`
Expected: PASS (both tests pass)

- [ ] **Step 7: Commit**

```bash
git add src/lib/clipboard.ts src/lib/clipboard.test.ts
git commit -m "feat: add clipboard utility with fallback"
```

---

## Task 2: Create JSON parser utility with tests

**Files:**
- Create: `src/lib/jsonParser.ts`
- Create: `src/lib/jsonParser.test.ts`

**Interfaces:**
- Consumes: Nothing
- Produces: `export function parseJson(input: string): { data: unknown | null; error: string }`

- [ ] **Step 1: Write failing tests for basic parsing**

Create `src/lib/jsonParser.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { parseJson } from './jsonParser';

describe('parseJson', () => {
  it('should parse valid JSON', () => {
    const result = parseJson('{"name":"John","age":30}');
    
    expect(result.data).toEqual({ name: 'John', age: 30 });
    expect(result.error).toBe('');
  });

  it('should return error for invalid JSON', () => {
    const result = parseJson('{invalid}');
    
    expect(result.data).toBeNull();
    expect(result.error).toBeTruthy();
  });

  it('should return empty result for empty input', () => {
    const result = parseJson('');
    
    expect(result.data).toBeNull();
    expect(result.error).toBe('');
  });

  it('should return empty result for whitespace-only input', () => {
    const result = parseJson('   ');
    
    expect(result.data).toBeNull();
    expect(result.error).toBe('');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/jsonParser.test.ts`
Expected: FAIL with "Cannot find module './jsonParser'"

- [ ] **Step 3: Create JSON parser utility**

Create `src/lib/jsonParser.ts`:

```typescript
export function parseJson(input: string): { data: unknown | null; error: string } {
  const trimmed = input.trim();
  
  if (!trimmed) {
    return { data: null, error: '' };
  }

  try {
    let parsed: unknown = JSON.parse(trimmed);
    
    // Auto-detect stringified JSON and parse recursively
    while (typeof parsed === 'string') {
      try {
        parsed = JSON.parse(parsed);
      } catch {
        break;
      }
    }
    
    return { data: parsed, error: '' };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return { data: null, error: message };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/jsonParser.test.ts`
Expected: PASS (all 4 tests pass)

- [ ] **Step 5: Write failing test for auto-detect stringified JSON**

Add to `src/lib/jsonParser.test.ts`:

```typescript
  it('should auto-detect and parse stringified JSON', () => {
    const stringified = JSON.stringify({ name: 'John' });
    const doubleStringified = JSON.stringify(stringified);
    const result = parseJson(doubleStringified);
    
    expect(result.data).toEqual({ name: 'John' });
    expect(result.error).toBe('');
  });
```

- [ ] **Step 6: Run test to verify auto-detect works**

Run: `npm test -- src/lib/jsonParser.test.ts`
Expected: PASS (all 5 tests pass)

- [ ] **Step 7: Commit**

```bash
git add src/lib/jsonParser.ts src/lib/jsonParser.test.ts
git commit -m "feat: add JSON parser utility with auto-detect"
```

---

## Task 3: Create global.css with design tokens

**Files:**
- Create: `src/styles/global.css`

**Interfaces:**
- Consumes: Nothing
- Produces: CSS custom properties and shared classes for entire app

- [ ] **Step 1: Create global.css with design tokens and shared styles**

Create `src/styles/global.css`:

```css
:root {
  /* Colors */
  --color-bg: #1a1b26;
  --color-bg-secondary: #24283b;
  --color-bg-tertiary: #1f2335;
  --color-border: #3b4261;
  --color-border-hover: #4a5280;
  --color-text: #c0caf5;
  --color-text-muted: #9aa5ce;
  --color-text-dim: #565f89;
  --color-primary: #7aa2f7;
  --color-error: #f7768e;

  /* JSON syntax colors */
  --color-json-string: #9ece6a;
  --color-json-number: #ff9e64;
  --color-json-bool: #bb9af7;
  --color-json-null: #f7768e;

  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;

  /* Typography */
  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;

  /* Border radius */
  --radius-sm: 6px;
  --radius-md: 10px;
}

/* Base styles */
:global(body) {
  font-family: var(--font-sans);
  background: var(--color-bg);
  color: var(--color-text);
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:global(*) {
  box-sizing: border-box;
}

/* Form controls */
button {
  background: var(--color-bg-secondary);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.4rem 1rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

button:hover {
  background: var(--color-border-hover);
  border-color: var(--color-primary);
}

select {
  background: var(--color-bg-secondary);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.4rem 0.6rem;
  font-size: 0.875rem;
  cursor: pointer;
}

select:focus {
  outline: none;
  border-color: var(--color-primary);
}

label {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.text-input {
  background: var(--color-bg-secondary);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.4rem 0.6rem;
  font-size: 0.875rem;
  width: 6rem;
}

.text-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.checkbox-label {
  cursor: pointer;
}

.checkbox-label input[type='checkbox'] {
  accent-color: var(--color-primary);
  width: 0.9rem;
  height: 0.9rem;
  cursor: pointer;
}

/* Panel layout */
.panel {
  display: flex;
  flex-direction: column;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-tertiary);
}

.panel-header span {
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
}

.panel-actions {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
}

/* Input/Output areas */
.input-area {
  flex: 1;
  background: transparent;
  color: var(--color-text);
  border: none;
  padding: var(--spacing-md);
  font-family: var(--font-mono);
  font-size: 0.875rem;
  line-height: 1.6;
  resize: none;
  min-height: 500px;
}

.input-area:focus {
  outline: none;
}

.input-area::placeholder {
  color: var(--color-text-dim);
}

.output-area {
  flex: 1;
  padding: var(--spacing-md);
  font-family: var(--font-mono);
  font-size: 0.875rem;
  line-height: 1.6;
  overflow: auto;
  min-height: 500px;
  color: var(--color-text);
  margin: 0;
}

/* Feedback states */
.error {
  padding: var(--spacing-md);
  color: var(--color-error);
  font-size: 0.875rem;
  font-family: monospace;
}

.copy-btn {
  font-size: 0.75rem;
  padding: 0.3rem 0.75rem;
}

.copy-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.small-btn {
  font-size: 0.7rem;
  padding: 0.25rem 0.6rem;
}

/* Responsive */
@media (max-width: 768px) {
  .input-area,
  .output-area {
    min-height: 250px;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/styles/global.css
git commit -m "feat: add global.css with design tokens and shared styles"
```

---

## Task 4: Create CopyButton component

**Files:**
- Create: `src/lib/components/CopyButton.svelte`

**Interfaces:**
- Consumes: `copyToClipboard` from `$lib/clipboard`
- Produces: Self-contained button component

- [ ] **Step 1: Create CopyButton.svelte**

Create `src/lib/components/CopyButton.svelte`:

```svelte
<script lang="ts">
  import { copyToClipboard } from '$lib/clipboard';

  interface Props {
    text: string;
    disabled?: boolean;
  }

  let { text, disabled = false }: Props = $props();

  let copied = $state(false);

  async function handleClick() {
    if (!text || disabled) return;
    
    const success = await copyToClipboard(text);
    if (success) {
      copied = true;
      setTimeout(() => (copied = false), 2000);
    }
  }
</script>

<button
  class="copy-btn"
  onclick={handleClick}
  {disabled}
>
  {#if copied}
    ✓ Copied!
  {:else}
    Copy
  {/if}
</button>
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/components/CopyButton.svelte
git commit -m "feat: add CopyButton component"
```

---

## Task 5: Create JsonInput component

**Files:**
- Create: `src/lib/components/JsonInput.svelte`

**Interfaces:**
- Consumes: Nothing (uses global CSS)
- Produces: Two-way bindable textarea component

- [ ] **Step 1: Create JsonInput.svelte**

Create `src/lib/components/JsonInput.svelte`:

```svelte
<script lang="ts">
  interface Props {
    value?: string;
    placeholder?: string;
  }

  let { value = $bindable(''), placeholder = '' }: Props = $props();
</script>

<textarea
  class="input-area"
  bind:value
  {placeholder}
  spellcheck="false"
></textarea>
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/components/JsonInput.svelte
git commit -m "feat: add JsonInput component"
```

---

## Task 6: Create Panel component

**Files:**
- Create: `src/lib/components/Panel.svelte`

**Interfaces:**
- Consumes: Nothing (uses global CSS)
- Produces: Container component with title and slots

- [ ] **Step 1: Create Panel.svelte**

Create `src/lib/components/Panel.svelte`:

```svelte
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    title: string;
    actions?: Snippet;
    children: Snippet;
  }

  let { title, actions, children }: Props = $props();
</script>

<div class="panel">
  <div class="panel-header">
    <span>{title}</span>
    {#if actions}
      <div class="panel-actions">
        {@render actions()}
      </div>
    {/if}
  </div>
  {@render children()}
</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/components/Panel.svelte
git commit -m "feat: add Panel component"
```

---

## Task 7: Refactor JSON Formatter page

**Files:**
- Modify: `src/routes/+page.svelte`

**Interfaces:**
- Consumes: `Panel`, `JsonInput`, `CopyButton` components; `parseJson` utility

- [ ] **Step 1: Refactor +page.svelte to use shared components**

Replace the content of `src/routes/+page.svelte` with:

```svelte
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

{#snippet JsonNode(value: unknown, path: string, depth: number)}
  {#if isCollapsible(value)}
    {@const isArr = Array.isArray(value)}
    {@const entries = isArr ? (value as unknown[]).map((v, i) => [i, v]) : Object.entries(value as Record<string, unknown>)}
    {@const isCollapsed = collapsed.has(path)}
    {@const open = isArr ? '[' : '{'}
    {@const close = isArr ? ']' : '}'}
    <div class="block">
      <div class="opener">
        <button class="toggle" type="button" onclick={() => toggle(path)} aria-label={isCollapsed ? 'Expand' : 'Collapse'}>{isCollapsed ? '▶' : '▼'}</button>
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
              {@render JsonNode(val, `${path}.${key}`, depth + 1)}
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

  .tree {
    white-space: nowrap;
  }

  :root {
    --gutter: 1.5rem;
  }

  .opener,
  .closer,
  .leaf {
    display: flex;
    align-items: baseline;
  }

  .toggle {
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

  .toggle:hover {
    color: var(--color-primary);
    background: var(--color-bg-secondary);
  }

  .gutter {
    display: inline-block;
    width: var(--gutter);
    flex-shrink: 0;
  }

  .children {
    padding-left: var(--gutter);
  }

  .bracket {
    color: var(--color-json-string);
  }

  .collapsed-hint {
    color: var(--color-text-dim);
    font-style: italic;
    font-size: 0.8rem;
  }

  .key {
    color: var(--color-primary);
  }

  .colon {
    color: var(--color-text-muted);
  }

  .comma {
    color: var(--color-text-muted);
  }

  .json-string {
    color: var(--color-json-string);
  }

  .json-number {
    color: var(--color-json-number);
  }

  .json-bool {
    color: var(--color-json-bool);
  }

  .json-null {
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
```

- [ ] **Step 2: Run verification**

Run: `npm run check && npm run build && npm test`
Expected: All checks pass

- [ ] **Step 3: Commit**

```bash
git add src/routes/+page.svelte
git commit -m "refactor: JSON Formatter uses shared components and utilities"
```

---

## Task 8: Refactor Type Generator page

**Files:**
- Modify: `src/routes/type-generator/+page.svelte`

**Interfaces:**
- Consumes: `Panel`, `JsonInput`, `CopyButton` components; `parseJson` utility; `generateType`, `generateExtractedTypes` from existing `typeGenerator.ts`

- [ ] **Step 1: Refactor type-generator/+page.svelte to use shared components**

Replace the content of `src/routes/type-generator/+page.svelte` with:

```svelte
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
```

- [ ] **Step 2: Run verification**

Run: `npm run check && npm run build && npm test`
Expected: All checks pass

- [ ] **Step 3: Commit**

```bash
git add src/routes/type-generator/+page.svelte
git commit -m "refactor: Type Generator uses shared components and utilities"
```

---

## Task 9: Refactor layout to import global.css

**Files:**
- Modify: `src/routes/+layout.svelte`

**Interfaces:**
- Consumes: `global.css`
- Produces: Global styles applied to entire app

- [ ] **Step 1: Refactor +layout.svelte**

Replace the content of `src/routes/+layout.svelte` with:

```svelte
<script lang="ts">
  import { page } from '$app/stores';
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();

  const navItems: { href: string; label: string }[] = [
    { href: '/', label: 'JSON Formatter' },
    { href: '/type-generator', label: 'Type Generator' }
  ];

  // Import global styles
  import '../styles/global.css';
</script>

<svelte:head>
  <title>JSON Tools</title>
  <meta name="description" content="A collection of browser-based JSON utilities: formatter, TypeScript type generator, and more. No data stored." />
</svelte:head>

<div class="app-shell">
  <nav class="nav-bar">
    <div class="nav-brand">JSON Tools</div>
    <div class="nav-links">
      {#each navItems as item}
        <a
          href={item.href}
          class="nav-link"
          class:active={$page.url.pathname === item.href}
        >{item.label}</a>
      {/each}
    </div>
  </nav>
  <div class="app-content">
    {@render children()}
  </div>
</div>

<style>
  .app-shell {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  .nav-bar {
    display: flex;
    align-items: center;
    gap: 2rem;
    padding: 0 var(--spacing-lg);
    height: 3.25rem;
    background: var(--color-bg-tertiary);
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
  }

  .nav-brand {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--color-primary);
    letter-spacing: -0.01em;
  }

  .nav-links {
    display: flex;
    gap: 0.25rem;
  }

  .nav-link {
    padding: 0.4rem 0.85rem;
    border-radius: var(--radius-sm);
    font-size: 0.8rem;
    font-weight: 500;
    color: var(--color-text-muted);
    text-decoration: none;
    transition: color 0.15s, background 0.15s;
  }

  .nav-link:hover {
    color: var(--color-text);
    background: var(--color-bg-secondary);
  }

  .nav-link.active {
    color: var(--color-text);
    background: var(--color-bg-secondary);
  }

  .app-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
</style>
```

- [ ] **Step 2: Run verification**

Run: `npm run check && npm run build && npm test`
Expected: All checks pass

- [ ] **Step 3: Commit**

```bash
git add src/routes/+layout.svelte
git commit -m "refactor: layout imports global.css and uses design tokens"
```

---

## Task 10: Final verification and regression test

**Files:**
- No file changes — this is a verification-only task

- [ ] **Step 1: Run full verification suite**

Run: `npm run check && npm run build && npm test`
Expected: All checks pass with zero errors

- [ ] **Step 2: Verify no .js files remain in src/**

Run: `find src -type f -name '*.js' | wc -l`
Expected: Output is `0`

- [ ] **Step 3: Start dev server and manually test both pages**

Run: `npm run dev -- --open`

In browser:
- Navigate to `/` (JSON Formatter)
  - Paste valid JSON → verify it beautifies correctly
  - Test Collapse All / Expand All buttons
  - Test Copy button
  - Test Clear button
  - Change indent setting
  - Paste invalid JSON → verify error message shows
- Navigate to `/type-generator` (Type Generator)
  - Paste valid JSON → verify TypeScript types generate correctly
  - Toggle between `interface` and `type` constructs
  - Toggle between `T[]` and `Array<T>` array syntax
  - Change root name
  - Toggle "Extract nested" checkbox
  - Test Copy button
  - Test Clear button
  - Paste invalid JSON → verify error message shows

- [ ] **Step 4: Verify production build**

Run: `npm run preview`

In browser:
- Verify both pages work identically in production build
- Verify all styling is correct (colors, spacing, typography match original)
- Verify responsive layout on mobile viewport (resize browser to < 768px)

- [ ] **Step 5: Commit (if any fixes needed)**

If any issues were found and fixed:

```bash
git add -A
git commit -m "fix: resolve issues found in final verification"
```

Otherwise, no commit needed.

---

## Plan complete

All 10 tasks defined with:
- Exact file paths
- Complete code for each step
- Exact commands with expected output
- Frequent commits (one per task)
- TDD where applicable (Tasks 1-2)

**Next:** Execute this plan using subagent-driven-development (recommended) or executing-plans skill.
