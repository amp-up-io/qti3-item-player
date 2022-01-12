<template>
  <div class="qti-companion-materials-info">
  </div>
</template>

<script>
/*
 * Companion materials are described within the qti-companion-materials-info node, and
 * include assessment materials that are required to be available to test takers while
 * answering a specific item. Materials may include interactive tools, like calculators or
 * rulers. The specific materials tags are:
 *
 * qti-calculator
 * qti-rule
 * qti-protractor
 * qti-digital-material
 */
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'

export default {
  name: 'QtiCompanionMaterialsInfo',

  data () {
    return {
      isQtiValid: true
    }
  },

  methods: {
    validateChildren () {
      // TODO
    }
  },

  mounted () {
    if (this.isQtiValid) {
      try {
        // Validate children.
        this.validateChildren()
        console.log('[' + this.$options.name + ']')
      } catch (err) {
        this.isQtiValid = false
        throw new QtiValidationException(err.message)
      }
    }
  }
}
</script>
