<template>
  <div ref="root" class="qti-template-block hidden">
    <slot></slot>
  </div>
</template>

<script>
/*
 * This class is used to define the block content structures that are available for the
 * creation of Item templates. A qti-template-block must not contain any interactions,
 * either directly or indirectly.
 */
import { store } from '@/store/store'
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'

const qtiAttributeValidation = new QtiAttributeValidation()

export default {
  name: 'QtiTemplateBlock',

  props: {
    /*
     * [1] multiplicity
     * The identifier characteristic, in conjunction with the showHide characteristic, determines
     * the visibility of the content block.
     */
    identifier: {
      type: String,
      required: true
    },
    /*
     * [1] multiplicity
     * The identifier of a template variable that must have a base-type of identifier and be of either single
     * or multiple cardinality.
     */
    templateIdentifier: {
      type: String,
      required: true
    },
    /*
     * [0..1] multiplicity
     * The showHide characteristic determines how the visibility of the qti-template-block is controlled.
     * If set to show then the template is hidden by default and shown only if the associated template
     * variable matches, or contains, the value of the identifier characteristic. If set to hide then the
     * template is shown by default and hidden if the associated template variable matches, or contains,
     * the value of the identifier characteristic.
     */
    showHide: {
      type: String,
      required: false,
      default: 'show'
    }
  },

  data () {
    return {
      value: null,
      templateDeclaration: null,
      show: true,
      isQtiValid: true
    }
  },

  methods: {

    evaluate () {
      try {
        // We hide at the beginning of evaluation
        this.hideTemplate()

        // Now, resolve the show/hide based on the evaluation of the identifier and the showHide property.
        this.templateDeclaration = qtiAttributeValidation.validateTemplateIdentifierAttribute(store, this.templateIdentifier)
        console.log('[QtiTemplateBlock][' + this.templateIdentifier + '][Show]', this.show)

        if (this.templateDeclaration.cardinality === 'single') {
          if (this.templateDeclaration.value === this.identifier) {
            if (this.show)
              this.showTemplate()
            else
              this.hideTemplate()

            return
          }

          // If hide is true, but we don't have an identifier match, show the template
          if (!this.show) this.showTemplate()

          return
        }

        if (this.templateDeclaration.cardinality === 'multiple') {
          for (let i = 0; i < this.templateDeclaration.value.length; i++) {
            if (this.templateDeclaration.value[i] === this.identifier) {
              if (this.show)
                this.showTemplate()
              else
                this.hideTemplate()

              return
            }
          }

          // If hide is true, but we don't have an identifier match, show the template
          if (!this.show) this.showTemplate()

          return
        }

      } catch (err) {
        this.isQtiValid = false
        if (err.name === 'QtiValidationException') {
          throw new QtiValidationException(err.message)
        } else if (err.name === 'QtiEvaluationException') {
          throw new QtiEvaluationException(err.message)
        } else {
          throw new Error(err.message)
        }
      }
    }

  },

  created () {
    try {
      let declaration = qtiAttributeValidation.validateTemplateIdentifierAttribute(store, this.templateIdentifier)
      if (declaration.baseType !== 'identifier') {
        throw new QtiValidationException('Invalid template variable base-type: "' + declaration.baseType + '".  Must be "identifier".')
      }
      if ((declaration.cardinality !== 'single') && (declaration.cardinality !== 'multiple')) {
        throw new QtiValidationException('Invalid template variable cardinality: "' + declaration.cardinality + '".  Must be "single" or "multiple".')
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

        // Notify store of our new component
        store.defineTemplate({
            node: this
          })

        this.evaluate()
      } catch (err) {
        this.isQtiValid = false
        if (err.name === 'QtiValidationException') {
          throw new QtiValidationException(err.message)
        } else if (err.name === 'QtiEvaluationException') {
          throw new QtiEvaluationException(err.message)
        } else {
          throw new Error(err.message)
        }
      }
    }
  }
}
</script>

<style>
div.qti-template-block {
  display: block;
}

div.qti-template-block.hidden {
  display: none;
}
</style>
