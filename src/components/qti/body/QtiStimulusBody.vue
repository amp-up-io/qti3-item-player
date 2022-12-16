<template>
  <div ref="root" class="qti-stimulus-body">
    <slot></slot>
  </div>
</template>

<script>
/*
 * The stimulus body for the Stimulus. The stimulus body contains the text, graphics,
 * media objects and interactions that describe the simulus's content and information
 * about how it is structured.
 */
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'

export default {
  name: 'QtiStimulusBody',

  data () {
    return {
      isQtiValid: true
    }
  },

  methods: {
    validateChildren () {
      // noop
    }
  },

  mounted () {
    if (this.isQtiValid) {
      try {
        this.validateChildren()

        // Notify our container that we are loaded.
        this.$parent.$emit('stimulusBodyReady', {
          stimulusBody: this
        })

        console.log('[QtiStimulusBody]')
      } catch (err) {
        this.isQtiValid = false
        throw new QtiValidationException(err.message)
      }
    }

  }

}
</script>

<style>
.qti-stimulus-body {
  font-size: inherit;
  font-weight: inherit;
  line-height: inherit;
}
</style>
