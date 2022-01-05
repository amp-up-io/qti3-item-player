<template>
  <div class="qti-random-float">
  </div>
</template>

<script>
/*
 * Selects a random float from the specified range [min,max].
 */
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiParseException from '@/components/qti/exceptions/QtiParseException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'

const qtiAttributeValidation = new QtiAttributeValidation()
const qtiProcessing = new QtiProcessing()

export default {
  name: 'QtiRandomFloat',

  props: {
    min: {
      type: String,
      required: false,
      default: '0'
    },
    max: {
      type: String,
      required: true
    }
  },

  data () {
    return {
      value: null,
      valueBaseType: 'float',
      valueCardinality: 'single',
      valueMin: null,
      valueMax: null,
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
      this.valueMin = qtiAttributeValidation.validateFloatAttribute('min', this.min, false, 0)
      this.valueMax = qtiAttributeValidation.validateFloatAttribute('max', this.max, true, null)

      if ((this.valueMin !== null) && (this.valueMax !== null) && (this.valueMax < this.valueMin)) {
        throw new QtiValidationException('Attribute "max" cannot be less than Attribute "min"')
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
        }

        if (possibleValues.length === 0) {
          this.setValue(qtiProcessing.nullValue())
        } else {
          qtiProcessing.shuffleArray(possibleValues)
          this.setValue(possibleValues[0])
        }

        console.log('[RandomFloat][Value]', this.getValue())
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
