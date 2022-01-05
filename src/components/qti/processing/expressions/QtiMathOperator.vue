<template>
  <div class="qti-math-operator">
    <slot></slot>
  </div>
</template>

<script>
/*
 * The mathOperator operator takes 1 or more sub-expressions which all have single cardinality
 * and have numerical base-types. The trigonometric functions, sin, cos and tan, take one argument
 * in radians, which evaluates to a single float. Other functions take one numerical argument.
 * Further functions might take more than one numerical argument, e.g. atan2 (two argument arc tan).
 * The result is a single float, except for the functions signum, floor and ceil, which return a
 * single integer. If any of the sub-expressions is NULL, the result is NULL. If any of the
 * sub-expressions falls outside the natural domain of the function called by qti-math-operator,
 * e.g. log(0) or asin(2), then the result is NULL.
 *
 * Operator List:
 * acos acot acsc asec asin atan atan2 cos cot csc sec sin tan
 * cosh csch sech sinh tanh abs ceil exp floor ln log signum toDegrees toRadians
 */
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'
import BigNumber from 'bignumber.js'

const qtiAttributeValidation = new QtiAttributeValidation()
const qtiProcessing = new QtiProcessing()

export default {
  name: 'QtiMathOperator',

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
      expressions: [],
      hasTwoExpressions: false,
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
     * Examine the child nodes:
     * Most operators have 1 expression, some (atan2) have two
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
      if ((countExpression !== 2) && (this.hasTwoExpressions)) {
        throw new QtiValidationException('Must have exactly two Expression nodes')
      }
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
        if (expression.getCardinality() !== 'single') {
          throw new QtiValidationException('Expressions must be of cardinality="single"')
        }
        if (!qtiProcessing.isBaseTypeNumeric(expression.getBaseType())) {
          throw new QtiValidationException('Expression must be a numeric base-type')
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
        let secondValue
        if (this.hasTwoExpressions) {
          secondValue = this.expressions[1].evaluate()
        }

        if (qtiProcessing.isNullValue(firstValue) ||
          (this.hasTwoExpressions && qtiProcessing.isNullValue(secondValue))) {
          this.setValue(qtiProcessing.nullValue())
          console.log('[MathOperator]['+ this.name + '][Value]', this.getValue())
          return this.getValue()
        }

        firstValue = new BigNumber(firstValue)

        switch (this.name) {
          case 'abs':
            if (firstValue.isNaN()) {
              this.setValue(qtiProcessing.nullValue())
              break
            }
            if ((firstValue.toNumber() == -Infinity) || (firstValue.toNumber() == Infinity)) {
              this.setValue(Infinity)
              break
            }
            this.setValue(firstValue.absoluteValue().toNumber())
            break
          case 'acos':
            if (firstValue.absoluteValue().isGreaterThan(1)) {
              this.setValue(qtiProcessing.nullValue())
              break
            }
            this.setValue(Math.acos(firstValue.toNumber()))
            break
          case 'acot':
            this.setValue(new BigNumber(Math.PI/2).minus(Math.atan(1/firstValue.toNumber())).toNumber())
            break
          case 'acsc':
            if (firstValue.absoluteValue().isLessThan(1)) {
              this.setValue(qtiProcessing.nullValue())
              break
            }
            this.setValue(new BigNumber(Math.PI/2).minus(Math.asin(1/firstValue.toNumber())).toNumber())
            break
          case 'asec':
            if (firstValue.absoluteValue().isLessThan(1)) {
              this.setValue(qtiProcessing.nullValue())
              break
            }
            this.setValue(new BigNumber(Math.PI/2).minus(Math.acos(1/firstValue.toNumber())).toNumber())
            break
          case 'asin':
            if (firstValue.absoluteValue().isGreaterThan(1)) {
              this.setValue(qtiProcessing.nullValue())
              break
            }
            if (firstValue.isEqualTo(0)) {
              this.setValue(firstValue.toNumber())
              break
            }
            this.setValue(Math.asin(firstValue.toNumber()))
            break
          case 'atan':
            if (firstValue.isEqualTo(0)) {
              this.setValue(firstValue.toNumber())
              break
            }
            this.setValue(Math.atan(firstValue.toNumber()))
            break
          case 'atan2':
            // secondValue needs to be BigNumbered
            this.setValue(Math.atan2(firstValue.toNumber(), new BigNumber(secondValue).toNumber()))
            break
          case 'ceil':
            if (firstValue.isNaN()) {
              this.setValue(qtiProcessing.nullValue())
              break
            }
            if (firstValue.toNumber() == -Infinity) {
              this.setValue(-Infinity)
              break
            }
            if (firstValue.toNumber() == Infinity) {
              this.setValue(Infinity)
              break
            }
            this.setValue(Math.ceil(firstValue.toNumber()))
            break
          case 'cos':
            if (firstValue.isNaN()) {
              this.setValue(qtiProcessing.nullValue())
              break
            }
            this.setValue(Math.cos(firstValue.toNumber()))
            break
          case 'cosh':
            if (firstValue.isEqualTo(0)) {
              this.setValue(new BigNumber(1.0).toNumber())
              break
            }
            if (firstValue.toNumber() == -Infinity) {
              this.setValue(Infinity)
              break
            }
            if (firstValue.toNumber() == Infinity) {
              this.setValue(Infinity)
              break
            }
            this.setValue(Math.cosh(firstValue.toNumber()))
            break
          case 'cot':
            if (firstValue.isNaN()) {
              this.setValue(qtiProcessing.nullValue())
              break
            }
            this.setValue(new BigNumber(1).dividedBy(Math.tan(firstValue.toNumber())).toNumber())
            break
          case 'coth':
            if (firstValue.isNaN()) {
              this.setValue(qtiProcessing.nullValue())
              break
            }
            this.setValue(new BigNumber(1).dividedBy(Math.tanh(firstValue.toNumber())).toNumber())
            break
          case 'csc':
            if (firstValue.isNaN()) {
              this.setValue(qtiProcessing.nullValue())
              break
            }
            this.setValue(new BigNumber(1).dividedBy(Math.sin(firstValue.toNumber())).toNumber())
            break
          case 'csch':
            if (firstValue.isNaN()) {
              this.setValue(qtiProcessing.nullValue())
              break
            }
            this.setValue(new BigNumber(1).dividedBy(Math.sinh(firstValue.toNumber())).toNumber())
            break
          case 'exp':
            if (firstValue.isNaN()) {
              this.setValue(qtiProcessing.nullValue())
              break
            }
            if (firstValue.toNumber() == -Infinity) {
              this.setValue(new BigNumber(0).toNumber())
              break
            }
            if (firstValue.toNumber() == Infinity) {
              this.setValue(Infinity)
              break
            }
            this.setValue(Math.exp(firstValue.toNumber()))
            break
          case 'floor':
            if (firstValue.isNaN()) {
              this.setValue(qtiProcessing.nullValue())
              break
            }
            if (firstValue.toNumber() == -Infinity) {
              this.setValue(-Infinity)
              break
            }
            if (firstValue.toNumber() == Infinity) {
              this.setValue(Infinity)
              break
            }
            this.setValue(Math.floor(firstValue.toNumber()))
            break
          case 'ln':
            if (firstValue.comparedTo(0) < 0) {
              this.setValue(qtiProcessing.nullValue())
              break
            }
            if (firstValue.comparedTo(0) == 0) {
              this.setValue(-Infinity)
              break
            }
            if (firstValue.toNumber() == Infinity) {
              this.setValue(Infinity)
              break
            }
            this.setValue(Math.log(firstValue.toNumber()))
            break
          case 'log':
            if (firstValue.comparedTo(0) < 0) {
              this.setValue(qtiProcessing.nullValue())
              break
            }
            if (firstValue.comparedTo(0) == 0) {
              this.setValue(-Infinity)
              break
            }
            if (firstValue.toNumber() == Infinity) {
              this.setValue(Infinity)
              break
            }
            this.setValue(Math.log10(firstValue.toNumber()))
            break
          case 'sec':
            if (firstValue.isNaN()) {
              this.setValue(qtiProcessing.nullValue())
              break
            }
            this.setValue(new BigNumber(1).dividedBy(Math.cos(firstValue.toNumber())).toNumber())
            break
          case 'sech':
            if (firstValue.isNaN()) {
              this.setValue(qtiProcessing.nullValue())
              break
            }
            this.setValue(new BigNumber(1).dividedBy(Math.cosh(firstValue.toNumber())).toNumber())
            break
          case 'signum':
            if (firstValue.isNaN()) {
              this.setValue(qtiProcessing.nullValue())
              break
            }
            this.setValue(Math.sign(firstValue.toNumber()))
            break
          case 'sin':
            if (firstValue.isNaN()) {
              this.setValue(qtiProcessing.nullValue())
              break
            }
            this.setValue(Math.sin(firstValue.toNumber()))
            break
          case 'sinh':
            if (firstValue.isNaN()) {
              this.setValue(qtiProcessing.nullValue())
              break
            }
            if (firstValue.toNumber() == Infinity) {
              this.setValue(Infinity)
              break
            }
            if (firstValue.toNumber() == -Infinity) {
              this.setValue(-Infinity)
              break
            }
            if (firstValue.isEqualTo(0)) {
              this.setValue(firstValue.toNumber())
              break
            }
            this.setValue(Math.sinh(firstValue.toNumber()))
            break
          case 'tan':
            if (firstValue.isNaN()) {
              this.setValue(qtiProcessing.nullValue())
              break
            }
            this.setValue(Math.tan(firstValue.toNumber()))
            break
          case 'tanh':
            if (firstValue.isNaN()) {
              this.setValue(qtiProcessing.nullValue())
              break
            }
            if (firstValue.toNumber() == Infinity) {
              this.setValue(new BigNumber(1.0).toNumber())
              break
            }
            if (firstValue.toNumber() == -Infinity) {
              this.setValue(new BigNumber(-1.0).toNumber())
              break
            }
            if (firstValue.isEqualTo(-0)) {
              this.setValue(firstValue.toNumber())
              break
            }
            if (firstValue.isEqualTo(0)) {
              this.setValue(firstValue.toNumber())
              break
            }
            this.setValue(Math.tanh(firstValue.toNumber()))
            break
          case 'toDegrees':
            if (firstValue.isNaN()) {
              this.setValue(qtiProcessing.nullValue())
              break
            }
            if (firstValue.toNumber() == Infinity) {
              this.setValue(Infinity)
              break
            }
            if (firstValue.toNumber() == -Infinity) {
              this.setValue(-Infinity)
              break
            }
            this.setValue(firstValue.multipliedBy(180/Math.PI))
            break
          case 'toRadians':
            if (firstValue.isNaN()) {
              this.setValue(qtiProcessing.nullValue())
              break
            }
            if (firstValue.toNumber() == Infinity) {
              this.setValue(Infinity)
              break
            }
            if (firstValue.toNumber() == -Infinity) {
              this.setValue(-Infinity)
              break
            }
            this.setValue(firstValue.multipliedBy(Math.PI/180))
            break
          default:
            throw new QtiEvaluationException('Unsupported qti-math-operator "name" attribute: "' + name + '"')
        }

        console.log('[MathOperator]['+ this.name + '][Value]', this.getValue())
        return this.getValue()
      } catch (err) {
        if (err.name === 'QtiEvaluationException') {
          throw new QtiEvaluationException(err.message)
        } else {
          throw new Error(err.message)
        }
      }
    }

  },

  created () {
    try {
      qtiAttributeValidation.validateMathOperatorNameAttribute(this.name)

      // Resolve some additional props
      switch (this.name) {
        case 'signum':
        case 'floor':
        case 'ceil':
          // Override default baseType=float
          this.setBaseType('integer')
          this.hasTwoExpressions = false
          break
        case 'atan2':
          this.setBaseType('float')
          // Only operator with two expressions
          this.hasTwoExpressions = true
          break
        default:
          this.setBaseType('float')
          this.hasTwoExpressions = false
      }

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
