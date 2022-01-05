<template>
  <div class="qti-truncate">
    <slot></slot>
  </div>
</template>

<script>
/*
 * The truncate operator takes a single sub-expression which must have single
 * cardinality and a numerical base-type. The result is a value of base-type
 * integer formed by truncating the value of the sub-expression towards zero.
 * For example, the value 6.8 becomes 6 and the value -6.8 becomes -6. If the
 * sub-expression is NULL then the operator results in NULL. If the sub-expression
 * is NaN, then the result is NULL. If the sub-expression is INF, then the result
 * is INF. If the sub-expression is -INF, then the result is -INF.
 */
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'
import BigNumber from 'bignumber.js'

const qtiProcessing = new QtiProcessing()

export default {
  name: 'QtiTruncate',

  data () {
    return {
      value: null,
      valueBaseType: 'integer',
      valueCardinality: 'single',
      expression: null,
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
     * Examine the child node:
     * expressions (1)
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
      if (countExpression != 1) {
        throw new QtiValidationException('Must have exactly one Expression node')
      }
      // Perform extra semantic validations on the expressions
      this.validateExpressions()
      // All good.  Save off our children.
      this.processChildren()
    },

    validateExpressions () {
      this.$children.forEach((expression) => {
        if (!qtiProcessing.isBaseTypeNumeric(expression.getBaseType())) {
          throw new QtiValidationException('Expression must be a numeric base-type')
        }
        if (expression.getCardinality() !== 'single') {
          throw new QtiValidationException('Expression must be of cardinality "single"')
        }
      })
    },

    processChildren () {
      this.expression = this.$children[0]
    },

    evaluate () {
      try {
        let value = this.expression.evaluate()

        // If expression is NULL then the operator result is Null
        if (qtiProcessing.isNullValue(value)) {
          console.log('[Truncate][Value]', null)
          this.setValue(qtiProcessing.nullValue())
          return this.getValue()
        }

        value = new BigNumber(value)

        if (value.isNaN()) {
          this.setValue(qtiProcessing.nullValue())
          console.log('[Truncate][Value]', this.getValue())
          return this.getValue()
        }

        if (value.toNumber() == Infinity) {
          this.setValue(Infinity)
          console.log('[Truncate][Value]', this.getValue())
          return this.getValue()
        }

        if (value.toNumber() == -Infinity) {
          this.setValue(Infinity)
          console.log('[Truncate][Value]', this.getValue())
          return this.getValue()
        }

        this.setValue(value.integerValue(BigNumber.ROUND_DOWN).toNumber())
        console.log('[Truncate][Value]', this.getValue())
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
