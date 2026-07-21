<script lang="ts">
  interface Props {
    value?: string;
    placeholder?: string;
  }

  let { value = $bindable(''), placeholder = '' }: Props = $props();
</script>

<textarea
  class="input-area"
  bind:value
  {placeholder}
  spellcheck="false"
></textarea>
