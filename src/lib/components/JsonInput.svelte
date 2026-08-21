<script lang="ts">
  interface Props {
    value?: string;
    placeholder?: string;
  }

  let { value = $bindable(''), placeholder = '' }: Props = $props();
</script>

<div class="editor-shell">
  <textarea
    class="input-area"
    bind:value
    {placeholder}
    spellcheck="false"
    aria-label="JSON input"
  ></textarea>
</div>
