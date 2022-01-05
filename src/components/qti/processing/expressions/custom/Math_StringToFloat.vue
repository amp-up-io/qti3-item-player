<template>
  <div>
    <slot></slot>
  </div>
</template>

<script>
/*
 * Converts an argument of base-type string with single cardinality to
 * a result of base-type float with single cardinality.  If the argument
 * is NULL or NaN, then the result is NULL
 */
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'
import BigNumber from 'bignumber.js'

const qtiProcessing = new QtiProcessing()

export default {
  name: 'MathStringToFloat',

  data () {
    return {
      value: null,
      valueBaseType: 'float',
      valueCardinality: 'single',
      expression: null
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
      this.cardinality = cardinality
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
     * Should be 1 expression
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
      // Perform extra semantic validations on the expressions
      this.validateExpressions()
      // All good.  Save off our children.
      this.processChildren()
    },

    validateExpressions () {
      this.$children.forEach((expression) => {
        if (expression.getCardinality() !== 'single') {
          throw new QtiValidationException('Expression must be of cardinality="single"')
        }
        if (expression.getBaseType() !== 'string') {
          throw new QtiValidationException('Expression must be base-type="string"')
        }
      })
    },

    processChildren () {
      this.expression = this.$children[0]
    },

    evaluate () {
      try {
        let value = this.expression.evaluate()

        if (qtiProcessing.isNullValue(value)) {
          console.log('[math.StringToFloat][Value]', null)
          this.setValue(qtiProcessing.nullValue())
          return this.getValue()
        }

        value = new BigNumber(value)

        if (value.isNaN()) {
          console.log('[math.StringToFloat][Value]', null)
          this.setValue(qtiProcessing.nullValue())
          return this.getValue()
        }

        this.setValue(value.toNumber())
        console.log('[math.StringToFloat][Value]', this.getValue())
        return this.getValue()
      } catch (err) {
        if (err.nae === 'QtiEvaluationException') {
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
    try {
      this.validateChildren()

      // Notify the customOperator parent, and pass our evaluate function
      this.$parent.$emit('customOperatorReady', {
        baseType: this.getBaseType(),
        cardinality: this.getCardinality(),
        evaluate: this.evaluate
      })

    } catch (err) {
      throw new QtiValidationException(err.message)
    }
  }
}
</script>
