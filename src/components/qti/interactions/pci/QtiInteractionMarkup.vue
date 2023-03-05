<template>
  <div ref="root"
    class="qti-interaction-markup">
    <slot></slot>
  </div>
</template>

<script>
/*
 * This is the container for the HTML-based markup that is to be used in the associated PCI.
 */
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'

export default {
  name: 'QtiInteractionMarkup',

  props: {
  },

  data () {
    return {
      markup: '',
      isQtiValid: true
    }
  },

  inheritAttrs: true,

  methods: {

    getMarkup () {
      return this.markup
    },

    setMarkup (markup) {
      this.markup = markup
    }

  },

  mounted () {
    if (this.isQtiValid) {
      try {
        // Save entire contents
        this.setMarkup(this.$refs.root.innerHTML)
        
        console.log('[PCI][' + this.$options.name + ']')
      } catch (err) {
        this.isQtiValid = false
        console.log('[' + this.$options.name + '][ValidationError]', err.name, err.message)
        throw new QtiValidationException(err.message)
      }
    }
  }
}
</script>

<style>
div.qti-interaction-markup {
  display: none;
}
</style>
