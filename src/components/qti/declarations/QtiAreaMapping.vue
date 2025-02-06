<template>
  <div class="qti-area-mapping">
    <slot></slot>
  </div>
</template>

<script>
/*
 * A special class, which may only be present in declarations of variables with base-type point,
 * is used to create a mapping from a source set of point values to a target set of float values. 
 * When mapping containers, the result is the sum of the mapped values from the target set. 
 * See mapResponsePoint for details. The attributes have the same meaning as the similarly 
 * named attributes on mapping.
 */
import Vue from 'vue'
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiParseException from '@/components/qti/exceptions/QtiParseException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiAreaMapEntry from '@/components/qti/declarations/QtiAreaMapEntry'
import BigNumber from 'bignumber.js'

Vue.component('qti-area-map-entry', QtiAreaMapEntry)

const qtiAttributeValidation = new QtiAttributeValidation()

export default {
  name: 'QtiAreaMapping',

  props: {
    /*
     * [0..1] multiplicity
     * The lower bound for the result of mapping a container. If unspecified there is 
     * no lower-bound.
     */
    lowerBound: {
      type: String,
      required: false
    },
    /*
     * [0..1] multiplicity
     * The upper bound for the result of mapping a container. If unspecified there is 
     * no upper-bound.
     */
    upperBound: {
      type: String,
      required: false
    },
    /*
     * [0..1] multiplicity
     * The default value from the target set to be used when no explicit mapping for a 
     * source value is given.  Default value = 0
     */
    defaultValue: {
      type: String,
      required: false
    }
  },

  data () {
    return {
      // value contains the table of area map entries
      value: null,
      valueBaseType: 'float',
      valueCardinality: 'single',
      valueLowerBound: null,
      valueUpperBound: null,
      valueDefaultValue: new BigNumber(0).toNumber(),
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

    getLowerBound () {
      return this.valueLowerBound
    },

    setLowerBound (lowerBound) {
      this.valueLowerBound = lowerBound
    },

    getUpperBound () {
      return this.valueUpperBound
    },

    setUpperBound (upperBound) {
      this.valueUpperBound = upperBound
    },

    getDefaultValue () {
      return this.valueDefaultValue
    },

    setDefaultValue (defaultValue) {
      this.valueDefaultValue = defaultValue
    },

    computeFloatValue (textContent) {
      let value = null
      try {
        value = new BigNumber(textContent)
      } catch (err) {
        throw new QtiParseException(err.message)
      }
      return value.toNumber()
    },

    /**
     * Apply mapping constraints to a value.
     * @param - value (BigNumber object) - value to be constrained
     * @return - a constrained result
     */
    applyConstraints (value) {
      if ((value === null) || !BigNumber.isBigNumber(value)) {
        return null
      }

      if (this.getLowerBound() !== null) {
        if (value.comparedTo(this.getLowerBound()) < 0) {
          value = new BigNumber(this.getLowerBound())
        }
      }

      if (this.getUpperBound() !== null) {
        if (value.comparedTo(this.getUpperBound()) > 0) {
          value = new BigNumber(this.getUpperBound())
        }
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
     * Iterate through the child qti-area-map-entry nodes, performing validation tests on
     * the children.  Set the mapping table if all validation tests pass.
     */
    validateChildren () {
      let countAreaMapEntries = 0

      this.$slots.default.forEach((slot) => {
        if (this.isValidSlot(slot)) {
          // Detect anything other than areaMapEntry
          if (slot.componentOptions.tag === 'qti-area-map-entry') {
            countAreaMapEntries += 1
          } else {
            throw new QtiValidationException('Node is not a qti-area-map-entry: "' + slot.componentOptions.tag + '"')
          }
        }
      })
      if (countAreaMapEntries < 1) {
        throw new QtiValidationException('Must have at least one qti-area-map-entry node')
      }
      // All good.  Save off our mapping.
      this.setValue(this.processChildren())
    },

    /**
     * Builds the final mapping array from the children.
     * @return - constructed mapping array
     */
     processChildren () {
      let mapping = null

      this.$children.forEach((mapEntry) => {
        if (mapping === null) {
          mapping = []
        }
        mapping.push(mapEntry.getValue())
      })

      return mapping
    }

  },

  created () {
    try {
      // Validate the attributes. convert all to proper BigNumber floats
      if (typeof this.lowerBound !== 'undefined') {
        this.setLowerBound(this.computeFloatValue(qtiAttributeValidation.FloatValue(this.lowerBound)))
      }
      if (typeof this.upperBound !== 'undefined') {
        this.setUpperBound(this.computeFloatValue(qtiAttributeValidation.FloatValue(this.upperBound)))
      }
      if (typeof this.defaultValue !== 'undefined') {
        this.setDefaultValue(this.computeFloatValue(qtiAttributeValidation.FloatValue(this.defaultValue)))
      }
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
        console.log('[QtiAreaMapping][lowerBound][upperBound][defaultValue][Value]', this.getLowerBound(), this.getUpperBound(), this.getDefaultValue(), this.getValue())
      } catch (err) {
        this.isQtiValid = false
        throw new QtiValidationException(err.message)
      }
    }
  }
}
</script>
