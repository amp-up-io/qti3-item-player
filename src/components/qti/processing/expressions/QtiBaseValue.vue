<template>
  <div class="qti-base-value">
    <div class="amp-basevalue__container">
      <slot></slot>
    </div>
  </div>
</template>

<script>
/*
 * The simplest expression returns a single value from the set defined by the given baseType.
 */
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiParseException from '@/components/qti/exceptions/QtiParseException'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiValueValidation from '@/components/qti/validation/QtiValueValidation'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'
import BigNumber from 'bignumber.js'

const qtiAttributeValidation = new QtiAttributeValidation()
const qtiValueValidation = new QtiValueValidation()
const qtiProcessing = new QtiProcessing()

export default {
  name: 'QtiBaseValue',

  props: {
    baseType: {
      type: String,
      required: true
    }
  },

  data () {
    return {
      value: null,
      valueBaseType: null,
      valueCardinality: 'single',
      isQtiValid: true
    }
  },

  methods: {

    getValue () {
      if (this.isNull()) {
        return qtiProcessing.nullValue()
      }

      switch(this.valueBaseType) {
        case 'integer':
        case 'float':
          return this.value.toNumber()

        case 'boolean':
          return this.value

        case 'string':
        case 'identifier':
          return this.value

        default:
          console.log('[' + this.$options.name + '][GetValue Exception]', 'Unhandled BaseType:' + this.baseType)
          return null
      }
    },

    setValue (value) {
      this.value = value
    },

    isNull () {
      return this.value === null
    },

    getBaseType () {
      return this.valueBaseType
    },

    getCardinality () {
      return this.valueCardinality
    },

    readChildren (node) {
      if (this.valueBaseType != null) {
        this.value = this.parseSingleValue(this.baseType, node.textContent)
      }
    },

    parseSingleValue (baseType, textContent) {
      let value = null
      try {
        switch(baseType) {
          case 'integer':
            value = new BigNumber(qtiValueValidation.IntegerValue(textContent))
            break

          case 'float':
            value = new BigNumber(qtiValueValidation.FloatValue(textContent))
            break

          case 'boolean':
            value = qtiValueValidation.BooleanValue(textContent)
            break

          case 'string':
            value = qtiValueValidation.StringValue(textContent)
            break

          case 'identifier':
            value = qtiValueValidation.IdentifierValue(textContent)
            break

          default:
            throw new QtiParseException('[QtiBaseValue][Unhandled BaseType]: "' + baseType + '"')
        }
      } catch (err) {
        throw new QtiParseException(err.message)
      }
      return value
    },

    evaluate () {
      try {
        // TODO: further evaluate subexpression?
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

  created: function() {
    try {
      qtiAttributeValidation.validateBaseType(this.baseType)
      this.valueBaseType = this.baseType
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

  mounted: function() {
    let node = this.$el.querySelector(`.amp-basevalue__container`)
    if (this.isQtiValid) {
      try {
        this.readChildren(node)
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
      console.log('[' + this.$options.name + '][Value:', this.getValue() ,'][BaseType:' + this.getBaseType() + ']')
    }
    node.remove()
  }
}
</script>
