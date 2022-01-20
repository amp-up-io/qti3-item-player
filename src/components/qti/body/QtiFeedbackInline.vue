<template>
  <div ref="root" class="qti-feedback-inline hidden">
    <slot></slot>
  </div>
</template>

<script>
/*
 * This is feedback that is presented as inline content. Inline feedback that forms part of a Non-adaptive
 * Item must not contain an interaction object, either directly or indirectly. When an interaction is contained
 * in a hidden feedback it must also be hidden. The candidate must not be able to set or update the value of the
 * associated response variables. Feedback can be embedded inside each other, with one exception: feedBackInline
 * cannot contain feedbackBlock elements.
 */
import { store } from '@/store/store'
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'

const qtiAttributeValidation = new QtiAttributeValidation()

export default {
  name: 'QtiFeedbackInline',

  props: {
    /*
     * [1] multiplicity
     * The identifier that determines the visibility of the feedback in conjunction with the showHide characteristic.
     */
    identifier: {
      type: String,
      required: true
    },
    /*
     * [1] multiplicity
     * The identifier of an outcome variable that must have a base-type of identifier and be of either single
     * or multiple cardinality. The visibility of the feedback is controlled by assigning a value (or values)
     * to this outcome variable during responseProcessing.
     */
    outcomeIdentifier: {
      type: String,
      required: true
    },
    /*
     * [1] multiplicity
     * The showHide characteristic determines how the visibility of the qti-feedback-block is controlled.
     * If set to show then the modal is hidden by default and shown only if the associated outcome
     * variable matches, or contains, the value of the identifier characteristic. If set to hide then the
     * modal is shown by default and hidden if the associated outcome variable matches, or contains,
     * the value of the identifier characteristic.
     */
    showHide: {
      type: String,
      required: true
    }
  },

  data () {
    return {
      show: null,
      outcomeDeclaration: null,
      isQtiValid: true
    }
  },

  methods: {

    /**
     * @description This method hides or reveals the Feedback based
     * on the default showHide value.  If showHide is show, we hide.
     * If showHide is hide, we show.  It's very intuitive :)
     */
    defaultShowHide () {
      if (this.show) {
        // hide initially
        this.$refs.root.classList.add('hidden')
      } else {
        // show initially
        this.$refs.root.classList.remove('hidden')
      }
    },

    /**
     * @description This method shows or hides the Feedback based
     * on the show param value.  If show, we reveal, else we hide.
     * @param show (boolean)
     */
    display (show) {
      if (show) {
        // show
        this.$refs.root.classList.remove('hidden')
      } else {
        // hide
        this.$refs.root.classList.add('hidden')
      }
    },

    isOutcomeValueNull (value) {
      return (value === null ? true : false)
    },

    evaluate () {
      this.defaultShowHide()

      // Get outcomeDeclaration value
      this.outcomeDeclaration = qtiAttributeValidation.validateOutcomeIdentifierAttribute(store, this.outcomeIdentifier)

      if (this.outcomeDeclaration.cardinality === 'single') {
        if (this.isOutcomeValueNull(this.outcomeDeclaration.value)) return

        if (this.outcomeDeclaration.value === this.identifier) {
          this.display(this.show)
          return
        }

        // If hide is true, but we don't have an identifier match, show the feedback..
        if (!this.show) this.display(true)

        return
      }

      if (this.outcomeDeclaration.cardinality === 'multiple') {
        if (this.isOutcomeValueNull(this.outcomeDeclaration.value)) return

        for (let i = 0; i < this.outcomeDeclaration.value.length; i++) {
          if (this.outcomeDeclaration.value[i] === this.identifier) {
            this.display(this.show)
            return
          }
        }

        // If hide is true, but we don't have an identifier match, show the feedback..
        if (!this.show) this.display(true)
      }
    }

  },

  created () {
    try {
      let declaration = qtiAttributeValidation.validateOutcomeIdentifierAttribute(store, this.outcomeIdentifier)
      if (declaration.baseType !== 'identifier') {
        throw new QtiValidationException('Invalid outcome variable base-type: "' + declaration.baseType + '".  Must be "identifier".')
      }
      if ((declaration.cardinality !== 'single') && (declaration.cardinality !== 'multiple')) {
        throw new QtiValidationException('Invalid outcome variable cardinality: "' + declaration.cardinality + '".  Must be "single" or "multiple".')
      }
      qtiAttributeValidation.validateIdentifierAttribute(this.identifier)
      this.show = qtiAttributeValidation.validateShowHideAttribute(this.showHide)
    } catch (err) {
      this.isQtiValid = false
      if (err.name === 'QtiValidationException') {
        throw new QtiValidationException(err.message)
      } else {
        throw new Error(err.message)
      }
    }
  },

  mounted () {
    if (this.isQtiValid) {
      try {
        this.defaultShowHide()

        // Notify store of our new component
        store.defineFeedback({
            outcomeIdentifier: this.outcomeIdentifier,
            identifier: this.identifier,
            feedbackType: 'Inline',
            show: this.show,
            node: this
          })

        console.log('[FeedbackInline]', this)
      } catch (err) {
        this.isQtiValid = false
        throw new QtiValidationException(err.message)
      }
    }
  }
}
</script>

<style>
div.qti-feedback-inline {
  display: inline-block;
}
div.qti-feedback-inline.hidden {
  display: none;
}
</style>
