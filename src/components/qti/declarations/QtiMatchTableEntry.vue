<template>
  <div class="qti-match-table-entry">
    <div class="amp-matchtableentry__container">
      <slot></slot>
    </div>
  </div>
</template>

<script>
/*
 * 	Provides a match table entry in the associated match table.
 */
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiParseException from '@/components/qti/exceptions/QtiParseException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import BigNumber from 'bignumber.js'

const qtiAttributeValidation = new QtiAttributeValidation()

export default {
  name: 'QtiMatchTableEntry',

  props: {
    /*
     * [1] Multiplicity
     * The lower bound for the source value to match this entry. Must be an integer.
     */
    sourceValue: {
      type: String,
      required: true
    },
    /*
     * [1] Multiplicity
     * The target value that is used to set the outcome when a match is found.
     */
    targetValue: {
      type: String,
      required: true
    }
  },

  data () {
    return {
      value: null,
      valueSourceValue: null,
      valueTargetValue: null,
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
      return this.value === null
    },

    getBaseType () {
      return this.valueBaseType
    },

    getCardinality () {
      return this.valueCardinality
    },

    setSourceValue (sourceValue) {
      this.valueSourceValue = sourceValue
    },

    getSourceValue () {
      return this.valueSourceValue
    },

    setTargetValue (targetValue) {
      this.valueTargetValue = targetValue
    },

    getTargetValue () {
      return this.valueTargetValue
    },

    computeSourceValue (textContent) {
      let value = null
      try {
        // According to the spec, this MUST be an integer
        value = new BigNumber(textContent)
        if (!value.isInteger()) {
          throw new QtiParseException('Invalid qti-match-table-entry source-value integer "' + value + '"')
        }
      } catch (err) {
        throw new QtiParseException(err.message)
      }
      return value.toNumber()
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
     * qti-interpolation-table-entry is not supposed to contain any children.
     */
    validateChildren () {
      if (this.$slots.default) {
        this.$slots.default.forEach((slot) => {
          if (this.isValidSlot(slot)) {
            throw new QtiValidationException('Invalid Child Node: "' + slot.componentOptions.tag + '"')
          }
        })
      }
      // All good.  Save off our match-table-entry object.
      this.setValue({
        sourceValue: this.getSourceValue(),
        targetValue: this.getTargetValue()
      })
    }

  },

  created () {
    try {
      let declarationBaseType = this.$parent.$parent.getBaseType()

      // sourceValue must be an integer
      this.setSourceValue(this.computeSourceValue(qtiAttributeValidation.IntegerValue(this.sourceValue)))

      // Handle five baseTypes of targetValue's: string, identifier, integer, float, duration
      // TODO: implement all other baseTypes
      this.setTargetValue(qtiAttributeValidation.validateValueFromBaseType(declarationBaseType, this.targetValue))
    } catch (err) {
      this.isQtiValid = false
      if (err.name === 'QtiValidationException') {
        throw new QtiValidationException(err.message)
      } else if (err.name === 'QtiParseException') {
        throw new QtiParseException(err.message)
      }
    }
  },

  mounted () {
    let node = this.$el.querySelector(`.amp-matchtableentry__container`)
    if (this.isQtiValid) {
      this.validateChildren()
      console.log('[' + this.$options.name + '][Value]', this.getValue())
    }
    node.remove()
  }
}
</script>
