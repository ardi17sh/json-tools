<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();

  const navItems: { href: string; label: string }[] = [
    { href: '/', label: 'Formatter' },
    { href: '/diff', label: 'Diff' },
    { href: '/type-generator', label: 'Types' }
  ];

  function handleShortcut(event: KeyboardEvent) {
    if (!(event.metaKey || event.ctrlKey) || !['1', '2', '3'].includes(event.key)) return;
    event.preventDefault();
    void goto(navItems[Number(event.key) - 1].href);
  }

  import '../styles/global.css';
</script>

<svelte:head>
  <title>JSON Tools</title>
  <meta name="description" content="Fast, private JSON utilities for formatting, comparison, and type generation." />
</svelte:head>
<svelte:window onkeydown={handleShortcut} />

<div class="app-shell">
  <nav class="nav-bar" aria-label="Primary navigation">
    <a class="nav-brand" href="/" aria-label="JSON Tools home">
      <span class="brand-mark" aria-hidden="true">&#123;&#125;</span>
      <span>json<span class="brand-muted">.tools</span></span>
    </a>
    <div class="nav-links">
      {#each navItems as item}
        <a href={item.href} class:active={$page.url.pathname === item.href} class="nav-link">
          <span>{item.label}</span>
        </a>
      {/each}
    </div>

    <div class="nav-meta">
      <span class="local-status"><span class="status-dot"></span>Local only</span>
    </div>
  </nav>
  <div class="app-content">{@render children()}</div>
</div>

<style>
  .app-shell {
    display: flex;
    min-height: 100vh;
    flex-direction: column;
  }

  .nav-bar {
    display: flex;
    align-items: center;
    gap: 2rem;
    height: 3.75rem;
    padding: 0 clamp(1rem, 3vw, 2.75rem);
    background: rgba(11, 13, 18, 0.92);
    border-bottom: 1px solid var(--color-border);
    position: sticky;
    top: 0;
    z-index: 10;
    backdrop-filter: blur(14px);
  }

  .nav-brand {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    flex-shrink: 0;
    color: var(--color-text);
    font-family: var(--font-mono);
    font-size: 0.86rem;
    font-weight: 700;
    letter-spacing: -0.03em;
    text-decoration: none;
  }

  .brand-mark {
    display: grid;
    place-items: center;
    width: 1.55rem;
    height: 1.55rem;
    color: var(--color-primary);
    background: rgba(138, 180, 255, 0.1);
    border: 1px solid rgba(138, 180, 255, 0.3);
    border-radius: 5px;
    font-size: 0.76rem;
  }

  .brand-muted {
    color: var(--color-text-muted);
    font-weight: 500;
  }

  .nav-links {
    display: flex;
    align-self: stretch;
    gap: 0.2rem;
  }

  .nav-link {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    padding: 0 0.8rem;
    color: var(--color-text-muted);
    font-size: 0.78rem;
    font-weight: 600;
    text-decoration: none;
    border-bottom: 2px solid transparent;
    transition: color 120ms ease, background 120ms ease, border-color 120ms ease;
  }

  .nav-link:hover {
    color: var(--color-text);
    background: rgba(255, 255, 255, 0.025);
  }

  .nav-link.active {
    color: var(--color-text);
    border-bottom-color: var(--color-primary);
  }

  .nav-meta {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-left: auto;
    color: var(--color-text-dim);
    font-family: var(--font-mono);
    font-size: 0.64rem;
  }

  .local-status {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    white-space: nowrap;
  }

  .status-dot {
    width: 0.4rem;
    height: 0.4rem;
    border-radius: 50%;
    background: var(--color-success);
    box-shadow: 0 0 8px rgba(126, 214, 165, 0.7);
  }

  @media (max-width: 620px) {
    .nav-bar {
      gap: 0.8rem;
      overflow-x: auto;
    }

    .nav-links {
      flex-shrink: 0;
    }

    .nav-link {
      padding-inline: 0.55rem;
    }

    .nav-meta {
      display: none;
    }
  }
</style>
