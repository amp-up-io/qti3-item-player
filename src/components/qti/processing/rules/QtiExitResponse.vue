<template>
  <div class="qti-exit-response">
  </div>
</template>

<script>
/*
 * The Exit Response rule terminates Response Processing immediately (for this invocation).
 */
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiExitProcessingException from '@/components/qti/exceptions/QtiExitProcessingException'

export default {
  name: 'QtiExitResponse',

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
      throw new QtiExitProcessingException('qti-exit-response')
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
