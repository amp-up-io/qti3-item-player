<template>
  <div class="qti-map-entry">
    <div class="amp-mapentry__container">
      <slot></slot>
    </div>
  </div>
</template>

<script>
/*
 * A special class used to create a mapping from a source set of any baseType (except file and duration) to
 * a single float. Note that mappings from values of base type float should be avoided due to the difficulty
 * of matching floating point values, see the match operator for more details. When mapping containers the
 * result is the sum of the mapped values from the target set. See mapResponse for details.
 * Note: A qti-mapping must contain at least one qti-map-entry
 */
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiParseException from '@/components/qti/exceptions/QtiParseException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import BigNumber from 'bignumber.js'

const qtiAttributeValidation = new QtiAttributeValidation()

export default {
  name: 'QtiMapEntry',

  props: {
    /*
     * [1] Multiplicity
     * The source value
     */
    mapKey: {
      type: String,
      required: true
    },
    /*
     * [1] Multiplicity
     * The mapped value
     */
    mappedValue: {
      type: String,
      required: true
    },
    /*
     * [0..1] Multiplicity
     * Used to control whether or not a mapEntry string is matched case sensitively. The default value is false.
     */
    caseSensitive: {
      type: String,
      required: false
    }
  },

  data () {
    return {
      value: null,
      valueBaseType: 'float',
      valueCardinality: 'single',
      valueMappedValue: null,
      valueCaseSensitive: false,
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

    setMappedValue (mappedValue) {
      this.valueMappedValue = mappedValue
    },

    getMappedValue () {
      return this.valueMappedValue
    },

    setCaseSensitive (caseSensitive) {
      this.valueCaseSensitive = caseSensitive
    },

    getCaseSensitive () {
      return this.valueCaseSensitive
    },

    computeMappedValue (textContent) {
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
     * qti-map-entry is not supposed to contain any children.
     */
    validateChildren () {
      if (this.$slots.default) {
        this.$slots.default.forEach((slot) => {
          if (this.isValidSlot(slot)) {
            throw new QtiValidationException('Invalid Child Node: "' + slot.componentOptions.tag + '"')
          }
        })
      }
      // All good.  Save off our map entry object.
      this.setValue({
        mapKey: this.mapKey,
        mappedValue: this.getMappedValue(),
        caseSensitive: this.getCaseSensitive()
      })
    }

  },

  created () {
    try {
      // validate the attributes.  case-sensitive (not required) defaults to false.
      this.setCaseSensitive(qtiAttributeValidation.validateCaseSensitive(this.caseSensitive, false))
      this.setMappedValue(this.computeMappedValue(qtiAttributeValidation.FloatValue(this.mappedValue)))
    } catch (err) {
      this.isQtiValid = false
      throw new QtiParseException(err.message)
    }
  },

  mounted () {
    let node = this.$el.querySelector(`.amp-mapentry__container`)
    if (this.isQtiValid) {
      this.validateChildren()
      console.log('[' + this.$options.name + '][Value]', this.getValue())
    }
    node.remove()
  }
}
</script>
