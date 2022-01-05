<template>
  <div class="qti-stats-operator">
    <slot></slot>
  </div>
</template>

<script>
/*
 * The qti-stats-operator operator takes 1 sub-expression which is a container of
 * multiple or ordered cardinality and has a numerical base-type. The result is a
 * single float. If the sub-expression or any value contained therein is NULL, the
 * result is NULL. If any value contained in the sub-expression is not a numerical
 * value, then the result is NULL.
 *
 * Operator names are:
 * mean, sampleVariance, sampleSD, popVariance, popSD
 */
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'
import BigNumber from 'bignumber.js'

const qtiAttributeValidation = new QtiAttributeValidation()
const qtiProcessing = new QtiProcessing()

export default {
  name: 'QtiStatsOperator',

  props: {
    /*
     * operator name
     */
    name: {
      type: String,
      required: true
    }
  },

  data () {
    return {
      value: null,
      valueBaseType: 'float',
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
      if (countExpression !== 1) {
        throw new QtiValidationException('Must have exactly one Expression node')
      }
      // Perform extra semantic validations on the expression
      this.validateExpressions()
      // All good.  Save off our children.
      this.processChildren()
    },

    validateExpressions () {
      this.$children.forEach((expression) => {
        if ((expression.getCardinality() !== 'multiple') && (expression.getCardinality() !== 'ordered'))  {
          throw new QtiValidationException('Expression must be of cardinality="multiple" or cardinality="ordered"')
        }
        if (!qtiProcessing.isBaseTypeNumeric(expression.getBaseType())) {
          throw new QtiValidationException('Expression must be a numeric base-type')
        }
      })
    },

    processChildren () {
      this.expression = this.$children[0]
    },

    /**
     * @description Calculates the mean (average) of the values
     * @param - values of 1..n value
     * @return - mean value
     */
    computeMean (values) {
      const valuesLength = (values === null ? 0 : values.length)

      if (valuesLength === 0) {
        return (new BigNumber(0).toNumber())
      }

      let sum = new BigNumber(0)
      for (let i = 0; i < valuesLength; i++) {
        sum = sum.plus(values[i])
      }

      return (sum.dividedBy(valuesLength).toNumber())
    },

    /**
     * @description Calculates the sample mean (average) of the values
     * @param - values of 1..n value
     * @return - mean value
     */
    computeSampleMean (values) {
      const valuesLength = (values === null ? 0 : values.length)

      if (valuesLength === 0) {
        return (new BigNumber(0).toNumber())
      }

      let sum = new BigNumber(0)
      for (let i = 0; i < valuesLength; i++) {
        sum = sum.plus(values[i])
      }
      // If population size is > 1, reduce the population by 1 to get the sample size.
      return (sum.dividedBy(valuesLength > 1 ? valuesLength-1 : 1).toNumber())
    },

    /**
     * @description Computes the population standard deviation of the values
     * @param - values of 1..n value
     * @return - standard deviation
     */
    computePopulationStandardDeviation (values) {
      const average = this.computeMean(values)
      const squareDifferences = this.computeSquareDifferences(values, average)
      const averageSquareDiff = this.computeMean(squareDifferences)
      return (new BigNumber(averageSquareDiff).squareRoot().toNumber())
    },

    /**
     * @description Computes the sample standard deviation of the values
     * @param - values of 1..n value
     * @return - standard deviation
     */
    computeSampleStandardDeviation (values) {
      const average = this.computeMean(values)
      const squareDifferences = this.computeSquareDifferences(values, average)
      const averageSquareDiff = this.computeSampleMean(squareDifferences)
      return (new BigNumber(averageSquareDiff).squareRoot().toNumber())
    },

    /**
     * @description Computes the population variance of the values
     * @param - values of 1..n value
     * @return - variance
     */
    computePopulationVariance (values) {
      const average = this.computeMean(values)
      const squareDifferences = this.computeSquareDifferences(values, average)
      const averageSquareDiff = this.computeMean(squareDifferences)
      return (new BigNumber(averageSquareDiff).toNumber())
    },

    /**
     * @description Computes the sample variance of the values
     * @param - values of 1..n value
     * @return - variance
     */
    computeSampleVariance (values) {
      const average = this.computeMean(values)
      const squareDifferences = this.computeSquareDifferences(values, average)
      const averageSquareDiff = this.computeSampleMean(squareDifferences)
      return (new BigNumber(averageSquareDiff).toNumber())
    },

    /**
     * @description Computes the average square difference of the values
     * @param - values of 1..n value
     * @param - average/mean of the values
     * @return - array of square difference
     */
    computeSquareDifferences (values, average) {
      const valuesLength = (values === null ? 0 : values.length)
      let squareDifferences = []
      for (let i = 0; i < valuesLength; i++) {
        let diff = new BigNumber(values[i]).minus(average)
        squareDifferences.push(diff.multipliedBy(diff).toNumber())
      }
      return squareDifferences
    },

    evaluate () {
      try {
        let values = this.expression.evaluate()

        if (qtiProcessing.isNullValue(values)) {
          this.setValue(qtiProcessing.nullValue())
          console.log('[StatsOperator]['+ this.name + '][Value]', this.getValue())
          return this.getValue()
        }

        switch (this.name) {
          case 'mean':
            this.setValue(this.computeMean(values))
            break
          case 'sampleVariance':
            this.setValue(this.computeSampleVariance(values))
            break
          case 'popVariance':
            this.setValue(this.computePopulationVariance(values))
            break
          case 'sampleSD':
            this.setValue(this.computeSampleStandardDeviation(values))
            break
          case 'popSD':
            this.setValue(this.computePopulationStandardDeviation(values))
            break
          default:
            throw new QtiEvaluationException('Unsupported qti-stats-operator "name" attribute: "' + name + '"')
          }

        console.log('[StatsOperator]['+ this.name + '][Value]', this.getValue())
        return this.getValue()
      } catch (err) {
        if (err.nae === 'QtiEvaluationException') {
          throw new QtiEvaluationException(err.message)
        } else {
          throw new Error(err.message)
        }
      }
    }

  },

  created () {
    try {
      qtiAttributeValidation.validateStatsOperatorNameAttribute(this.name)
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
