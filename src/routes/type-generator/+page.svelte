<script lang="ts">
	import { generateType, generateExtractedTypes } from '$lib/typeGenerator';
	import type { ExtractOptions } from '$lib/typeGenerator';

	let input = $state('');
	let parsed = $state<unknown>(null);
	let error = $state('');
	let copied = $state(false);

	let typeConstruct = $state<'interface' | 'type'>('interface');
	let arraySyntax = $state<'shorthand' | 'generic'>('shorthand');
	let rootName = $state('Root');
	let indent = $state(2);
	let extractNested = $state(true);

	const placeholder: string = 'Paste JSON here, e.g. {"name": "John", "age": 30}';

	function parse() {
		error = '';
		parsed = null;
		copied = false;

		if (!input.trim()) return;

		try {
			parsed = JSON.parse(input);
			while (typeof parsed === 'string') {
				try {
					parsed = JSON.parse(parsed);
				} catch {
					break;
				}
			}
		} catch (e: unknown) {
			error = e instanceof Error ? e.message : String(e);
		}
	}

	function handleInput(e: Event) {
		input = (e.target as HTMLTextAreaElement).value;
		parse();
	}

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

	async function copyOutput(): Promise<void> {
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
		<div class="panel">
			<div class="panel-header">
				<span>JSON Input</span>
			</div>
			<textarea
				class="input-area"
				placeholder={placeholder}
				value={input}
				oninput={handleInput}
				spellcheck="false"
			></textarea>
		</div>

		<div class="panel">
			<div class="panel-header">
				<span>TypeScript Output</span>
				<div class="panel-actions">
					<button class="copy-btn" onclick={copyOutput} disabled={parsed === null}>
						{copied ? '✓ Copied!' : 'Copy'}
					</button>
				</div>
			</div>
			{#if error}
				<div class="error">{error}</div>
			{:else if parsed !== null}
				<pre class="output-area">{getOutput()}</pre>
			{/if}
		</div>
	</main>
</div>

<style>
	.app {
		width: 100%;
		padding: 1rem 1.5rem;
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1.5rem;
		flex-wrap: wrap;
		gap: 1rem;
	}

	h1 {
		font-size: 1.5rem;
		font-weight: 600;
		color: #7aa2f7;
	}

	.controls {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
	}

	label {
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

	.text-input {
		background: #24283b;
		color: #c0caf5;
		border: 1px solid #3b4261;
		border-radius: 6px;
		padding: 0.4rem 0.6rem;
		font-size: 0.875rem;
		width: 6rem;
	}

	.text-input:focus {
		outline: none;
		border-color: #7aa2f7;
	}

	.checkbox-label {
		cursor: pointer;
	}

	.checkbox-label input[type="checkbox"] {
		accent-color: #7aa2f7;
		width: 0.9rem;
		height: 0.9rem;
		cursor: pointer;
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

	main {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		flex: 1;
		min-height: 0;
	}

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

	.output-area {
		flex: 1;
		padding: 1rem;
		font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
		font-size: 0.875rem;
		line-height: 1.6;
		overflow: auto;
		min-height: 500px;
		white-space: pre;
		margin: 0;
		color: #c0caf5;
	}

	.error {
		padding: 1rem;
		color: #f7768e;
		font-size: 0.875rem;
		font-family: monospace;
	}

	@media (max-width: 768px) {
		main {
			grid-template-columns: 1fr;
		}

		.input-area,
		.output-area {
			min-height: 250px;
		}

		header {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>
