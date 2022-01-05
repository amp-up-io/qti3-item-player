<template>
  <div class="qti-delete">
    <slot></slot>
  </div>
</template>

<script>
/*
 * The qti-delete operator takes two sub-expressions which must both have the same base-type. The first
 * sub-expression must have single cardinality and the second must be a multiple or ordered container.
 * The result is a new container derived from the second sub-expression with all instances of the first
 * sub-expression removed. For example, when applied to A and {B,A,C,A} the result is the container {B,C}.
 * If either sub-expression is NULL the result of the operator is NULL. The restrictions that apply to the
 * qti-member operator also apply to the qti-delete operator.
 */
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'

const qtiProcessing = new QtiProcessing()

export default {
  name: 'QtiDelete',

  data () {
    return {
      value: null,
      valueBaseType: null,
      valueCardinality: null,
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

    setBaseType (baseType) {
      this.valueBaseType = baseType
    },

    getCardinality () {
      return this.valueCardinality
    },

    setCardinality (cardinality) {
      this.valueCardinality = cardinality
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
          if (expression.getCardinality() !== 'single') {
            throw new QtiValidationException('First expression must be cardinality="single"')
          }
          if (expression.getBaseType() === 'duration') {
            throw new QtiValidationException('First expression of base-type="duration" not permitted')
          }
          this.setBaseType(expression.getBaseType())
        } else {
          if (firstExpression.getBaseType() !== expression.getBaseType()) {
            throw new QtiValidationException('Expressions must be of same base-type')
          }
          if ((expression.getCardinality() !== 'multiple') && (expression.getCardinality() !== 'ordered')) {
            throw new QtiValidationException('Second expression must be cardinality="multiple" or cardinality="ordered"')
          }
          if (expression.getBaseType() === 'duration') {
            throw new QtiValidationException('Second expression of base-type="duration" not permitted')
          }
          this.setCardinality(expression.getCardinality())
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
          console.log('[Delete][Value]', qtiProcessing.nullValue())
          this.setValue(qtiProcessing.nullValue())
          return this.getValue()
        }

        let baseType = this.expressions[0].getBaseType()

        // Strategy: build a new container, skipping elements that match firstValue
        let value = []
        for (let i = 0; i < secondValue.length; i++) {
          if (!qtiProcessing.isNullValue(secondValue[i])) {
            if (!qtiProcessing.isSingleValuesMatch(baseType, firstValue, secondValue[i])) {
              value.push(secondValue[i])
            }
          }
        }

        // If empty container, return nullValue
        if (value.length === 0) {
          console.log('[Delete][Value]', qtiProcessing.nullValue())
          this.setValue(qtiProcessing.nullValue())
          return this.getValue()
        }

        console.log('[Delete][Value]', value)
        this.setValue(value)
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
