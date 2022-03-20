<template>
  <div ref="root" class="qti-html-content">
    <slot></slot>
  </div>
</template>

<script>
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'

export default {
  name: 'QtiHtmlContent',

  data () {
    return {
      content: null,
      isQtiValid: true
    }
  },

  methods: {

    getContent () {
      return this.content
    },

    setContent (content) {
      this.content = content
    },

    validateChildren () {
      // For now, no validation.
      // @TODO

      // Process children
      this.processChildren()
    },

    processChildren () {
      this.setContent(this.$refs.root.innerHTML)
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

<style>
.qti-html-content {
  display:none;
}
</style>
