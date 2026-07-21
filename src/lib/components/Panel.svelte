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
