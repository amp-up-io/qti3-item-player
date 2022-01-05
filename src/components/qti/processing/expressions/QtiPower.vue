<template>
  <div class="qti-power">
    <slot></slot>
  </div>
</template>

<script>
/*
 * The power operator takes 2 sub-expression which both have single cardinality and
 * numerical base-types. The result is a single float that corresponds to the first
 * expression raised to the power of the second. If either or the sub-expressions is
 * NULL then the operator results in NULL. If the resulting value is outside the
 * value set defined by float (not including positive and negative infinity) then
 * the operator shall result in NULL.
 */
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'

const qtiProcessing = new QtiProcessing()

export default {
  name: 'QtiPower',

  data () {
    return {
      value: null,
      valueBaseType: 'float',
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

    setBaseType (baseType) {
      this.valueBaseType = baseType
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
      this.$children.forEach((expression) => {
        if (!qtiProcessing.isBaseTypeNumeric(expression.getBaseType())) {
          throw new QtiValidationException('Expressions must be a numeric base-type')
        }
        if (expression.getCardinality() !== 'single') {
          throw new QtiValidationException('Expressions must be cardinality="single"')
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
          console.log('[Power][Value]', this.getValue())
          return this.getValue()
        }

        // BigNumber does not support non-integer exponents in its exponentiatedBy method.
        // Use Math.pow instead.
        this.setValue(Math.pow(firstValue, secondValue))
        console.log('[Power][Value]', this.getValue())
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
