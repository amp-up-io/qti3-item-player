<template>
  <div class="qti-product">
    <slot></slot>
  </div>
</template>

<script>
/*
 * The product operator takes 1 or more sub-expressions which all have numerical base-types and may have
 * single, multiple or ordered cardinality. The result is a single float or, if all sub-expressions are of
 * integer type, a single integer that corresponds to the product of the numerical values of the sub-expressions.
 * If any of the sub-expressions are NULL then the operator results in NULL.
 */
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'
import BigNumber from 'bignumber.js'

const qtiProcessing = new QtiProcessing()

export default {
  name: 'QtiProduct',

  data () {
    return {
      value: null,
      valueBaseType: 'integer',
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
     * expressions (1-n)
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
        throw new QtiValidationException('Must have at least one Expression node')
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
        let baseType = 'integer'
        let product = new BigNumber(1)

        for (let i = 0; i < this.expressions.length; i++) {
          let value = this.expressions[i].evaluate()

          // If a sub-expression is NULL then the operator result is Null
          if (qtiProcessing.isNullValue(value)) {
            console.log('[Product][' + this.getBaseType() + '] value:', null)
            this.setValue(qtiProcessing.nullValue())
            return this.getValue()
          }

          if (this.expressions[i].getBaseType() !== 'integer') {
            baseType = 'float'
          }

          let cardinality = this.expressions[i].getCardinality()
          if (cardinality === 'single') {
            product = product.times(value)
          } else if ((cardinality === 'multiple') || (cardinality === 'ordered')) {
            for (let j = 0; j < value.length; j++) {
              // If a sub-expression is NULL then the operator result is Null
              if (qtiProcessing.isNullValue(value[j])) {
                console.log('[Product][' + this.getBaseType() + '] value:', null)
                this.setValue(qtiProcessing.nullValue())
                return this.getValue()
              } else {
                product = product.times(value[j])
              }
            }
          }
        }

        if (baseType === 'integer') {
          console.log('[Product][Integer] value:', product.toNumber())
          if (!product.isInteger()) {
            throw new QtiEvaluationException('Expressions did not produce an integer value')
          }
          this.setBaseType('integer')
          this.setValue(product.toNumber())
          return this.getValue()
        }

        console.log('[Product][Float] value:', product.toNumber())
        this.setBaseType('float')
        this.setValue(product.toNumber())
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
