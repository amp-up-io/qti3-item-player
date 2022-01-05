<template>
  <div class="qti-equal">
    <slot></slot>
  </div>
</template>

<script>
/*
 * The equal operator takes two sub-expressions which must both have single cardinality and have a numerical
 * base-type. The result is a single boolean with a value of true if the two expressions are numerically
 * equal and false if they are not. If either sub-expression is NULL then the operator results in NULL.
 */
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiExitProcessingException from '@/components/qti/exceptions/QtiExitProcessingException'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'
import BigNumber from 'bignumber.js'

const qtiAttributeValidation = new QtiAttributeValidation()
const qtiProcessing = new QtiProcessing()

export default {
  name: 'QtiEqual',

  props: {
    /*
     * [0..1] absoluate | exact | relative
     * When comparing two floating point numbers for equality it is often desirable to have a tolerance to ensure
     * that spurious errors in scoring are not introduced by rounding errors. The tolerance mode determines
     * whether the comparison is done exactly, using an absolute range or a relative range.
     */
    toleranceMode: {
      type: String,
      required: false,
      default: 'exact'
    },
    /*
     * [0..1]
     * If the tolerance mode is absolute or relative then the tolerance must be specified. The tolerance consists
     * of two positive numbers, t0 and t1, that define the lower and upper bounds. If only one value is given it
     * is used for both. In absolute mode the result of the comparison is true if the value of the second
     * expression, y is within the following range defined by the first value, x: x-t0,x+t1. In relative mode,
     * t0 and t1 are treated as percentages and the following range is used instead: x*(1-t0/100),x*(1+t1/100)
     */
    tolerance: {
      type: String,
      required: false
    },
    /*
     * [0..1]
     * Controls whether or not the lower bound is included in the comparison.
     */
    includeLowerBound: {
      type: String,
      required: false,
      default: 'true'
    },
    /*
     * [0..1]
     * Controls whether or not the upper bound is included in the comparison.
     */
    includeUpperBound: {
      type: String,
      required: false,
      default: 'true'
    }
  },

  data () {
    return {
      value: null,
      valueBaseType: 'boolean',
      valueCardinality: 'single',
      tolerances: [],
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
     * @description In absolute mode the result of the comparison is true if the second
     * value is within the following range defined by the first value.
	   * firstValue - t0, firstValue + t1
     * @param - firstValue, secondValue, t0, t1 are all BigNumber's
     * @return - boolean
	   */
    isEqualAbsolute (firstValue, secondValue, t0, t1, includeLowerBound, includeUpperBound) {
      const lower = firstValue.minus(t0)

			if ((includeLowerBound && secondValue.comparedTo(lower) < 0) ||
        (!includeLowerBound && secondValue.comparedTo(lower) <= 0)) {
				return false
      }

			const upper = firstValue.plus(t1)

			if ((includeUpperBound && secondValue.comparedTo(upper) > 0) ||
        (!includeUpperBound && secondValue.comparedTo(upper) >= 0)) {
				return false
      }

			return true
    },

    /**
     * @description In relative mode, t0 and t1 are treated as percentages and the following range
     * is used instead.
     * firstValue * (1 - t0 / 100), firstValue * (1 + t1 / 100)
     * @param - firstValue, secondValue, t0, t1 are all BigNumber's
     * @return - boolean
     */
    isEqualRelative (firstValue, secondValue, t0, t1, includeLowerBound, includeUpperBound) {
      const lower = firstValue.multipliedBy( BigNumber(1).minus( t0.dividedBy( BigNumber(100) ) ) )

      if ((includeLowerBound && secondValue.comparedTo(lower) < 0) ||
        (!includeLowerBound && secondValue.comparedTo(lower) <= 0)) {
				return false
      }

      const upper = firstValue.multipliedBy( BigNumber(1).plus( t1.dividedBy( BigNumber(100) ) ) )

      if ((includeUpperBound && secondValue.comparedTo(upper) > 0) ||
        (!includeUpperBound && secondValue.comparedTo(upper) >= 0)) {
        return false
      }

      return true
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
        if (expression.getCardinality() !== 'single') {
          throw new QtiValidationException('Expressions must be cardinality="single"')
        }
        if (!qtiProcessing.isBaseTypeNumeric(expression.getBaseType())) {
          throw new QtiValidationException('Expressions must be a numeric base-type')
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
          console.log('[Equal][Exp1][Exp2][Value]', (firstValue === null ? null : firstValue.valueOf()), (secondValue === null ? null : secondValue.valueOf()), this.getValue())
          return this.getValue()
        }

        firstValue = new BigNumber(firstValue)
        secondValue = new BigNumber(secondValue)

        if (this.toleranceMode === 'exact') {
          this.setValue(this.isEqualExact(firstValue, secondValue))
        } else if (this.toleranceMode === 'absolute') {
          this.setValue(this.isEqualAbsolute(firstValue, secondValue, this.tolerances[0], this.tolerances[1], this.includeLowerBound === 'true', this.includeUpperBound === 'true'))
        } else if (this.toleranceMode === 'relative') {
          this.setValue(this.isEqualRelative(firstValue, secondValue, this.tolerances[0], this.tolerances[1], this.includeLowerBound === 'true', this.includeUpperBound === 'true'))
        }

        console.log('[Equal][Exp1][Exp2][Value]', firstValue.valueOf(), secondValue.valueOf(), this.getValue())
        return this.getValue()
      } catch (err) {
        if (err.name === 'QtiValidationException') {
          throw new QtiValidationException(err.message)
        } else if (err.name === 'QtiEvaluationException') {
          throw new QtiEvaluationException(err.message)
        } else if (err.name === 'QtiExitProcessingException') {
          throw new QtiExitProcessingException(err.message)
        } else {
          throw new Error(err.message)
        }
      }
    }
  },

  created () {
    try {
      qtiAttributeValidation.validateToleranceModeAttribute(this.toleranceMode)
      if ((this.toleranceMode === 'absolute') || (this.toleranceMode === 'relative')) {
        if (typeof this.tolerance === 'undefined') {
          throw new QtiValidationException('Undefined tolerance attribute. "tolerance" must be defined when tolerance-mode is "absolute" or "relative".')
        }
        this.tolerances = qtiAttributeValidation.validateToleranceAttribute(this.tolerance)
        if (this.tolerances.length === 0) {
          throw new QtiValidationException('Invalid tolerance attribute: "' + this.tolerance + '"  Must contain at least one value when tolerance-mode is "absolute" or "relative".')
        }
      }
      qtiAttributeValidation.validateIncludeBoundary(this.includeLowerBound, 'include-lower-bound')
      qtiAttributeValidation.validateIncludeBoundary(this.includeUpperBound, 'include-upper-bound')
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
