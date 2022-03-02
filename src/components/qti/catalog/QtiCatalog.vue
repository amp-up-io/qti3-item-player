<template>
  <div class="qti-catalog">
    <slot></slot>
  </div>
</template>

<script>
/*
 * The qti-catalog node holds one or more qti-cards.
 */
import Vue from 'vue'
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

    isCard (tag) {
      if (tag === 'qti-card') return true
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
          if (!this.isCard(slot.componentOptions.tag)) {
            throw new QtiValidationException('Invalid Catalog child node: "' + slot.componentOptions.tag + '"')
          }
        }
      })
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
        console.log('[QtiCatalog][Id:' + this.id + '][Cards]', this.cards)
      } catch (err) {
        this.isQtiValid = false
        throw new QtiValidationException(err.message)
      }
    }
  }
}
</script>
