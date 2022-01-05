<template>
  <div class="qti-match">
    <slot></slot>
  </div>
</template>

<script>
/*
 * The match operator takes two sub-expressions which must both have the same base-type and cardinality.
 * The result is a single boolean with a value of true if the two expressions represent the same value and
 * false if they do not. If either sub-expression is NULL then the operator results in NULL.

 * The match operator must not be confused with broader notions of equality such as numerical equality.
 * To avoid confusion, the match operator should not be used to compare subexpressions with base-types of
 * float and must not be used on sub-expressions with a base-type of duration.
 */
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'

const qtiProcessing = new QtiProcessing()

export default {
  name: 'QtiMatch',

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
            throw new QtiValidationException('Node is not an Expression: "' + slot.componentOptions.tag + '"')
          }
        }
      })
      if (countExpression !== 2) {
        throw new QtiValidationException('Must have exactly two Expression nodes')
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
            throw new QtiValidationException('Expressions must be of same base-type')
          }
          if (firstExpression.getCardinality() !== expression.getCardinality()) {
            throw new QtiValidationException('Expressions must be of same cardinality')
          }
          if (expression.getBaseType() === 'duration') {
            throw new QtiValidationException('Expressions of base-type duration not permitted')
          }
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
          this.setValue(qtiProcessing.nullValue())
          return this.getValue()
        }

        let firstExpression = this.expressions[0]

        if (firstExpression.getCardinality() == 'single') {
          return qtiProcessing.isSingleValuesMatch(firstExpression.getBaseType(), firstValue, secondValue)
        }

        if (firstExpression.getCardinality() == 'multiple') {
          return qtiProcessing.isMultipleValuesMatch(firstExpression.getBaseType(), firstValue, secondValue)
        }

        if (firstExpression.getCardinality() == 'ordered') {
          return qtiProcessing.isOrderedValuesMatch(firstExpression.getBaseType(), firstValue, secondValue)
        }

        if (firstExpression.getCardinality() == 'record') {
          // TODO:
          JSON.stringify(firstValue) === JSON.stringify(secondValue)
        }
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
