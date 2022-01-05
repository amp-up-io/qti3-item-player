<template>
  <div class="qti-response-processing-fragment">
    <slot></slot>
  </div>
</template>

<script>
/*
 * A simple, transparent, group of Response Processing rules.  There are no semantics
 * associated with the execution properties of rules in a responseProcessingFragment.
 */
export default {
  name: 'QtiResponseProcessingFragment',

  mounted () {
    console.log('[QtiResponseProcessingFragment]')
  }
}
</script>
