<script>
	import { page } from '$app/stores';
	let { children } = $props();
	const navItems = [
		{ href: '/', label: 'JSON Formatter' },
		{ href: '/type-generator', label: 'Type Generator' }
	];
</script>

<svelte:head>
	<title>JSON Beautifier</title>
	<meta name="description" content="Paste JSON and get it beautifully formatted. No data stored." />
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

	.app-shell {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	.nav-bar {
		display: flex;
		align-items: center;
		gap: 2rem;
		padding: 0 1.5rem;
		height: 3.25rem;
		background: #1f2335;
		border-bottom: 1px solid #3b4261;
		flex-shrink: 0;
	}

	.nav-brand {
		font-size: 0.95rem;
		font-weight: 700;
		color: #7aa2f7;
		letter-spacing: -0.01em;
	}

	.nav-links {
		display: flex;
		gap: 0.25rem;
	}

	.nav-link {
		padding: 0.4rem 0.85rem;
		border-radius: 6px;
		font-size: 0.8rem;
		font-weight: 500;
		color: #9aa5ce;
		text-decoration: none;
		transition: color 0.15s, background 0.15s;
	}

	.nav-link:hover {
		color: #c0caf5;
		background: #24283b;
	}

	.nav-link.active {
		color: #c0caf5;
		background: #3b4261;
	}

	.app-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-height: 0;
	}
</style>
