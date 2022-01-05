<template>
  <div class="qti-max">
    <slot></slot>
  </div>
</template>

<script>
/*
 * The max operator takes 1 or more sub-expressions which all have numerical
 * base-types and may have single, multiple or ordered cardinality. The result
 * is a single float, or, if all sub-expressions are of integer type, a single
 * integer, equal in value to the greatest of the argument values, i.e. the
 * result is the argument closest to positive infinity. If the arguments have
 * the same value, the result is that same value. If any of the sub-expressions
 * is NULL, the result is NULL. If any of the sub-expressions is not a numerical
 * value, then the result is NULL.
 */
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'
import BigNumber from 'bignumber.js'

const qtiProcessing = new QtiProcessing()

export default {
  name: 'QtiMax',

  data () {
    return {
      value: null,
      valueBaseType: null,
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
     * Examine the child node:
     * expressions (1..n)
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
      if (countExpression === 0) {
        throw new QtiValidationException('Must have one or more Expression nodes')
      }
      // Perform extra semantic validations on the expression
      this.validateExpressions()
      // All good.  Save off our children.
      this.processChildren()
    },

    validateExpressions () {
      this.setBaseType('integer')
      this.$children.forEach((expression) => {
        if (!qtiProcessing.isBaseTypeNumeric(expression.getBaseType())) {
          throw new QtiValidationException('Expression must be a numeric base-type')
        }
        if (expression.getBaseType() === 'float') {
          this.setBaseType('float')
        }
        if ((expression.getCardinality() !== 'single') && (expression.getCardinality() !== 'multiple') && (expression.getCardinality() !== 'ordered')) {
          throw new QtiValidationException('Expressions must be of cardinality "single", "multiple", or "ordered"')
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
        this.setBaseType('integer')
        let max = new BigNumber(-Infinity)

        for (let i = 0; i < this.expressions.length; i++) {
          let value = this.expressions[i].evaluate()

          // If a sub-expression is NULL then the operator result is Null
          if (qtiProcessing.isNullValue(value)) {
            console.log('[Max][' + this.getBaseType() + ']', null)
            this.setValue(qtiProcessing.nullValue())
            return this.getValue()
          }

          if (this.expressions[i].getBaseType() !== 'integer') {
            this.setBaseType('float')
          }

          let cardinality = this.expressions[i].getCardinality()
          if (cardinality === 'single') {
            max = (max.comparedTo(value) < 0) ? new BigNumber(value) : max
          } else if ((cardinality === 'multiple') || (cardinality === 'ordered')) {
            for (let j = 0; j < value.length; j++) {
              // If a sub-expression is NULL then the operator result is Null
              if (qtiProcessing.isNullValue(value[j])) {
                console.log('[Max][' + this.getBaseType() + ']', null)
                this.setValue(qtiProcessing.nullValue())
                return this.getValue()
              } else {
                max = (max.comparedTo(value[j]) < 0) ? new BigNumber(value[j]) : max
              }
            }
          }
        }

        if (this.getBaseType() === 'integer') {
          console.log('[Max][Integer]', max.toNumber())
          if (!max.isInteger()) {
            throw new QtiEvaluationException('Expressions did not produce an integer value')
          }
          this.setValue(max.toNumber())
          return this.getValue()
        }

        console.log('[Max][Float]', max.toNumber())
        this.setValue(max.toNumber())
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
