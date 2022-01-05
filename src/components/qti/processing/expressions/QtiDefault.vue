<template>
  <div class="qti-default">
  </div>
</template>

<script>
/*
 * This expression looks up the declaration of an item variable and returns the associated defaultValue
 * or NULL if no default value was declared. When used in outcome processing item identifier prefixing
 * (see qti-variable) may be used to obtain the default value from an individual item.
 */
import { store } from '@/store/store'
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'

const qtiAttributeValidation = new QtiAttributeValidation()
const qtiProcessing = new QtiProcessing()

export default {
  name: 'QtiDefault',

  props: {
    identifier: {
      type: String,
      required: true
    },
    weightIdentifier: {
      type: String,
      required: false
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
        let declaration = qtiAttributeValidation.validateVariableIdentifierAttribute(store, this.identifier)

        if (typeof declaration === 'undefined') {
          this.setValue(qtiProcessing.nullValue())
          return this.getValue()
        }

        if (declaration.defaultValue === null) {
          console.log('[Default][' + this.identifier + '] value:', null)
          this.setValue(qtiProcessing.nullValue())
          return this.getValue()
        }

        console.log('[Default][' + this.identifier + '] value:', declaration.defaultValue)
        this.setValue(declaration.defaultValue)
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
      let declaration = qtiAttributeValidation.validateVariableIdentifierAttribute(store, this.identifier)
      this.setBaseType(declaration.baseType)
      this.setCardinality(declaration.cardinality)
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
