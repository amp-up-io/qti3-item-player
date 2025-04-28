<template>
  <div class="qti-contains">
    <slot></slot>
  </div>
</template>

<script>
/*
 * The contains operator takes two sub-expressions which must both have the same base-type and 
 * cardinality - either multiple or ordered. The result is a single boolean with a value of 
 * 'true' if the container given by the first sub-expression contains the value given by the 
 * second sub-expression and 'false' if it does not. Note that the contains operator works 
 * differently depending on the cardinality of the two sub-expressions. For unordered containers 
 * the values are compared without regard for ordering, for example, [A,B,C] contains [C,A]. 
 * Note that [A,B,C] does not contain [B,B] but that [A,B,B,C] does. For ordered containers 
 * the second sub-expression must be a strict sub-sequence within the first. In other words, 
 * [A,B,C] does not contain [C,A] but it does contain [B,C].
 * 
 * If either sub-expression is NULL then the result of the operator is NULL. 
 * Like the member operator, the contains operator should not be used on sub-expressions 
 * with a base-type of float and must not be used on sub-expressions with a base-type of duration.
 */
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'

const qtiProcessing = new QtiProcessing()

export default {
  name: 'QtiContains',

  data () {
    return {
      value: null,
      valueBaseType: 'boolean',
      valueCardinality: 'single',
      expressions: [],
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

    getCardinality () {
      return this.valueCardinality
    },

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

    /**
     * Iterate through the child nodes:
     * expressions (2)
     */
    validateChildren: function () {
      let countExpression = 0
      this.$slots.default.forEach((slot) => {
        if (this.isValidSlot(slot)) {
          // Detect an expression
          if (qtiProcessing.isExpressionNode(slot.componentOptions.tag)) {
            countExpression += 1
          } else {
            throw new QtiValidationException('[Contains] Node is not an Expression: "' + slot.componentOptions.tag + '"')
          }
        }
      })
      if (countExpression !== 2) {
        throw new QtiValidationException('[Contains] Must have exactly two Expression nodes')
      }
      // Perform extra semantic validations on the expressions
      this.validateExpressions()
      // All good.  Save off our children.
      this.processChildren()
    },

    validateExpressions () {
      let first = true
      let firstExpression = null
      this.$children.forEach((expression) => {
        if (first) {
          first = false
          firstExpression = expression
        } else {
          if (firstExpression.getBaseType() !== expression.getBaseType()) {
            throw new QtiValidationException('[Contains] Expressions must be of same base-type')
          }
          if (firstExpression.getCardinality() !== expression.getCardinality()) {
            throw new QtiValidationException('[Contains] Expressions must be of same cardinality')
          }
        }
        if ((expression.getCardinality() !== 'multiple') && (expression.getCardinality() !== 'ordered')) {
          throw new QtiValidationException('[Contains] Expressions must be cardinality="multiple" or cardinality="ordered"')
        }
        if (expression.getBaseType() === 'duration') {
          throw new QtiValidationException('[Contains] Expressions of base-type="duration" not permitted')
        }
      })
    },

    processChildren () {
      this.$children.forEach((expression) => {
        this.expressions.push(expression)
      })
    },

    evaluate () {
      try {
        let firstValue = this.expressions[0].evaluate()
        let secondValue = this.expressions[1].evaluate()

        if (qtiProcessing.isNullValue(firstValue) || qtiProcessing.isNullValue(secondValue)) {
          console.log('[Contains]', qtiProcessing.nullValue())
          this.setValue(qtiProcessing.nullValue())
          return this.getValue()
        }

        let firstExpression = this.expressions[0]

        if (firstExpression.getCardinality() === 'multiple') {
          this.setValue(qtiProcessing.isMultipleValuesContains(firstValue, secondValue))
        } else if (firstExpression.getCardinality() === 'ordered') {
          this.setValue(qtiProcessing.isOrderedValuesContains(firstValue, secondValue))
        }

        console.log('[Contains]', this.getValue())
        return this.getValue()
      } catch (err) {
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
