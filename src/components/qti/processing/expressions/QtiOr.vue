<template>
  <div class="qti-or">
    <slot></slot>
  </div>
</template>

<script>
/*
 * This provides the logic 'or' operation across one or more other operators. The or operator
 * takes one or more sub-expressions each with a base-type of boolean and single cardinality.
 * The result is a single boolean which is 'true' if any of the sub-expressions are 'true' and 'false'
 * if all of them are 'false'.
 * If one or more sub-expressions are NULL and all the others are false then the operator also results in NULL.
 */
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'

const qtiProcessing = new QtiProcessing()

export default {
  name: 'QtiOr',

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
        if (expression.getBaseType() !== 'boolean') {
          throw new QtiValidationException('Expressions must be of base-type="boolean"')
        }
        if (expression.getCardinality() !== 'single') {
          throw new QtiValidationException('Expressions must be of cardinality="single"')
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
        let hasNullValues = false

        for (let i = 0; i < this.expressions.length; i++) {
          let value = this.expressions[i].evaluate()
          // If one or more sub-expressions are NULL and all the others are false
          // then the operator also results in NULL.
          if (qtiProcessing.isNullValue(value)) {
            hasNullValues = true
          } else if (value === true) {
            console.log('[Or] value:', true)
            this.setValue(true)
            return this.getValue()
          }
        }

        if (hasNullValues) {
          console.log('[Or] value:', null)
          this.setValue(qtiProcessing.nullValue())
          return this.getValue()
        }

        console.log('[Or] value:', false)
        this.setValue(false)
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
