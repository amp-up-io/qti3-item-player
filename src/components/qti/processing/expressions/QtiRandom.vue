<template>
  <div class="qti-random">
    <slot></slot>
  </div>
</template>

<script>
/*
 * The random operator takes a sub-expression with a multiple or ordered container value and any base-type.
 * The result is a single value randomly selected from the container. The result has the same base-type as
 * the sub-expression but single cardinality. If the sub-expression is NULL then the result is also NULL.
 */
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'

const qtiProcessing = new QtiProcessing()

export default {
  name: 'QtiRandom',

  data () {
    return {
      value: null,
      valueBaseType: null,
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
      if ((countExpression === 0) || (countExpression >= 2)) {
        throw new QtiValidationException('Must have exactly one Expression node')
      }
      // Perform extra semantic validations on the expression
      this.validateExpressions()
      // All good.  Save off our children.
      this.processChildren()
    },

    validateExpressions () {
      if (this.$children.length === 1) {
        let expression = this.$children[0]
        if ((expression.getCardinality() !== 'multiple') && (expression.getCardinality() !== 'ordered')) {
          throw new QtiValidationException('Expression must be of cardinality="multiple" or cardinality="ordered"')
        }
        this.setBaseType(expression.getBaseType())
      } else {
        throw new QtiValidationException('Must have exactly one Expression node')
      }
    },

    processChildren () {
      this.expression = this.$children[0]
    },

    evaluate () {
      try {
        let value = this.expression.evaluate()

        if (qtiProcessing.isNullValue(value)) {
          console.log('[Random] value:', null)
          this.setValue(qtiProcessing.nullValue())
          return this.getValue()
        }

        qtiProcessing.shuffleArray(value)
        console.log('[Random] value:', value)
        this.setValue(value[0])
        return this.getValue()
      } catch (err) {
        if (err.name === 'QtiValidationException') {
          throw new QtiValidationException(err.message)
        } else if (err.nae === 'QtiEvaluationException') {
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
