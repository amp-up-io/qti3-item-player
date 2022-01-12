<template>
  <div class="qti-catalog-info">
  </div>
</template>

<script>
/*
 * The qti-catalog-info node holds one or more catalogs. Catalogs hold and
 * reference item content that is presented to candidates based on their
 * candidate profile (PNP) requirements.
 */
import QtiValidationException from '@/shared/qti/exceptions/QtiValidationException'

export default {
  name: 'QtiCatalogInfo',

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
        console.log('[QtiCatalogInfo]')
      } catch (err) {
        this.isQtiValid = false
        throw new QtiValidationException(err.message)
      }
    }
  }
}
</script>
