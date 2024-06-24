<template>
  <div class="qti-index">
    <slot></slot>
  </div>
</template>

<script>
/*
 * The index operator takes a sub-expression with an ordered container value and any base-type.
 * The result is the nth value of the container. The result has the same base-type as the
 * sub-expression but single cardinality.
 * The first value of a container has index 1, the second 2 and so on. 'n' must be a positive integer.
 * If 'n' exceeds the number of values in the container (or the sub-expression is NULL) then the
 * result of the index operator is NULL. If 'n' is an identifier, it is the value of 'n' at
 * runtime that is used.
 */
import { store } from '@/store/store'
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'

const qtiProcessing = new QtiProcessing()

export default {
  name: 'QtiIndex',

  props: {
    /*
     * Identification of the index ordinal value required.
     * May be an integer or an identifier.
     */
    n: {
      type: String,
      required: true
    }
  },

  data () {
    return {
      value: null,
      valueBaseType: null,
      valueCardinality: 'single',
      expression: null,
      // This resolves to an integer if 'n' is not an identifier
      valueN: null,
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
      if (countExpression !== 1) {
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
        if (expression.getCardinality() !== 'ordered') {
          throw new QtiValidationException('Expression must be of cardinality="ordered"')
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
        this.setBaseType(this.expression.getBaseType())

        // Resolve n
        const nValue = this.getNValue()

        // If 'n' refers to a variable whose value is less than 1, or if
        // the value is null, the value of the whole expression is NULL.
        // the value of the whole expression is NULL.
        if ((nValue === null) || (nValue < 1)) {
          console.log('[Index][' + nValue + ']', null)
          this.setValue(qtiProcessing.nullValue())
          return this.getValue()
        }

        if (qtiProcessing.isNullValue(value)) {
          console.log('[Index][' + nValue + ']', null)
          this.setValue(qtiProcessing.nullValue())
          return this.getValue()
        }

        if ((value.length) && (value.length < nValue)) {
          console.log('[Index][' + nValue + ']', null)
          this.setValue(qtiProcessing.nullValue())
          return this.getValue()
        }

        const indexValue = value[nValue-1]
        console.log('[Index][' + nValue + ']', indexValue)
        this.setValue(indexValue)
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
    },

    /**
     * @description Utility method to resolve an 'n'
     * value from an integer or an identifier.
     */
    getNValue () {
      if (this.valueN !== null) {
        return (this.valueN)
      }
      let declaration = store.getVariableDeclaration(this.n)
      // Return the variable's value.  Return 0 if variable is somehow not found.
      return (declaration !== null ? declaration.value : 0)
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
