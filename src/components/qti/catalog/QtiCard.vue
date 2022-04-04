<template>
  <div class="qti-card">
    <slot></slot>
  </div>
</template>

<script>
/*
 * A data structure within a catalog which contains dormant HTML content or a
 * resource reference for a specific support/feature. A card may also contain
 * multiple CardEntry containers. For example, you might have multiple CardEntry
 * nodes for different language versions of a particular support.
 *
 * The qti-card node holds the following elements:
 *   qti-card-entry
 *   qti-html-content
 *   qti-file-href
 */
import Vue from 'vue'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiCardEntry from '@/components/qti/catalog/QtiCardEntry'
import QtiHtmlContent from '@/components/qti/catalog/QtiHtmlContent'
import QtiFileHref from '@/components/qti/catalog/QtiFileHref'

const qtiAttributeValidation = new QtiAttributeValidation()

Vue.component('qti-card-entry', QtiCardEntry)
Vue.component('qti-html-content', QtiHtmlContent)
Vue.component('qti-file-href', QtiFileHref)

export default {
  name: 'QtiCard',

  props: {
    /*
     * This attribute names either pre-defined supports or a custom-named
     * support. The named support will indicate for whom the dormant content
     * is intended. Use only one card for any particular named support in
     * a catalog.
     */
    support: {
      type: String,
      required: true
    },
    'xml:lang': {
      type: String,
      required: false,
      default: ''
    },
  },

  data () {
    return {
      children: [],
      isQtiValid: true
    }
  },

  methods: {

    /**
     * @description Convenience method to provide the 'xml:lang' attribute.
     * @return {String} the language code or ''
     */
    getLanguage () {
      return this.$props['xml:lang']
    },

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
     * qti-card-entry, qti-html-content, or qti-file
     */
    validateChildren () {
      let countChildren = 0
      let firstChildTag = null
      this.$slots.default.forEach((slot) => {
        if (qtiAttributeValidation.isValidSlot(slot)) {
          // Slot must be one of: qti-card-entry, qti-html-content, qti-file-href
          if (!this.isValidCardChild(slot.componentOptions.tag)) {
            throw new QtiValidationException('Invalid Card Child node: "' + slot.componentOptions.tag + '"')
          }

          if ((countChildren > 0) && (slot.componentOptions.tag !== firstChildTag)) {
            throw new QtiValidationException('All Card Child elements must be the same element type: "' + firstChildTag + '"')
          }

          if ((countChildren > 0) && (slot.componentOptions.tag !== 'qti-card-entry')) {
            throw new QtiValidationException('Multiple Card Child elements of type "' + slot.componentOptions.tag + '" not permitted')
          }

          if (countChildren == 0) {
            firstChildTag = slot.componentOptions.tag
          }

          countChildren += 1
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

        // If any children, validate them
        if ('default' in this.$slots) {
          this.validateChildren()
        }

        console.log('[QtiCard][Support: ' + this.support + ' ]')
      } catch (err) {
        this.isQtiValid = false
        throw new QtiValidationException(err.message)
      }
    }
  }
}
</script>
