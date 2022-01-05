<template v-slot:prompt>
  <div class="qti-prompt">
    <slot></slot>
  </div>
</template>

<script>
export default {
  name: 'QtiPrompt'
}
</script>

<style>
div.qti-prompt {
  display: block;
  width: 100%;
  margin: 8px 0;
}
</style>
