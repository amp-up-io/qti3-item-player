<template>
  <div class="qti-variable">
  </div>
</template>

<script>
/*
 * This expression looks up the value of an itemVariable that has been declared in a corresponding
 * variableDeclaration or is one of the built-in variables. The result has the base-type and cardinality
 * declared for the variable subject to the type promotion of weighted outcomes (see below).
 *
 * Attribute : weightIdentifier [0..1]: identifier
 * An optional weighting to be applied to the value of the variable. Weights are defined only in the
 * test context (and hence only in outcomes processing) and only when the item identifier prefixing
 * technique (see above) is being used to look up the value of an item variable. The weight identifier
 * refers to a weight definition in the corresponding assessmentItemRef. If no matching definition is
 * found the weight is assumed to be 1.0.
 *
 * Weights only apply to item variables with base types integer and float. If the item variable is
 * of any other type the weight is ignored. All weights are treated as having base type float and
 * the resulting value is obtained by multiplying the variable's value by the associated weight.
 * When applying a weight to the value of a variable with base type integer the value is subject to
 * type promotion and the result of the expression has base type float.
 */
import { store } from '@/store/store'
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'

const qtiAttributeValidation = new QtiAttributeValidation()
const qtiProcessing = new QtiProcessing()

export default {
  name: 'QtiVariable',

  props: {
    identifier: {
      type: String,
      required: true
    },
    weightIdentifier: { // see above
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
        let declaration = qtiAttributeValidation.validateVariableIdentifierAttribute (store, this.identifier)

        if (typeof declaration === 'undefined') {
          this.setValue(qtiProcessing.nullValue())
          return this.getValue()
        }

        if (declaration.value === null) {
          console.log('[Variable][' + this.identifier + '] value:', null)
          this.setValue(qtiProcessing.nullValue())
          return this.getValue()
        }

        console.log('[Variable][' + this.identifier + '] value:', declaration.value)
        this.setValue(declaration.value)
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
      let variableDeclaration = qtiAttributeValidation.validateVariableIdentifierAttribute(store, this.identifier)
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
