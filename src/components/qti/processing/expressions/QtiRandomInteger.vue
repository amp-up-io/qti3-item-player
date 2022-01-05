<template>
  <div class="qti-random-integer">
  </div>
</template>

<script>
/*
 * Selects a random integer from the specified range [min,max] satisfying min + step * n for some integer n.
 * For example, with min=2, max=11 and step=3 the values {2,5,8,11} are possible.
 */
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiParseException from '@/components/qti/exceptions/QtiParseException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'

const qtiAttributeValidation = new QtiAttributeValidation()
const qtiProcessing = new QtiProcessing()

export default {
  name: 'QtiRandomInteger',

  props: {
    min: {
      type: String,
      required: false,
      default: '0'
    },
    max: {
      type: String,
      required: true
    },
    step: {
      type: String,
      required: false,
      default: '1'
    }
  },

  data () {
    return {
      value: null,
      valueBaseType: 'integer',
      valueCardinality: 'single',
      valueMin: null,
      valueMax: null,
      valueStep: null,
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
      this.valueMin = qtiAttributeValidation.validateIntegerAttribute('min', this.min, false, 0)
      this.valueMax = qtiAttributeValidation.validateIntegerAttribute('max', this.max, true, null)
      this.valueStep = qtiAttributeValidation.validateIntegerAttribute('step', this.step, false, 1)

      if ((this.valueMin !== null) && (this.valueMax !== null) && (this.valueMax < this.valueMin)) {
        throw new QtiValidationException('Attribute "max" cannot be less than Attribute "min"')
      }

      if ((this.valueStep !== null) && (this.valueStep < 1)) {
        throw new QtiValidationException('Attribute "step" must be positive')
      }
    },

    /**
     * Iterate through the child nodes:
     * There should be zero child nodes of this component.
     */
    validateChildren () {
      // TODO: ??
    },

    evaluate () {
      try {
        let possibleValues = []
        let currentValue = this.valueMin

        while (currentValue <= this.valueMax) {
          possibleValues.push(currentValue)
          currentValue += this.valueStep
        }

        if (possibleValues.length === 0) {
          this.setValue(qtiProcessing.nullValue())
        } else {
          qtiProcessing.shuffleArray(possibleValues)
          this.setValue(possibleValues[0])
        }

        console.log('[RandomInteger][Value]', this.getValue())
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
