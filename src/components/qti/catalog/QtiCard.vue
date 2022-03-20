<template>
  <div class="qti-card">
    <slot></slot>
  </div>
</template>

<script>
/*
 * The qti-card node holds qti-html-content.
 */
import Vue from 'vue'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiHtmlContent from '@/components/qti/catalog/QtiHtmlContent'
//import QtiFileHref from '@/components/qti/catalog/QtiFileHref'

const qtiAttributeValidation = new QtiAttributeValidation()

 Vue.component('qti-html-content', QtiHtmlContent)
 //Vue.component('qti-file-href', QtiFileHref)

export default {
  name: 'QtiCard',

  props: {
    support: {
      type: String,
      required: true
    }
  },

  data () {
    return {
      children: [],
      isQtiValid: true
    }
  },

  methods: {

    getChildren () {
      return this.children
    },

    isValidCardChild (tag) {
      if (tag === 'qti-card-entry') return true
      if (tag === 'qti-html-content') return true
      if (tag === 'qti-file-href') return true
      return false
    },

    /**
     * Iterate through the child nodes:
     * responseRule (*)
     */
    validateChildren () {
      this.$slots.default.forEach((slot) => {
        if (qtiAttributeValidation.isValidSlot(slot)) {
          // Must be one of qti-card-entry, qti-html-content, qti-file-href
          if (!this.isValidCardChild(slot.componentOptions.tag)) {
            throw new QtiValidationException('Invalid Card Child node: "' + slot.componentOptions.tag + '"')
          }
        }
      })
      // All good.  Save off our children.
      this.processChildren()
    },

    processChildren () {
      this.$children.forEach((cardChild) => {
        this.children.push(cardChild)
      })
    }
  },

  mounted () {
    if (this.isQtiValid) {
      try {
        // Validate children.
        this.validateChildren()

        console.log('[QtiCard][Support: ' + this.support + ' ]')
      } catch (err) {
        this.isQtiValid = false
        throw new QtiValidationException(err.message)
      }
    }
  }
}
</script>
