<script lang="ts">
  interface Props {
    value?: string;
    placeholder?: string;
  }

  let { value = $bindable(''), placeholder = '' }: Props = $props();
  let scrollTop = $state(0);
  const lineCount = $derived(Math.max(1, value.split('\n').length));
</script>

<div class="editor-shell">
  <div class="line-numbers" aria-hidden="true" style:transform={`translateY(-${scrollTop}px)`}>
    {#each Array(lineCount) as _, index}
      <span>{index + 1}</span>
    {/each}
  </div>
  <textarea
    class="input-area"
    bind:value
    {placeholder}
    spellcheck="false"
    aria-label="JSON input"
    onscroll={(event) => (scrollTop = (event.currentTarget as HTMLTextAreaElement).scrollTop)}
  ></textarea>
</div>
