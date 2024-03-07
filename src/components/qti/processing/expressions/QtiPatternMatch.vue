<template>
  <div class="qti-pattern-match">
    <slot></slot>
  </div>
</template>

<script>
/*
 * The qti-pattern-match expression takes a sub-expression which must have single cardinality and a
 * base-type of string. The result is a single boolean with a value of true if the sub-expression
 * matches the regular expression given by pattern and false if it doesn't.
 * If the sub-expression is NULL then the operator results in NULL.
 *
 * The syntax for the regular expression language is defined in Appendix F of [XSCHEMA2, 2001]:
 * http://www.w3.org/TR/2001/REC-xmlschema-2-20010502/#regexs
 */
import { store } from '@/store/store'
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiParseException from '@/components/qti/exceptions/QtiParseException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'

const qtiAttributeValidation = new QtiAttributeValidation()
const qtiProcessing = new QtiProcessing()

export default {
  name: 'QtiPatternMatch',

  props: {
    /*
     * The syntax for the regular expression language is defined in Appendix F of [XSCHEMA2, 01].
     * May refer to a variable as pattern is of type stringOrVariableRef.
     * To resolve this, variable declarations should be searched first.  If none are found
     * then pattern must be a Regular Expression string.
     */
    pattern: {
      required: false,
      type: String
    },
  },

  data () {
    return {
      value: null,
      valueBaseType: 'boolean',
      valueCardinality: 'single',
      expression: null,
      // Save computed Regex here when pattern is not a variable identifier
      appliedRegex: null,
      // Set to true if pattern resolves to a variable identifier
      isPatternIdentifier: null,
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

    validateAttributes() {
      let declaration
      try {
        declaration =  qtiAttributeValidation.validateVariableIdentifierAttribute(store, this.pattern)
        // If we get to this line of code then we believe that 'pattern' is
        // a variable identifier, not a RegEx pattern.
        this.isPatternIdentifier = true
      } catch (err) {
        // QtiValidationException means that pattern wasn't an identifier
        if (err.name === 'QtiValidationException') {
          this.isPatternIdentifier = false
        } else {
          throw new Error(err.message)
        }
      }

      if (this.isPatternIdentifier) {
        // Validate that variable is a string with single cardinality
        if ((declaration.baseType === 'string') && (declaration.cardinality === 'single')) {
          // Bail.  Resolve the variable value if/when evaluate is called.
          return
        }
        throw new QtiValidationException('Invalid "pattern" attribute.  The referenced variable must be of base-type "string" and cardinality "single"')
      }

      // 'pattern' is a RegEx expression.  Parse it and save the result in appliedRegex.
      this.appliedRegex = qtiAttributeValidation.validatePattern('pattern', this.pattern)
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
      // Perform extra semantic validations on the expressions
      this.validateExpressions()
      // All good.  Save off our children.
      this.processChildren()
    },

    validateExpressions () {
      this.$children.forEach((expression) => {
        if (!expression.getBaseType() === 'string') {
          throw new QtiValidationException('Expression must be a string base-type')
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

        // compute the final RegEx
        const rx = this.getRegex()

        if (qtiProcessing.isNullValue(value) || (rx === null)) {
          this.setValue(qtiProcessing.nullValue())
          console.log('[PatternMatch][Pattern][Exp][Value]', rx, value, this.getValue())
          return this.getValue()
        }

        this.setValue(rx.test(value))
        console.log('[PatternMatch][Pattern][Exp][Value]', rx, value, this.getValue())
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
     * @description Utility method to resolve the Regex
     * from a string or an identifier that resolves to a string
     */
    getRegex () {
      if (this.isPatternIdentifier) {
        let declaration = store.getVariableDeclaration(this.pattern)
        return qtiAttributeValidation.validatePattern('pattern', declaration.value)
      }
      return this.appliedRegex
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
