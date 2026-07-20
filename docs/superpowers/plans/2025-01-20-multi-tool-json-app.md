# Multi-Tool JSON Application Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the existing JSON Beautifier into a multi-tool application with three independent tools (Beautifier, Formatter, TypeScript Generator) accessible via tab navigation.

**Architecture:** Single-page application with tab-based navigation. Each tool is a self-contained Svelte component with independent input/output state. Shared InputPanel and OutputPanel components provide consistent UI patterns across all tools.

**Tech Stack:** Svelte 5 (runes), SvelteKit, existing typeGenerator.js, Vitest for testing

## Global Constraints

- Use Svelte 5 runes ($state, $props, $derived) for all state management
- Maintain existing dark theme (Tokyo Night color scheme)
- Each tool must have independent state (no shared input between tools)
- Auto-detect and parse stringified JSON in all three tools
- Use existing typeGenerator.js for TypeScript generation (do not rewrite)
- Fixed 2-space indentation for JSON Formatter (no options)
- Tab navigation at top of page in header
- Default active tab: Beautifier

---

## File Structure

### New Files
- `src/lib/components/InputPanel.svelte` - Reusable textarea component
- `src/lib/components/OutputPanel.svelte` - Reusable output container component
- `src/lib/components/JsonBeautifier.svelte` - Tree view tool (extracted from +page.svelte)
- `src/lib/components/JsonFormatter.svelte` - Formatted string tool
- `src/lib/components/TypeScriptGenerator.svelte` - TypeScript generation tool

### Modified Files
- `src/routes/+page.svelte` - Replace with tab navigation and tool rendering

### Test Files
- `src/lib/components/InputPanel.test.js` - Component tests (optional)
- `src/lib/components/JsonFormatter.test.js` - Parsing logic tests

---

### Task 1: Create InputPanel Component

**Files:**
- Create: `src/lib/components/InputPanel.svelte`

**Interfaces:**
- Consumes: Nothing
- Produces: InputPanel component with props: `value`, `placeholder`, `onInput`

- [ ] **Step 1: Create InputPanel component**

```svelte
<script>
	let { value = '', placeholder = '', onInput } = $props();
</script>

<div class="panel">
	<div class="panel-header">
		<span>Input</span>
	</div>
	<textarea
		class="input-area"
		{placeholder}
		{value}
		{onInput}
		spellcheck="false"
	></textarea>
</div>

<style>
	.panel {
		display: flex;
		flex-direction: column;
		background: #24283b;
		border-radius: 10px;
		border: 1px solid #3b4261;
		overflow: hidden;
	}

	.panel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1rem;
		border-bottom: 1px solid #3b4261;
		background: #1f2335;
	}

	.panel-header span {
		font-size: 0.8rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #9aa5ce;
	}

	.input-area {
		flex: 1;
		background: transparent;
		color: #c0caf5;
		border: none;
		padding: 1rem;
		font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
		font-size: 0.875rem;
		line-height: 1.6;
		resize: none;
		min-height: 500px;
	}

	.input-area:focus {
		outline: none;
	}

	.input-area::placeholder {
		color: #565f89;
	}
</style>
```

- [ ] **Step 2: Verify component structure**

Run: `npm run check`
Expected: No TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/InputPanel.svelte
git commit -m "feat: add reusable InputPanel component"
```

---

### Task 2: Create OutputPanel Component

**Files:**
- Create: `src/lib/components/OutputPanel.svelte`

**Interfaces:**
- Consumes: Nothing
- Produces: OutputPanel component with slots: default (content), actions (buttons)

- [ ] **Step 1: Create OutputPanel component**

```svelte
<script>
	let { title = 'Output', children, actions } = $props();
</script>

<div class="panel">
	<div class="panel-header">
		<span>{title}</span>
		<div class="panel-actions">
			{@render actions?.()}
		</div>
	</div>
	<div class="output-area">
		{@render children?.()}
	</div>
</div>

<style>
	.panel {
		display: flex;
		flex-direction: column;
		background: #24283b;
		border-radius: 10px;
		border: 1px solid #3b4261;
		overflow: hidden;
	}

	.panel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1rem;
		border-bottom: 1px solid #3b4261;
		background: #1f2335;
	}

	.panel-header span {
		font-size: 0.8rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #9aa5ce;
	}

	.panel-actions {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.output-area {
		flex: 1;
		padding: 1rem;
		font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
		font-size: 0.875rem;
		line-height: 1.6;
		overflow: auto;
		min-height: 500px;
	}
</style>
```

- [ ] **Step 2: Verify component structure**

Run: `npm run check`
Expected: No TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/OutputPanel.svelte
git commit -m "feat: add reusable OutputPanel component"
```

---

### Task 3: Extract JsonBeautifier Component

**Files:**
- Create: `src/lib/components/JsonBeautifier.svelte`

**Interfaces:**
- Consumes: InputPanel, OutputPanel
- Produces: JsonBeautifier component (self-contained)

- [ ] **Step 1: Extract beautifier logic from +page.svelte into JsonBeautifier.svelte**

Create `src/lib/components/JsonBeautifier.svelte` with the complete beautifier implementation:

```svelte
<script>
	import InputPanel from './InputPanel.svelte';
	import OutputPanel from './OutputPanel.svelte';

	let input = $state('');
	let parsed = $state(null);
	let error = $state('');
	let indent = $state(2);
	let copied = $state(false);
	let collapsed = $state(new Set());

	function beautify() {
		error = '';
		parsed = null;
		copied = false;
		collapsed = new Set();

		if (!input.trim()) {
			return;
		}

		try {
			parsed = JSON.parse(input);
			// Auto-detect stringified JSON and un-stringify it
			while (typeof parsed === 'string') {
				try {
					parsed = JSON.parse(parsed);
				} catch {
					break;
				}
			}
		} catch (e) {
			error = e.message;
		}
	}

	function handleInput(e) {
		input = e.target.value;
		beautify();
	}

	function handleIndentChange(e) {
		indent = Number(e.target.value);
	}

	function getOutput() {
		if (parsed === null) return '';
		const space = indent === 0 ? '\t' : indent;
		return JSON.stringify(parsed, null, space);
	}

	async function copyOutput() {
		const text = getOutput();
		if (!text) return;
		try {
			await navigator.clipboard.writeText(text);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch {
			const ta = document.createElement('textarea');
			ta.value = text;
			document.body.appendChild(ta);
			ta.select();
			document.execCommand('copy');
			document.body.removeChild(ta);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		}
	}

	function clearAll() {
		input = '';
		parsed = null;
		error = '';
		copied = false;
		collapsed = new Set();
	}

	function toggle(path) {
		const next = new Set(collapsed);
		if (next.has(path)) {
			next.delete(path);
		} else {
			next.add(path);
		}
		collapsed = next;
	}

	function collapseAll() {
		const paths = new Set();
		if (parsed !== null && typeof parsed === 'object') {
			collectPaths(parsed, 'root');
		}
		collapsed = paths;

		function collectPaths(val, path) {
			if (val && typeof val === 'object') {
				paths.add(path);
				const entries = Array.isArray(val)
					? val.map((v, i) => [i, v])
					: Object.entries(val);
				for (const [k, v] of entries) {
					collectPaths(v, `${path}.${k}`);
				}
			}
		}
	}

	function expandAll() {
		collapsed = new Set();
	}

	function isCollapsible(val) {
		return val !== null && typeof val === 'object';
	}

	function formatValue(val) {
		if (val === null) return { text: 'null', cls: 'json-null' };
		if (typeof val === 'boolean') return { text: String(val), cls: 'json-bool' };
		if (typeof val === 'number') return { text: String(val), cls: 'json-number' };
		if (typeof val === 'string') return { text: `"${val}"`, cls: 'json-string' };
		return { text: String(val), cls: '' };
	}
</script>

<div class="tool-container">
	<InputPanel
		value={input}
		placeholder="Paste your JSON here..."
		onInput={handleInput}
	/>

	<OutputPanel title="Output">
		{#snippet actions()}
			<label class="indent-label">
				Indent:
				<select value={indent} onchange={handleIndentChange}>
					<option value={2}>2 spaces</option>
					<option value={4}>4 spaces</option>
					<option value={0}>Tab (\t)</option>
				</select>
			</label>
			{#if parsed !== null}
				<button class="small-btn" onclick={collapseAll}>Collapse All</button>
				<button class="small-btn" onclick={expandAll}>Expand All</button>
			{/if}
			<button class="copy-btn" onclick={copyOutput} disabled={parsed === null}>
				{copied ? '✓ Copied!' : 'Copy'}
			</button>
			<button onclick={clearAll}>Clear</button>
		{/snippet}

		{#if error}
			<div class="error">{error}</div>
		{:else if parsed !== null}
			<div class="tree">
				{@render JsonNode(parsed, 'root', 0)}
			</div>
		{/if}
	</OutputPanel>
</div>

{#snippet JsonNode(value, path, depth)}
	{#if isCollapsible(value)}
		{@const isArr = Array.isArray(value)}
		{@const entries = isArr ? value.map((v, i) => [i, v]) : Object.entries(value)}
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
	.tool-container {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		flex: 1;
		min-height: 0;
	}

	.indent-label {
		font-size: 0.875rem;
		color: #9aa5ce;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	select {
		background: #24283b;
		color: #c0caf5;
		border: 1px solid #3b4261;
		border-radius: 6px;
		padding: 0.4rem 0.6rem;
		font-size: 0.875rem;
		cursor: pointer;
	}

	select:focus {
		outline: none;
		border-color: #7aa2f7;
	}

	button {
		background: #3b4261;
		color: #c0caf5;
		border: 1px solid #4a5280;
		border-radius: 6px;
		padding: 0.4rem 1rem;
		font-size: 0.875rem;
		cursor: pointer;
		transition: background 0.15s, border-color 0.15s;
	}

	button:hover {
		background: #4a5280;
		border-color: #7aa2f7;
	}

	.small-btn {
		font-size: 0.7rem;
		padding: 0.25rem 0.6rem;
	}

	.copy-btn {
		font-size: 0.75rem;
		padding: 0.3rem 0.75rem;
	}

	.copy-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	/* Tree styles */
	.tree {
		white-space: nowrap;
	}

	/* Gutter width must match toggle width exactly */
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
		color: #565f89;
		font-size: 0.6rem;
		padding: 0;
		transition: color 0.1s, background 0.1s;
	}

	.toggle:hover {
		color: #7aa2f7;
		background: #3b4261;
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
		color: #9ece6a;
	}

	.collapsed-hint {
		color: #565f89;
		font-style: italic;
		font-size: 0.8rem;
	}

	.key {
		color: #7aa2f7;
	}

	.colon {
		color: #9aa5ce;
	}

	.comma {
		color: #9aa5ce;
	}

	/* Value colors */
	.json-string {
		color: #9ece6a;
	}

	.json-number {
		color: #ff9e64;
	}

	.json-bool {
		color: #bb9af7;
	}

	.json-null {
		color: #f7768e;
	}

	.error {
		color: #f7768e;
		font-size: 0.875rem;
		font-family: monospace;
	}

	@media (max-width: 768px) {
		.tool-container {
			grid-template-columns: 1fr;
		}
	}
</style>
```

- [ ] **Step 2: Verify component compiles**

Run: `npm run check`
Expected: No TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/JsonBeautifier.svelte
git commit -m "feat: extract JsonBeautifier component from +page.svelte"
```

---

### Task 4: Create JsonFormatter Component

**Files:**
- Create: `src/lib/components/JsonFormatter.svelte`
- Create: `src/lib/components/JsonFormatter.test.js`

**Interfaces:**
- Consumes: InputPanel, OutputPanel
- Produces: JsonFormatter component (self-contained)

- [ ] **Step 1: Write failing test for JSON parsing with auto-detection**

```javascript
import { describe, it, expect } from 'vitest';

// Helper function to test parsing logic
function parseJsonWithAutoDetect(input) {
	if (!input.trim()) return { parsed: null, error: '' };
	
	try {
		let parsed = JSON.parse(input);
		// Auto-detect stringified JSON
		while (typeof parsed === 'string') {
			try {
				parsed = JSON.parse(parsed);
			} catch {
				break;
			}
		}
		return { parsed, error: '' };
	} catch (e) {
		return { parsed: null, error: e.message };
	}
}

describe('JsonFormatter parsing logic', () => {
	it('parses regular JSON object', () => {
		const input = '{"id": 101, "name": "test"}';
		const result = parseJsonWithAutoDetect(input);
		expect(result.parsed).toEqual({ id: 101, name: 'test' });
		expect(result.error).toBe('');
	});

	it('parses stringified JSON (escaped quotes)', () => {
		const input = '{\\"id\\":101}';
		const result = parseJsonWithAutoDetect(input);
		expect(result.parsed).toEqual({ id: 101 });
		expect(result.error).toBe('');
	});

	it('parses double-stringified JSON', () => {
		const input = '"{\\"id\\":101}"';
		const result = parseJsonWithAutoDetect(input);
		expect(result.parsed).toEqual({ id: 101 });
		expect(result.error).toBe('');
	});

	it('returns error for invalid JSON', () => {
		const input = '{invalid json}';
		const result = parseJsonWithAutoDetect(input);
		expect(result.parsed).toBeNull();
		expect(result.error).toBeTruthy();
	});

	it('returns null for empty input', () => {
		const input = '   ';
		const result = parseJsonWithAutoDetect(input);
		expect(result.parsed).toBeNull();
		expect(result.error).toBe('');
	});

	it('parses arrays', () => {
		const input = '[1, 2, 3]';
		const result = parseJsonWithAutoDetect(input);
		expect(result.parsed).toEqual([1, 2, 3]);
		expect(result.error).toBe('');
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/components/JsonFormatter.test.js`
Expected: FAIL with "parseJsonWithAutoDetect is not defined"

- [ ] **Step 3: Extract parsing logic into utility function**

Create `src/lib/utils/parseJson.js`:

```javascript
export function parseJsonWithAutoDetect(input) {
	if (!input.trim()) return { parsed: null, error: '' };
	
	try {
		let parsed = JSON.parse(input);
		// Auto-detect stringified JSON
		while (typeof parsed === 'string') {
			try {
				parsed = JSON.parse(parsed);
			} catch {
				break;
			}
		}
		return { parsed, error: '' };
	} catch (e) {
		return { parsed: null, error: e.message };
	}
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/components/JsonFormatter.test.js`
Expected: All tests PASS

- [ ] **Step 5: Create JsonFormatter component**

```svelte
<script>
	import InputPanel from './InputPanel.svelte';
	import OutputPanel from './OutputPanel.svelte';
	import { parseJsonWithAutoDetect } from '$lib/utils/parseJson.js';

	let input = $state('');
	let copied = $state(false);

	let { parsed, error } = $derived(parseJsonWithAutoDetect(input));

	function handleInput(e) {
		input = e.target.value;
		copied = false;
	}

	function getOutput() {
		if (parsed === null) return '';
		return JSON.stringify(parsed, null, 2);
	}

	async function copyOutput() {
		const text = getOutput();
		if (!text) return;
		try {
			await navigator.clipboard.writeText(text);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch {
			const ta = document.createElement('textarea');
			ta.value = text;
			document.body.appendChild(ta);
			ta.select();
			document.execCommand('copy');
			document.body.removeChild(ta);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		}
	}

	function clearAll() {
		input = '';
		copied = false;
	}
</script>

<div class="tool-container">
	<InputPanel
		value={input}
		placeholder="Paste your JSON here..."
		onInput={handleInput}
	/>

	<OutputPanel title="Output">
		{#snippet actions()}
			<button class="copy-btn" onclick={copyOutput} disabled={parsed === null || !!error}>
				{copied ? '✓ Copied!' : 'Copy'}
			</button>
			<button onclick={clearAll}>Clear</button>
		{/snippet}

		{#if error}
			<div class="error">{error}</div>
		{:else if parsed !== null}
			<pre class="formatted-json">{getOutput()}</pre>
		{/if}
	</OutputPanel>
</div>

<style>
	.tool-container {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		flex: 1;
		min-height: 0;
	}

	button {
		background: #3b4261;
		color: #c0caf5;
		border: 1px solid #4a5280;
		border-radius: 6px;
		padding: 0.4rem 1rem;
		font-size: 0.875rem;
		cursor: pointer;
		transition: background 0.15s, border-color 0.15s;
	}

	button:hover {
		background: #4a5280;
		border-color: #7aa2f7;
	}

	.copy-btn {
		font-size: 0.75rem;
		padding: 0.3rem 0.75rem;
	}

	.copy-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.formatted-json {
		color: #c0caf5;
		white-space: pre-wrap;
		word-wrap: break-word;
		margin: 0;
	}

	.error {
		color: #f7768e;
		font-size: 0.875rem;
		font-family: monospace;
	}

	@media (max-width: 768px) {
		.tool-container {
			grid-template-columns: 1fr;
		}
	}
</style>
```

- [ ] **Step 6: Verify component compiles**

Run: `npm run check`
Expected: No TypeScript errors

- [ ] **Step 7: Commit**

```bash
git add src/lib/utils/parseJson.js src/lib/components/JsonFormatter.svelte src/lib/components/JsonFormatter.test.js
git commit -m "feat: add JsonFormatter component with auto-detect parsing"
```

---

### Task 5: Create TypeScriptGenerator Component

**Files:**
- Create: `src/lib/components/TypeScriptGenerator.svelte`

**Interfaces:**
- Consumes: InputPanel, OutputPanel, parseJsonWithAutoDetect, typeGenerator.js
- Produces: TypeScriptGenerator component (self-contained)

- [ ] **Step 1: Create TypeScriptGenerator component**

```svelte
<script>
	import InputPanel from './InputPanel.svelte';
	import OutputPanel from './OutputPanel.svelte';
	import { parseJsonWithAutoDetect } from '$lib/utils/parseJson.js';
	import { generateType } from '$lib/typeGenerator.js';

	let input = $state('');
	let copied = $state(false);
	
	// TypeScript generation options
	let typeConstruct = $state('interface'); // 'interface' | 'type'
	let rootName = $state('Root');
	let nestedMode = $state('inline'); // 'inline' | 'extracted'
	let arraySyntax = $state('shorthand'); // 'shorthand' | 'generic'

	let { parsed, error } = $derived(parseJsonWithAutoDetect(input));

	let typescriptOutput = $derived.by(() => {
		if (parsed === null || error) return '';
		
		try {
			const options = {
				indent: 2,
				arraySyntax,
				typeConstruct,
				nestedMode,
				rootName
			};
			
			if (nestedMode === 'inline') {
				return generateInlineType(parsed, options);
			} else {
				return generateExtractedTypes(parsed, options);
			}
		} catch (e) {
			return `// Error generating types: ${e.message}`;
		}
	});

	function generateInlineType(value, options) {
		const typeStr = generateType(value, options, 0);
		if (options.typeConstruct === 'interface') {
			return `interface ${options.rootName} ${typeStr}`;
		} else {
			return `type ${options.rootName} = ${typeStr};`;
		}
	}

	function generateExtractedTypes(value, options) {
		// For now, use inline generation
		// Extracted mode would collect nested objects and generate separate types
		// This is a simplified implementation
		return generateInlineType(value, options);
	}

	function handleInput(e) {
		input = e.target.value;
		copied = false;
	}

	async function copyOutput() {
		const text = typescriptOutput;
		if (!text) return;
		try {
			await navigator.clipboard.writeText(text);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch {
			const ta = document.createElement('textarea');
			ta.value = text;
			document.body.appendChild(ta);
			ta.select();
			document.execCommand('copy');
			document.body.removeChild(ta);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		}
	}

	function clearAll() {
		input = '';
		copied = false;
	}
</script>

<div class="tool-container">
	<InputPanel
		value={input}
		placeholder="Paste your JSON here..."
		onInput={handleInput}
	/>

	<OutputPanel title="TypeScript Output">
		{#snippet actions()}
			<button class="copy-btn" onclick={copyOutput} disabled={!typescriptOutput}>
				{copied ? '✓ Copied!' : 'Copy'}
			</button>
			<button onclick={clearAll}>Clear</button>
		{/snippet}

		<div class="controls">
			<div class="control-group">
				<label>Construct:</label>
				<button 
					class:active={typeConstruct === 'interface'}
					onclick={() => typeConstruct = 'interface'}
				>
					interface
				</button>
				<button 
					class:active={typeConstruct === 'type'}
					onclick={() => typeConstruct = 'type'}
				>
					type
				</button>
			</div>

			<div class="control-group">
				<label>Root name:</label>
				<input 
					type="text" 
					bind:value={rootName}
					class="root-name-input"
				/>
			</div>

			<div class="control-group">
				<label>Nested:</label>
				<button 
					class:active={nestedMode === 'inline'}
					onclick={() => nestedMode = 'inline'}
				>
					inline
				</button>
				<button 
					class:active={nestedMode === 'extracted'}
					onclick={() => nestedMode = 'extracted'}
				>
					extracted
				</button>
			</div>

			<div class="control-group">
				<label>Arrays:</label>
				<button 
					class:active={arraySyntax === 'shorthand'}
					onclick={() => arraySyntax = 'shorthand'}
				>
					T[]
				</button>
				<button 
					class:active={arraySyntax === 'generic'}
					onclick={() => arraySyntax = 'generic'}
				>
					Array&lt;T&gt;
				</button>
			</div>
		</div>

		{#if error}
			<div class="error">{error}</div>
		{:else if typescriptOutput}
			<pre class="typescript-output">{typescriptOutput}</pre>
		{/if}
	</OutputPanel>
</div>

<style>
	.tool-container {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		flex: 1;
		min-height: 0;
	}

	button {
		background: #3b4261;
		color: #c0caf5;
		border: 1px solid #4a5280;
		border-radius: 6px;
		padding: 0.4rem 1rem;
		font-size: 0.875rem;
		cursor: pointer;
		transition: background 0.15s, border-color 0.15s;
	}

	button:hover {
		background: #4a5280;
		border-color: #7aa2f7;
	}

	button.active {
		background: #7aa2f7;
		color: #1a1b26;
		border-color: #7aa2f7;
	}

	.copy-btn {
		font-size: 0.75rem;
		padding: 0.3rem 0.75rem;
	}

	.copy-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.controls {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		margin-bottom: 1rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid #3b4261;
	}

	.control-group {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.control-group label {
		font-size: 0.75rem;
		color: #9aa5ce;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.control-group button {
		font-size: 0.7rem;
		padding: 0.25rem 0.6rem;
	}

	.root-name-input {
		background: #24283b;
		color: #c0caf5;
		border: 1px solid #3b4261;
		border-radius: 6px;
		padding: 0.25rem 0.5rem;
		font-size: 0.875rem;
		width: 120px;
	}

	.root-name-input:focus {
		outline: none;
		border-color: #7aa2f7;
	}

	.typescript-output {
		color: #c0caf5;
		white-space: pre-wrap;
		word-wrap: break-word;
		margin: 0;
	}

	.error {
		color: #f7768e;
		font-size: 0.875rem;
		font-family: monospace;
	}

	@media (max-width: 768px) {
		.tool-container {
			grid-template-columns: 1fr;
		}
	}
</style>
```

- [ ] **Step 2: Verify component compiles**

Run: `npm run check`
Expected: No TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/TypeScriptGenerator.svelte
git commit -m "feat: add TypeScriptGenerator component with options"
```

---

### Task 6: Update +page.svelte with Tab Navigation

**Files:**
- Modify: `src/routes/+page.svelte`

**Interfaces:**
- Consumes: JsonBeautifier, JsonFormatter, TypeScriptGenerator
- Produces: Updated page with tab navigation

- [ ] **Step 1: Replace +page.svelte with tab navigation**

```svelte
<script>
	import JsonBeautifier from '$lib/components/JsonBeautifier.svelte';
	import JsonFormatter from '$lib/components/JsonFormatter.svelte';
	import TypeScriptGenerator from '$lib/components/TypeScriptGenerator.svelte';

	let activeTab = $state('beautifier'); // 'beautifier' | 'formatter' | 'typescript'
</script>

<div class="app">
	<header>
		<h1>JSON Tools</h1>
		<div class="tabs">
			<button 
				class:active={activeTab === 'beautifier'}
				onclick={() => activeTab = 'beautifier'}
			>
				Beautifier
			</button>
			<button 
				class:active={activeTab === 'formatter'}
				onclick={() => activeTab = 'formatter'}
			>
				Formatter
			</button>
			<button 
				class:active={activeTab === 'typescript'}
				onclick={() => activeTab = 'typescript'}
			>
				TypeScript
			</button>
		</div>
	</header>

	<main>
		{#if activeTab === 'beautifier'}
			<JsonBeautifier />
		{:else if activeTab === 'formatter'}
			<JsonFormatter />
		{:else if activeTab === 'typescript'}
			<TypeScriptGenerator />
		{/if}
	</main>
</div>

<style>
	:global(*) {
		margin: 0;
		padding: 0;
		box-sizing: border-box;
	}

	:global(body) {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		background: #1a1b26;
		color: #c0caf5;
		min-height: 100vh;
	}

	.app {
		max-width: 1400px;
		margin: 0 auto;
		padding: 1.5rem;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
		flex-wrap: wrap;
		gap: 1rem;
	}

	h1 {
		font-size: 1.5rem;
		font-weight: 600;
		color: #7aa2f7;
	}

	.tabs {
		display: flex;
		gap: 0.5rem;
	}

	.tabs button {
		background: #24283b;
		color: #9aa5ce;
		border: 1px solid #3b4261;
		border-radius: 6px;
		padding: 0.5rem 1rem;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.15s;
	}

	.tabs button:hover {
		background: #3b4261;
		color: #c0caf5;
	}

	.tabs button.active {
		background: #7aa2f7;
		color: #1a1b26;
		border-color: #7aa2f7;
		font-weight: 600;
	}

	main {
		flex: 1;
		min-height: 0;
	}

	@media (max-width: 768px) {
		header {
			flex-direction: column;
			align-items: flex-start;
		}

		.tabs {
			width: 100%;
		}

		.tabs button {
			flex: 1;
		}
	}
</style>
```

- [ ] **Step 2: Verify application compiles**

Run: `npm run check`
Expected: No TypeScript errors

- [ ] **Step 3: Test the application**

Run: `npm run dev`
Expected: Application starts, shows three tabs, each tool works independently

- [ ] **Step 4: Commit**

```bash
git add src/routes/+page.svelte
git commit -m "feat: add tab navigation to +page.svelte"
```

---

### Task 7: Update JsonBeautifier to Use Shared parseJson Utility

**Files:**
- Modify: `src/lib/components/JsonBeautifier.svelte`

**Interfaces:**
- Consumes: parseJsonWithAutoDetect from utils
- Produces: Refactored JsonBeautifier using shared utility

**Changes:** Replace the `beautify()` function and state management to use `$derived` with the shared parsing utility. The template and styles remain unchanged.

- [ ] **Step 1: Refactor JsonBeautifier script section**

In `src/lib/components/JsonBeautifier.svelte`, replace the `<script>` section (lines 1-130 approximately) with:

```svelte
<script>
	import InputPanel from './InputPanel.svelte';
	import OutputPanel from './OutputPanel.svelte';
	import { parseJsonWithAutoDetect } from '$lib/utils/parseJson.js';

	let input = $state('');
	let indent = $state(2);
	let copied = $state(false);
	let collapsed = $state(new Set());

	let { parsed, error } = $derived(parseJsonWithAutoDetect(input));

	// Reset collapsed when parsed changes
	$effect(() => {
		if (parsed) {
			collapsed = new Set();
		}
	});

	function handleInput(e) {
		input = e.target.value;
		copied = false;
	}

	function handleIndentChange(e) {
		indent = Number(e.target.value);
	}

	function getOutput() {
		if (parsed === null) return '';
		const space = indent === 0 ? '\t' : indent;
		return JSON.stringify(parsed, null, space);
	}

	async function copyOutput() {
		const text = getOutput();
		if (!text) return;
		try {
			await navigator.clipboard.writeText(text);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch {
			const ta = document.createElement('textarea');
			ta.value = text;
			document.body.appendChild(ta);
			ta.select();
			document.execCommand('copy');
			document.body.removeChild(ta);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		}
	}

	function clearAll() {
		input = '';
		copied = false;
		collapsed = new Set();
	}

	function toggle(path) {
		const next = new Set(collapsed);
		if (next.has(path)) {
			next.delete(path);
		} else {
			next.add(path);
		}
		collapsed = next;
	}

	function collapseAll() {
		const paths = new Set();
		if (parsed !== null && typeof parsed === 'object') {
			collectPaths(parsed, 'root');
		}
		collapsed = paths;

		function collectPaths(val, path) {
			if (val && typeof val === 'object') {
				paths.add(path);
				const entries = Array.isArray(val)
					? val.map((v, i) => [i, v])
					: Object.entries(val);
				for (const [k, v] of entries) {
					collectPaths(v, `${path}.${k}`);
				}
			}
		}
	}

	function expandAll() {
		collapsed = new Set();
	}

	function isCollapsible(val) {
		return val !== null && typeof val === 'object';
	}

	function formatValue(val) {
		if (val === null) return { text: 'null', cls: 'json-null' };
		if (typeof val === 'boolean') return { text: String(val), cls: 'json-bool' };
		if (typeof val === 'number') return { text: String(val), cls: 'json-number' };
		if (typeof val === 'string') return { text: `"${val}"`, cls: 'json-string' };
		return { text: String(val), cls: '' };
	}
</script>
```

**Note:** Keep the rest of the component (template, JsonNode snippet, and styles) exactly as created in Task 3. Only the `<script>` section changes.

- [ ] **Step 2: Verify component still works**

Run: `npm run dev`
Expected: Beautifier tool still works with tree view, collapse/expand, etc.

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/JsonBeautifier.svelte
git commit -m "refactor: use shared parseJson utility in JsonBeautifier"
```

---

### Task 8: Integration Testing

**Files:**
- No new files

**Interfaces:**
- Consumes: All three tool components
- Produces: Verified application

- [ ] **Step 1: Run all tests**

Run: `npm test`
Expected: All tests pass

- [ ] **Step 2: Run type checking**

Run: `npm run check`
Expected: No TypeScript errors

- [ ] **Step 3: Manual testing - Beautifier**

Test cases:
- Paste valid JSON object → tree view displays
- Paste stringified JSON `{"id":101}` → auto-parses and displays tree
- Click collapse/expand buttons → nodes toggle correctly
- Change indent option → copy output reflects change
- Click "Collapse All" → all nodes collapse
- Click "Expand All" → all nodes expand
- Click "Copy" → formatted JSON copied to clipboard
- Paste invalid JSON → error message displays

Expected: All test cases pass

- [ ] **Step 4: Manual testing - Formatter**

Test cases:
- Paste valid JSON object → formatted string displays with 2-space indent
- Paste stringified JSON `{"id":101}` → auto-parses and displays formatted
- Click "Copy" → formatted JSON copied to clipboard
- Paste invalid JSON → error message displays
- Verify no indent options are shown

Expected: All test cases pass

- [ ] **Step 5: Manual testing - TypeScript Generator**

Test cases:
- Paste valid JSON object → TypeScript type displays
- Toggle "interface" vs "type" → output changes correctly
- Change root name → output reflects new name
- Toggle "inline" vs "extracted" → output changes (currently same behavior)
- Toggle "T[]" vs "Array<T>" → array syntax changes
- Click "Copy" → TypeScript code copied to clipboard
- Paste invalid JSON → error message displays

Expected: All test cases pass

- [ ] **Step 6: Manual testing - Tab Navigation**

Test cases:
- Default tab is "Beautifier" → correct
- Click "Formatter" tab → Formatter tool displays
- Click "TypeScript" tab → TypeScript tool displays
- Switch tabs with different inputs → each tool maintains independent state
- Switch back to previous tab → input/output preserved

Expected: All test cases pass

- [ ] **Step 7: Test responsive design**

Test cases:
- Resize browser to mobile width → layout stacks vertically
- Tab buttons remain clickable on mobile
- All tools remain functional on mobile

Expected: All test cases pass

- [ ] **Step 8: Final commit (if any fixes were needed)**

```bash
git add .
git commit -m "fix: integration testing fixes"
```

---

## Summary

This implementation plan transforms the JSON Beautifier into a multi-tool application with:

1. **Shared components** (InputPanel, OutputPanel) for consistent UI
2. **Shared utility** (parseJsonWithAutoDetect) for consistent parsing
3. **Three independent tools** with their own state
4. **Tab navigation** for switching between tools
5. **Complete testing** of all functionality

Each task is small, testable, and commits working code. The plan follows TDD principles where applicable and maintains the existing dark theme throughout.
