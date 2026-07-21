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
