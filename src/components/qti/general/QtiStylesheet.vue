<template>
  <div class="qti-stylesheet">
  </div>
</template>

<script>
/*
 * The set of external style sheets that are associated with the Item.
 * The order of definition is significant.
 */
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'

export default {
  name: 'QtiStylesheet',

  props: {
    /*
     * [1] multiplicity
     */
    href: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: false
    }
  },

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
