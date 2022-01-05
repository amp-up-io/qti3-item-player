<template>
  <div class="qti-exit-template">
  </div>
</template>

<script>
/*
 * The Exit Template rule terminates Template Processing immediately (for this invocation).
 */
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiExitProcessingException from '@/components/qti/exceptions/QtiExitProcessingException'

export default {
  name: 'QtiExitTemplate',

  data () {
    return {
      isQtiValid: true
    }
  },

  methods: {
    /**
     * Iterate through the child nodes:
     * There should be zero child nodes of this component.
     */
    validateChildren () {
      // TODO: ??
    },

    evaluate () {
      throw new QtiExitProcessingException('qti-exit-template')
    }
  },

  mounted () {
    if (this.isQtiValid) {
      try {
        // Validate children.
        this.validateChildren()
      } catch (err) {
        this.isQtiValid = false
        throw new QtiValidationException(err.message)
      }
    }
  }
}
</script>
