<script>
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
		<div class="panel">
			<div class="panel-header">
				<span>Input</span>
			</div>
			<textarea
				class="input-area"
				placeholder="Paste your JSON here..."
				value={input}
				oninput={handleInput}
				spellcheck="false"
			></textarea>
		</div>

		<div class="panel">
			<div class="panel-header">
				<span>Output</span>
				<div class="panel-actions">
					{#if parsed !== null}
						<button class="small-btn" onclick={collapseAll}>Collapse All</button>
						<button class="small-btn" onclick={expandAll}>Expand All</button>
					{/if}
					<button class="copy-btn" onclick={copyOutput} disabled={parsed === null}>
						{copied ? '✓ Copied!' : 'Copy'}
					</button>
				</div>
			</div>
			{#if error}
				<div class="error">{error}</div>
			{:else if parsed !== null}
				<div class="output-area tree">
					{@render JsonNode(parsed, 'root', 0)}
				</div>
			{/if}
		</div>
	</main>
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
		color: #c0caf5;
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
