<template>
  <div class="qti-catalog-info">
    <slot></slot>
  </div>
</template>

<script>
/*
 * A CatalogInfo (qti-catalog-info) element is a container for supplemental
 * item content, or alternative accessibility content, that is defined to
 * enable the range of supported accessibility options to reconfigure the
 * assessment content. This content augments the original content that is
 * defined for the associated QTI feature.
 *
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
     * qti-catalog (1-*)
     */
    validateChildren () {

      if (!('default' in this.$slots)) {
        throw new QtiValidationException('Invalid CatalogInfo.  Must contain at least 1 qti-catalog child node')
      }

      let countChildren = 0
      this.$slots.default.forEach((slot) => {
        if (qtiAttributeValidation.isValidSlot(slot)) {
          // Must be qti-catalog
          if (!this.isCatalog(slot.componentOptions.tag)) {
            throw new QtiValidationException('Invalid CatalogInfo child node: "' + slot.componentOptions.tag + '"')
          }

          countChildren += 1
        }
      })

      if (countChildren == 0) {
        throw new QtiValidationException('Invalid CatalogInfo.  Must contain at least 1 qti-catalog child node')
      }
    }
  },

  mounted () {
    if (this.isQtiValid) {
      try {
        this.validateChildren()

        console.log('[QtiCatalogInfo]')
      } catch (err) {
        this.isQtiValid = false
        throw new QtiValidationException(err.message)
      }
    }
  }
}
</script>
