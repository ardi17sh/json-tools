<script lang="ts">
  interface Props {
    query?: string;
    index: number;
    count: number;
    placeholder?: string;
    onprev: () => void;
    onnext: () => void;
  }

  let {
    query = $bindable(''),
    index,
    count,
    placeholder = 'Search...',
    onprev,
    onnext,
  }: Props = $props();

  function handleKeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    (event.shiftKey ? onprev : onnext)();
  }
</script>

<div class="search-controls">
  <input
    class="text-input search-input"
    type="search"
    bind:value={query}
    {placeholder}
    aria-label={placeholder}
    onkeydown={handleKeydown}
  />
  <button class="small-btn search-nav" type="button" aria-label="Previous match" disabled={count === 0} onclick={() => onprev()}>
    ←
  </button>
  <button class="small-btn search-nav" type="button" aria-label="Next match" disabled={count === 0} onclick={() => onnext()}>
    →
  </button>
  <span class="search-count" aria-live="polite">{count ? `${index + 1}/${count}` : '0/0'}</span>
</div>
