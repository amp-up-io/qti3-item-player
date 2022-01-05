<template>
  <div class="qti-lookup-outcome-value">
    <slot></slot>
  </div>
</template>

<script>
/**
 * The lookupOutcomeValue rule sets the value of an outcome variable to the value obtained by looking
 * up the value of the associated expression in the lookupTable associated with the outcome's declaration.
 */
import { store } from '@/store/store'
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'

const qtiAttributeValidation = new QtiAttributeValidation()
const qtiProcessing = new QtiProcessing()

export default {
  name: 'QtiLookupOutcomeValue',

  props: {
    identifier: {
      type: String,
      required: true
    }
  },

  data () {
    return {
      isQtiValid: true,
      expression: null
    }
  },

  methods: {

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
     * Implements several validation checks on aspects of the lookupTable and expression.
     * @param declaration { object } - the outcome declaration pulled from the $store
     * @param expression { component } - the expression parameter to this lookupOutcomeValue rule
     */
    validateRequiredBaseTypeAndCardinality (declaration, expression) {
      // expression cardinality must be single
      if (expression.getCardinality() !== 'single') {
        throw new QtiValidationException('Expression node must have cardinality "single"')
      }

      // extra check for non-null lookupTable
      if (declaration.lookupTable === null) {
        throw new QtiEvaluationException('Missing lookupTable for Outcome variable identifier: "' + this.identifier + '"')
      }

      // permissible expression baseType varies depending on lookupTable type
      const baseType = expression.getBaseType()
      const tableType = declaration.lookupTable.getTableType()
      if (tableType === 'match') {
        // expression baseType must be integer
        if (baseType !== 'integer') {
          throw new QtiValidationException('Expression node must have base-type "integer" when lookupTable=matchTable')
        }
      } else if (tableType === 'interpolation') {
        // expression baseType must be { 'integer', 'float', 'duration' }
        if ((baseType !== 'integer') && (baseType !== 'float') && (baseType !== 'duration')) {
          throw new QtiValidationException('Expression node must have base-type "integer", "float", or "duration" when lookupTable=interpolationTable')
        }
      }
    },

    /**
     * Iterate through the child nodes:
     * There must be one expression child which must have single cardinality and an effective baseType of
     * either integer, float or duration. Integer type is required when the associated table is a matchTable.
     * expression (1)
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
      // Ensure expression has suitable baseType and cardinality
      this.validateRequiredBaseTypeAndCardinality(qtiAttributeValidation.validateOutcomeIdentifierAttribute(store, this.identifier), this.$children[0])
      // All good.  Save off our children.
      this.processChildren()
    },

    processChildren () {
      this.expression = this.$children[0]
    },

    evaluate () {
      try {
        let value = this.expression.evaluate()

        let declaration = qtiAttributeValidation.validateOutcomeIdentifierAttribute(store, this.identifier)
        if (typeof declaration === 'undefined') {
          throw new QtiEvaluationException('Outcome variable not found for identifier: "' + this.identifier + '"')
        }

        if (declaration.lookupTable === null) {
          throw new QtiEvaluationException('Outcome variable lookupTable not found for identifier: "' + this.identifier + '"')
        }

        let numericValue = null
        if (!qtiProcessing.isNullValue(value)) {
          if (this.expression.getBaseType() === 'duration') {
            value = qtiAttributeValidation.FloatValue(qtiAttributeValidation.DurationValue(value))
          }
          numericValue = value
        }

        let targetValue = qtiProcessing.mapValueFromLookupTable(declaration, numericValue)
        console.log('[LookupOutcomeValue][' + this.identifier + '][Expression]', numericValue, '[TargetValue]', targetValue)

        // Notify store of our targetValue
        store.setOutcomeVariableValue({
            identifier: this.identifier,
            value: targetValue
          })

      } catch (err) {
        this.isQtiValid = false
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
    try {
      qtiAttributeValidation.validateOutcomeIdentifierAttribute(store, this.identifier)
    } catch (err) {
      this.isQtiValid = false
      if (err.name === 'QtiValidationException') {
        throw new QtiValidationException(err.message)
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
