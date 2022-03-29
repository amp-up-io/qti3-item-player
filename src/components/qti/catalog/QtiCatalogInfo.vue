<template>
  <div class="qti-catalog-info">
    <slot></slot>
  </div>
</template>

<script>
/*
 * The qti-catalog-info node holds one or more catalogs. Catalogs hold and
 * reference item content that is presented to candidates based on their
 * candidate profile (PNP) requirements.
 */
import Vue from 'vue'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiCatalog from '@/components/qti/catalog/QtiCatalog'

const qtiAttributeValidation = new QtiAttributeValidation()

Vue.component('qti-catalog', QtiCatalog)

export default {
  name: 'QtiCatalogInfo',

  data () {
    return {
      isQtiValid: true
    }
  },

  methods: {
    isCatalog (tag) {
      if (tag === 'qti-catalog') return true
      return false
    },

    /**
     * Iterate through the child nodes:
     * responseRule (*)
     */
    validateChildren () {
      this.$slots.default.forEach((slot) => {
        if (qtiAttributeValidation.isValidSlot(slot)) {
          // Must be qti-card
          if (!this.isCatalog(slot.componentOptions.tag)) {
            throw new QtiValidationException('Invalid CatalogInfo child node: "' + slot.componentOptions.tag + '"')
          }
        }
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

        console.log('[QtiCatalogInfo]')
      } catch (err) {
        this.isQtiValid = false
        throw new QtiValidationException(err.message)
      }
    }
  }
}
</script>
