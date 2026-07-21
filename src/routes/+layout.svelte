<script lang="ts">
	import { page } from '$app/stores';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();

	const navItems: { href: string; label: string }[] = [
		{ href: '/', label: 'JSON Formatter' },
		{ href: '/type-generator', label: 'Type Generator' }
	];

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
