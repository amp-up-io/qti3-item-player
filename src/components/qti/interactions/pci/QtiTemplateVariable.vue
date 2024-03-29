<template>
  <div class="qti-template-variable">
  </div>
</template>

<script>
/*
 * QtiTemplateVariable is one of the permitted children of QtiPortableCustomInteraction.
 *
 * This allows an item author to bind a template variable to the PCI instance so that 
 * the delivery engine will provide the value of that variable to the PCI module on 
 * module initialization.
 */
import { store } from '@/store/store'
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'

const qtiAttributeValidation = new QtiAttributeValidation()
const qtiProcessing = new QtiProcessing()

export default {
  name: 'QtiTemplateVariable',

  props: {
    templateIdentifier: {
      type: String,
      required: true
    }
  },

  data () {
    return {
      value: null,
      valueBaseType: null,
      valueCardinality: null,
      isQtiValid: true
    }
  },

  methods: {

    getIdentifier () {
      return this.templateIdentifier
    },

    getValue () {
      return this.value
    },

    setValue (value) {
      this.value = value
    },

    isNull () {
      return qtiProcessing.isNullValue(this.value)
    },

    getBaseType () {
      return this.valueBaseType
    },

    setBaseType (baseType) {
      this.valueBaseType = baseType
    },

    getCardinality () {
      return this.valueCardinality
    },

    setCardinality (cardinality) {
      this.valueCardinality = cardinality
    },

    /**
     * Iterate through the child nodes:
     * There should be zero child nodes of this component.
     */
    validateChildren () {
      // TODO: ??
    },

    evaluate () {
      try {
        let declaration = qtiAttributeValidation.validateVariableIdentifierAttribute (store, this.getIdentifier())

        if (typeof declaration === 'undefined') {
          this.setValue(qtiProcessing.valueToPciJson(qtiProcessing.nullValue(), undefined, undefined))
          return this.getValue()
        }

        if (declaration.value === null) {
          console.log('[QtiTemplateVariable][' + this.getIdentifier() + '] value:', { "base": null })
          this.setValue(qtiProcessing.valueToPciJson(qtiProcessing.nullValue(), this.getBaseType(), this.getCardinality()))
          return this.getValue()
        }

        const pciValue = qtiProcessing.valueToPciJson(declaration.value, this.getBaseType(), this.getCardinality())

        console.log('[QtiTemplateVariable][' + this.getIdentifier() + '] value:', pciValue)

        this.setValue(pciValue)
        return this.getValue()
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
      let variableDeclaration = qtiAttributeValidation.validateVariableIdentifierAttribute(store, this.getIdentifier())
      this.valueBaseType = variableDeclaration.baseType
      this.valueCardinality = variableDeclaration.cardinality
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
        this.validateChildren()
      } catch (err) {
        this.isQtiValid = false
        throw new QtiValidationException(err.message)
      }
    }
  }
}
</script>

<style>
div.qti-template-variable {
  display: none;
}
</style>
