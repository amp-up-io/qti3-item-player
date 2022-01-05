<template>
  <div class="qti-math-constant">
  </div>
</template>

<script>
/*
 * This is a QTI expression function.
 * The result is a mathematical constant returned as a single float, e.g. Pi and e.
 */
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'
import BigNumber from 'bignumber.js'

const qtiAttributeValidation = new QtiAttributeValidation()
const qtiProcessing = new QtiProcessing()

export default {
  name: 'QtiMathConstant',

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

    setCardinality (cardinality) {
      this.valueCardinality = cardinality
    },

    /**
     * Iterate through the child nodes:
     * There should be zero child nodes of this component.
     */
    validateChildren () {
    },

    evaluate () {
      try {

        switch (this.name) {
          case 'pi':
            this.setValue(new BigNumber(Math.PI).toNumber())
            break
          case 'e':
            this.setValue(new BigNumber(Math.E).toNumber())
            break
          default:
            throw new QtiEvaluationException('Unsupported qti-math-constant "name" attribute: "' + name + '"')
        }

        console.log('[MathConstant]['+ this.name + '][Value]', this.getValue())
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
      qtiAttributeValidation.validateMathConstantNameAttribute(this.name)
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
