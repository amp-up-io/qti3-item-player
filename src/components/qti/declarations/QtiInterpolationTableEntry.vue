<template>
  <div class="qti-interpolation-table-entry">
    <div class="amp-interpolationentry__container">
      <slot></slot>
    </div>
  </div>
</template>

<script>
/*
 * 	Provides an interpolation table entry in the associated interpolation table.
 */
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiParseException from '@/components/qti/exceptions/QtiParseException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import BigNumber from 'bignumber.js'

const qtiAttributeValidation = new QtiAttributeValidation()

export default {
  name: 'QtiInterpolationTableEntry',

  props: {
    /*
     * [1] Multiplicity
     * The lower bound for the source value to match this entry.
     */
    sourceValue: {
      type: String,
      required: true
    },
    /*
     * [0..1] multiplicity
     * Determines if an exact match of sourceValue matches this entry. If 'true', the default, then an
     * exact match of the value is considered a match of this entry.
     */
    includeBoundary: {
      type: String,
      required: false
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
      valueIncludeBoundary: true,
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

    setIncludeBoundary (includeBoundary) {
      this.valueIncludeBoundary = includeBoundary
    },

    getIncludeBoundary () {
      return this.valueIncludeBoundary
    },

    computeSourceValue (textContent) {
      let value = null
      try {
        value = new BigNumber(textContent)
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
      // All good.  Save off our interpolation-table-entry object.
      this.setValue({
        sourceValue: this.getSourceValue(),
        targetValue: this.getTargetValue(),
        includeBoundary: this.getIncludeBoundary()
      })
    }

  },

  created () {
    try {
      let declarationBaseType = this.$parent.$parent.getBaseType()
      // validate the attributes.  include-boundary (not required) defaults to true.
      this.setIncludeBoundary(qtiAttributeValidation.validateIncludeBoundary(this.includeBoundary, 'include-boundary'))

      // sourceValue is a double/float
      this.setSourceValue(this.computeSourceValue(qtiAttributeValidation.FloatValue(this.sourceValue)))

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
    let node = this.$el.querySelector(`.amp-interpolationentry__container`)
    if (this.isQtiValid) {
      this.validateChildren()
      console.log('[' + this.$options.name + '][Value]', this.getValue())
    }
    node.remove()
  }
}
</script>
