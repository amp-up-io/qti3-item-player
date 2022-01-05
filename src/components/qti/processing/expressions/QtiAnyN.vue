<template>
  <div class="qti-anyn">
    <slot></slot>
  </div>
</template>

<script>
/*
 * The qti-any-n operator takes one or more sub-expressions each with a base-type of boolean
 * and single cardinality. The result is a single boolean which is 'true' if at least min of
 * the sub-expressions are 'true' and at most max of the sub-expressions are 'true'. If more
 * than n - min sub-expressions are 'false' (where n is the total number of sub-expressions)
 * or more than max sub-expressions are 'true' then the result is 'false'. If one or more
 * sub-expressions are NULL then it is possible that neither of these conditions is satisfied,
 * in which case the operator results in NULL. For example, if min is 3 and max is 4 and the
 * sub-expressions have values {true,true,false,NULL} then the operator results in NULL
 * whereas {true,false,false,NULL} results in false and {true,true,true,NULL} results in 'true'.
 * The result NULL indicates that the correct value for the operator cannot be determined.
 */
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiParseException from '@/components/qti/exceptions/QtiParseException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'

const qtiAttributeValidation = new QtiAttributeValidation()
const qtiProcessing = new QtiProcessing()

export default {
  name: 'QtiAnyN',

  props: {
    /*
     * The minimum number of sub-expressions that must be true.
     */
    min: {
      type: String,
      required: true
    },
    /*
     * 	The maximum number of sub-expressions that must be true.
     */
    max: {
      type: String,
      required: true
    }
  },

  data () {
    return {
      value: null,
      valueBaseType: 'boolean',
      valueCardinality: 'single',
      expressions: [],
      valueMin: null,
      // Set to true if min resolves to a variable identifier
      isMinIdentifier: false,
      valueMax: null,
      // Set to true if max resolves to a variable identifier
      isMaxIdentifier: false,
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

    validateMinMaxAttribute(attributeName, attributeValue) {
      let declaration
      let isIdentifier = false

      // Try and resolve attribute as an identifier
      try {
        declaration =  qtiAttributeValidation.validateVariableIdentifierAttribute (this.$store, attributeValue)
        // If we get to this line of code then we believe that the attribute is
        // a variable identifier, not an integer value
        isIdentifier = true
      } catch (err) {
        if (err.name === 'QtiValidationException') {
          // NOOP
        } else {
          throw new Error(err.message)
        }
      }

      if (isIdentifier) {
        if ((declaration.baseType !== 'integer') || (declaration.cardinality !== 'single')) {
          throw new QtiValidationException('Invalid "' + attributeName + '" attribute.  The referenced variable must be of base-type "integer" and cardinality "single"')
        }

        if (attributeName === 'min') {
          this.isMinIdentifier = true
          return
        }

        if (attributeName === 'max') {
          this.isMaxIdentifier = true
          return
        }
      }

      // Try to parse the attribute as an integer.
      let value = qtiAttributeValidation.validatePositiveIntegerAttribute('min', attributeValue, true)

      if (attributeName === 'min') {
        this.valueMin = value
        return
      }

      if (attributeName === 'max') {
        this.valueMax = value
        return
      }
    },

    validateAttributes() {
      this.validateMinMaxAttribute('min', this.min)
      this.validateMinMaxAttribute('max', this.max)
      if (!this.isMinIdentifier && !this.isMaxIdentifier) {
        if (this.valueMax < this.valueMin) {
          throw new QtiValidationException('Invalid "max" and "min" attributes.  "max" (' + this.max  + ') must be greater than or equal to "min" (' + this.min + ')')
        }
      }
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
        let numberOfNull = 0
        let numberOfTrue = 0

        for (let i = 0; i < this.expressions.length; i++) {
          let value = this.expressions[i].evaluate()

          if (qtiProcessing.isNullValue(value)) {
            numberOfNull += 1
          } else if (value) {
            numberOfTrue += 1
          }
        }

        const minimum = this.getMinValue()
        let maximum = this.getMaxValue()
        maximum = (maximum > 0) ? maximum : 0;

        if (minimum > maximum) {
          console.log('[AnyN] value:', false)
          this.setValue(false)
          return this.getValue()
        }

        if ((numberOfTrue >= minimum) && ((numberOfTrue + numberOfNull) <= maximum)) {
          console.log('[AnyN] value:', true)
          this.setValue(true)
          return this.getValue()
        }

        if (((numberOfTrue + numberOfNull) < minimum) ||(numberOfTrue > maximum)) {
          console.log('[AnyN] value:', false)
          this.setValue(false)
          return this.getValue()
        }

        console.log('[AnyN] value:', null)
        this.setValue(qtiProcessing.nullValue())
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
    },

    /**
     * @description Utility method to resolve min
     * value from an integer or a variable declaration.
     */
    getMinValue () {
      if (this.valueMin !== null) {
        return (this.valueMin)
      }
      let declaration = this.$store.getters.getVariableDeclaration(this.min)
      // Return the variable's value.  Return 0 if variable is somehow not found.
      return (declaration !== null ? declaration.value : 0)
    },

    /**
     * @description Utility method to resolve max
     * value from an integer or a variable declaration.
     */
    getMaxValue () {
      if (this.valueMax !== null) {
        return (this.valueMax)
      }
      let declaration = this.$store.getters.getVariableDeclaration(this.max)
      // Return the variable's value.  Return 0 if variable is somehow not found.
      return (declaration !== null ? declaration.value : 0)
    }
  },

  created () {
    try {
      this.validateAttributes()
    } catch (err) {
      this.isQtiValid = false
      if (err.name === 'QtiValidationException') {
        throw new QtiValidationException(err.message)
      } else if (err.name === 'QtiParseException') {
        throw new QtiParseException(err.message)
      } else {
        throw new Error(err.message)
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
