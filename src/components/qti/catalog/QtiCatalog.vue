<template>
  <div class="qti-catalog">
    <slot></slot>
  </div>
</template>

<script>
/*
 * A container of content or resource references that is outside the content
 * body node. A catalog holds support-specific dormant content that can be made
 * active (a part of the perceivable content presented to the candidate) based
 * on the candidate's PNP information (or an assessment program's settings).
 * A catalog is referenced from a specific portion of the content body by a
 * specific, unique identifier, which matches the catalog's identifier.
 * A catalog contains one or more "cards", each of which address a specific
 * support/feature.
 */
import Vue from 'vue'
import { store } from '@/store/store'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiCard from '@/components/qti/catalog/QtiCard'

const qtiAttributeValidation = new QtiAttributeValidation()

Vue.component('qti-card', QtiCard)

export default {
  name: 'QtiCatalog',

  props: {
    id: {
      type: String,
      required: true
    }
  },

  data () {
    return {
      cards: [],
      isQtiValid: true
    }
  },

  methods: {

    getCards () {
      return this.cards
    },

    isCard (tag) {
      if (tag === 'qti-card') return true
      return false
    },

    /**
     * Iterate through the child nodes:
     * qti-card (1-*)
     */
    validateChildren () {

      if (!('default' in this.$slots)) {
        throw new QtiValidationException('Invalid Catalog.  Must contain at least 1 qti-card child node')
      }

      let countChildren = 0
      this.$slots.default.forEach((slot) => {
        if (qtiAttributeValidation.isValidSlot(slot)) {
          // Must be qti-card
          if (!this.isCard(slot.componentOptions.tag)) {
            throw new QtiValidationException('Invalid Catalog child node: "' + slot.componentOptions.tag + '"')
          }

          countChildren += 1
        }
      })

      if (countChildren == 0) {
        throw new QtiValidationException('Invalid Catalog.  Must contain at least 1 qti-card child node')
      }

      // All good.  Save off our children.
      this.processChildren()
    },

    processChildren () {
      this.$children.forEach((card) => {
        this.cards.push(card)
      })
    }
  },

  mounted () {
    if (this.isQtiValid) {
      try {
        // Validate children.
        this.validateChildren()

        // Notify store of our new catalog
        store.defineCatalog({
            id: this.id,
            node: this
          })

        console.log('[QtiCatalog][Id: ' + this.id + ' ]')
      } catch (err) {
        this.isQtiValid = false
        throw new QtiValidationException(err.message)
      }
    }
  }
}
</script>
