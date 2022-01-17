<template>
  <div class="qti-set-correct-response">
    <slot></slot>
  </div>
</template>

<script>
/*
 * The SetCorrectResponse rule results in the response variable having its correct value set.
 */
import { store } from '@/store/store'
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'

const qtiAttributeValidation = new QtiAttributeValidation()
const qtiProcessing = new QtiProcessing()

export default {
  name: 'QtiSetCorrectResponse',

  props: {
    identifier: {
      type: String,
      required: true
    }
  },

  data () {
    return {
      value: null,
      valueBaseType: null,
      valueCardinality: null,
      variableBaseType: null,
      variableCardinality: null,
      isQtiValid: true
    }
  },

  methods: {

    validateRequiredBaseTypeAndCardinality (declaration, expression) {
      if (declaration.cardinality !== expression.getCardinality()) {
        throw new QtiValidationException('Response variable has cardinality "' + declaration.cardinality + '" but Expression node has cardinality "' + expression.getCardinality() + '"')
      }
      // Special care is required when using the numeric base-types because floating point values can not be
      // assigned to integer variables and vice-versa. The truncate, round or integerToFloat operators must be
      // used to achieve numeric type conversion.  The truncate, round or integerToFloat operators must be used to
      // achieve numeric type conversion.
      if ((declaration.baseType === 'float') && (expression.getBaseType() === 'integer')) {
        throw new QtiValidationException('Integer values cannot be assigned to Floating point variables')
      }
      if ((declaration.baseType === 'integer') && (expression.getBaseType() === 'float')) {
        throw new QtiValidationException('Floating point values cannot be assigned to Integer variables')
      }
      if (declaration.baseType !== expression.getBaseType()) {
        throw new QtiValidationException('Response variable has base-type "' + declaration.baseType + '" but Expression node has base-type "' + expression.getBaseType() + '"')
      }
    },

    /**
     * Iterate through the child nodes:
     * expression (1)
     */
    validateChildren () {
      let countExpression = 0
      this.$slots.default.forEach((slot) => {
        if (qtiAttributeValidation.isValidSlot(slot)) {
          // Detect an expression
          if (qtiProcessing.isExpressionNode(slot.componentOptions.tag)) {
            countExpression += 1
          } else {
            throw new QtiValidationException('Node is not an Expression: "' + slot.componentOptions.tag + '"')
          }
        }
      })
      if (countExpression !== 1) {
        throw new QtiValidationException('Must have exactly one Expression node')
      }
      // Ensure declaration and expression have matching baseType and cardinality
      this.validateRequiredBaseTypeAndCardinality(qtiAttributeValidation.validateResponseIdentifierAttribute(store, this.identifier), this.$children[0])
      // All good.  Save off our children.
      this.processChildren()
    },

    processChildren () {
      this.expression = this.$children[0]
    },

    evaluate () {
      try {
        let value = this.expression.evaluate()

        let declaration = qtiAttributeValidation.validateResponseIdentifierAttribute(store, this.identifier)
        if (typeof declaration === 'undefined') {
          throw new QtiEvaluationException('Response variable not found for identifier: "' + this.identifier + '"')
        }

        // Notify store of our value
        store.setResponseVariableCorrectResponse({
            identifier: this.identifier,
            value: value
          })

        console.log('[SetCorrectResponse][' + this.identifier + '] value:', value)
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
      qtiAttributeValidation.validateResponseIdentifierAttribute(store, this.identifier)
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
