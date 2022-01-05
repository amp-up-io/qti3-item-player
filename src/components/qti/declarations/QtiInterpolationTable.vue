<template>
  <div class="qti-interpolation-table">
    <slot></slot>
  </div>
</template>

<script>
/*
 * An interpolationTable transforms a source float (or integer) by finding the first interpolationTableEntry
 * with a sourceValue that is less than or equal to (subject to includeBoundary) the source value. For example,
 * an interpolation table can be used to map a raw numeric score onto an identifier representing a grade. It may
 * also be used to implement numeric transformations such as those from a simple raw score to a value on a
 * calibrated scale.
 */
import Vue from 'vue'
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiParseException from '@/components/qti/exceptions/QtiParseException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiInterpolationTableEntry from '@/components/qti/declarations/QtiInterpolationTableEntry'

Vue.component('qti-interpolation-table-entry', QtiInterpolationTableEntry)

const qtiAttributeValidation = new QtiAttributeValidation()

export default {
  name: 'QtiInterpolationTable',

  props: {
    /*
     * [0-1] multiplicity
     * The default outcome value to be used when no matching table entry is found. If omitted, the NULL value is used.
     */
    defaultValue: {
      type: String,
      required: false
    }
  },

  data () {
    return {
      // value contains the table of interpolation table entries
      value: null,
      valueBaseType: null,
      valueCardinality: 'single',
      valueDefaultValue: null,
      tableType: 'interpolation',
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

    setBaseType (baseType) {
      this.valueBaseType = baseType
    },

    getCardinality () {
      return this.valueCardinality
    },

    getTableType() {
      return this.tableType
    },

    getDefaultValue () {
      return this.valueDefaultValue
    },

    setDefaultValue (defaultValue) {
      this.valueDefaultValue = defaultValue
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
     * Iterate through the child qti-interpolation-table-entry nodes, performing validation tests on
     * the children.  Set the interpolation table if all validation tests pass.
     */
    validateChildren () {
      let countEntries = 0
      this.$slots.default.forEach((slot) => {
        if (this.isValidSlot(slot)) {
          // Detect anything other than qti-interpolation-table-entry
          if (slot.componentOptions.tag === 'qti-interpolation-table-entry') {
            countEntries += 1
          } else {
            throw new QtiValidationException('Node is not a qti-interpolation-table-entry: "' + slot.componentOptions.tag + '"')
          }
        }
      })
      if (countEntries < 1) {
        throw new QtiValidationException('Must have at least one qti-interpolation-table-entry node')
      }
      // All good.  Save off our interpolationTable.
      this.setValue(this.processChildren())
    },

    /**
     * Builds the final interpolationTable array from the children.
     * @return - constructed interpolationTable array
     */
    processChildren () {
      let table = null

      this.$children.forEach((tableEntry) => {
        if (table === null) {
          table = []
        }
        table.push(tableEntry.getValue())
      })

      return table
    }

  },

  created () {
    try {
      let declarationBaseType = this.$parent.getBaseType()
      this.setBaseType(declarationBaseType)
      if (typeof this.defaultValue === 'undefined') {
        this.setDefaultValue(null)
      } else {
        this.setDefaultValue(qtiAttributeValidation.validateValueFromBaseType(declarationBaseType, this.defaultValue))
      }
    } catch (err) {
      this.isQtiValid = false
      throw new QtiParseException(err.message)
    }
  },

  mounted () {
    if (this.isQtiValid) {
      try {
        this.validateChildren()
        console.log('[QtiInterpolationTable][DefaultValue][Value]', this.getDefaultValue(), this.getValue())
      } catch (err) {
        this.isQtiValid = false
        throw new QtiValidationException(err.message)
      }
    }
  }
}
</script>
