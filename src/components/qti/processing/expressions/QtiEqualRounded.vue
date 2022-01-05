<template>
  <div class="qti-equal">
    <slot></slot>
  </div>
</template>

<script>
/*
 * The equalRounded operator takes two sub-expressions which must both have single cardinality
 * and have a numerical base-type. The result is a single boolean with a value of 'true' if
 * the two expressions are numerically equal after rounding and 'false' if they are not.
 * If either sub-expression is NULL then the operator results in NULL.
 */
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiParseException from '@/components/qti/exceptions/QtiParseException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'
import BigNumber from 'bignumber.js'

const qtiAttributeValidation = new QtiAttributeValidation()
const qtiProcessing = new QtiProcessing()

export default {
  name: 'QtiEqualRounded',

  props: {
    /*
     * Enumerated value set of: { decimalPlaces | significantFigures }
     * decimalPlaces - Use a number of decimal places.
     * significantFigures - The number of significant decimal places.
     */
    roundingMode: {
      type: String,
      required: true
    },
    /*
     * 	The number of figures to round to. If rounding-mode="significantFigures", the value
     * of figures must be a non-zero positive integer. If rounding-mode="decimalPlaces", the
     * value of figures must be an integer greater than or equal to zero.
     */
    figures: {
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
      valueFigures: null,
      isFiguresIdentifier: false,
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

    /**
     * @description In exact mode the result of the comparison is true if the second
     * value is numerically equivalent to the first value.
     * @param - firstValue, secondValue are BigNumber's
     * @return - boolean
	   */
    isEqualExact (firstValue, secondValue) {
      return (firstValue.comparedTo(secondValue) === 0)
    },

    /**
     * @description Performs rounding according to the roundingMode and Figures
     * properties.  Returns NULL if unsupported roundingMode.
     * @param - value is a BigNumber
     * @return - float
	   */
    roundValue (value) {
      switch (this.roundingMode) {
        case 'decimalPlaces':
          return (value.decimalPlaces(this.valueFigures, BigNumber.ROUND_HALF_UP).toNumber())
        case 'significantFigures':
          return (value.precision(this.valueFigures, BigNumber.ROUND_HALF_UP).toNumber())
        default:
      }
      return null
    },

    validateAttributes() {
      qtiAttributeValidation.validateRoundingModeAttribute(this.roundingMode)

      // Figures may resolve to an integer or to a template or outcome variable identifier
      // TODO: Perform attribute validation that includes a variable identifier reference
      // For now, only resolve integer values.
      this.valueFigures = qtiAttributeValidation.validateIntegerAttribute('figures', this.figures, true, 1)

      if ((this.valueFigures !== null) && (this.valueFigures < 1)) {
        throw new QtiValidationException('Attribute "figures" must be positive')
      }

      this.isFiguresIdentifier = (typeof this.valueFigures === 'string')
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
     * Examine the child nodes:
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
          throw new QtiValidationException('Expression must be a numeric base-type')
        }
        if (expression.getCardinality() !== 'single') {
          throw new QtiValidationException('Expression must be of cardinality "single"')
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
          console.log('[EqualRounded][Exp1][Exp2][Value]', (firstValue === null ? null : firstValue.valueOf()), (secondValue === null ? null : secondValue.valueOf()), this.getValue())
          return this.getValue()
        }

        firstValue = new BigNumber(firstValue)
        secondValue = new BigNumber(secondValue)

        // 1. Round the expressions
        firstValue = this.roundValue(firstValue)
        secondValue = this.roundValue(secondValue)

        if (qtiProcessing.isNullValue(firstValue) || qtiProcessing.isNullValue(secondValue)) {
          this.setValue(qtiProcessing.nullValue())
          console.log('[EqualRounded][Exp1][Exp2][Value]', (firstValue === null ? null : firstValue.valueOf()), (secondValue === null ? null : secondValue.valueOf()), this.getValue())
          return this.getValue()
        }

        // 2. Compare the rounded expressions
        this.setValue(this.isEqualExact(new BigNumber(firstValue), new BigNumber(secondValue)))

        console.log('[EqualRounded][Exp1][Exp2][Value]', firstValue.valueOf(), secondValue.valueOf(), this.getValue())
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
