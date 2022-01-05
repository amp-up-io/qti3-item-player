<template>
  <div class="qti-set-template-value">
    <slot></slot>
  </div>
</template>

<script>
/*
 * The setTemplateValue rule sets the value of a template variable to the value
 * obtained from the associated expression. A template variable can be updated with
 * reference to a previously assigned value, in other words, the template variable
 * being set may appear in the expression where it takes the value previously assigned
 * to it. Special care is required when using the numeric base-types because floating
 * point values can not be assigned to integer variables and vice-versa. The truncate,
 * round or integerToFloat operators must be used to achieve numeric type conversion.
 */
import { store } from '@/store/store'
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'

const qtiAttributeValidation = new QtiAttributeValidation()
const qtiProcessing = new QtiProcessing()

export default {
  name: 'QtiSetTemplateValue',

  props: {
    identifier: {
      type: String,
      required: true
    }
  },

  data () {
    return {
      isQtiValid: true,
      expression: null
    }
  },

  methods: {

    isValidSlot (slot) {
      if (typeof slot.componentOptions !== 'undefined') {
        return true
      } else {
        // check if text is something not empty
        if ((typeof slot.text !== 'undefined') && (slot.text.trim().length > 0)) {
          // not an empty text slot.  this is an error.
          throw new QtiValidationException('Invalid Child Node: "' + slot.text.trim() + '"')
        } else {
          // empty text slot.  not a component, but not an error
          return false
        }
      }
    },

    validateRequiredBaseTypeAndCardinality (declaration, expression) {
      if (declaration.baseType !== expression.getBaseType()) {
        throw new QtiValidationException('Template variable "' + declaration.identifier + '" has base-type "' + declaration.baseType + '" but Expression node has base-type "' + expression.getBaseType() + '"')
      }
      if (declaration.cardinality !== expression.getCardinality()) {
        throw new QtiValidationException('Template variable "' + declaration.identifier + '" has cardinality "' + declaration.cardinality + '" but Expression node has cardinality "' + expression.getCardinality() + '"')
      }
    },

    /**
     * Iterate through the child nodes:
     * expression (1)
     */
    validateChildren () {
      let countExpression = 0
      this.$slots.default.forEach((slot) => {
        if (this.isValidSlot(slot)) {
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
      this.validateRequiredBaseTypeAndCardinality(qtiAttributeValidation.validateTemplateIdentifierAttribute(store, this.identifier), this.$children[0])
      // All good.  Save off our children.
      this.processChildren()
    },

    processChildren () {
      this.expression = this.$children[0]
    },

    evaluate () {
      try {
        let value = this.expression.evaluate()

        let declaration = qtiAttributeValidation.validateTemplateIdentifierAttribute(store, this.identifier)
        if (typeof declaration === 'undefined') {
          throw new QtiEvaluationException('Template variable not found for identifier: "' + this.identifier + '"')
        }

        // Notify store of our value
        store.setTemplateVariableValue({
            identifier: this.identifier,
            value: value
          })

        console.log('[SetTemplateValue][' + this.identifier + '] value:', value)
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
      qtiAttributeValidation.validateTemplateIdentifierAttribute(store, this.identifier)
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
