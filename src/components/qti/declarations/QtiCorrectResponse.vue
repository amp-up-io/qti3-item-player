<template>
  <div class="qti-correct-response">
    <slot></slot>
  </div>
</template>

<script>
/*
 * A response declaration may assign an optional correctResponse. This value may indicate the only possible value
 * of the response variable to be considered correct or merely just a correct value. For responses that are being
 * measured against a more complex scale than correct/incorrect this value should be set to the (or an) optimal value.
 * Finally, for responses for which no such optimal value is defined the correctResponse must be omitted.
 * If a delivery system supports the display of a solution then it should display the correct values of responses
 * (where defined) to the candidate. When correct values are displayed they must be clearly distinguished from the
 * candidate's own responses (which may be hidden completely if necessary).
 */
import Vue from 'vue'
import QtiValue from '@/components/qti/declarations/QtiValue'
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'

Vue.component('qti-value', QtiValue)

export default {
  name: 'QtiCorrectResponse',

  props: {
    /* A human readable interpretation of the correct value. */
    interpretation: {
      type: String,
      required: false
    }
  },

  data () {
    return {
      value: null,
      valueBaseType: null,
      valueCardinality: null,
      variableBaseType: null,
      variableCardinality: null,
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

    /**
     * Iterate through the child qti-value nodes. Construct a value.
     * @param - children (components) containing qti-value nodes
     * @return - constructed value
     */
    readChildren () {
      let correctResponse = null

      this.$children.forEach((node) => {
        switch (this.variableCardinality) {
          case 'record':
            // Initialize a hashmap
            if (correctResponse === null) correctResponse = new Map()

            // Add the node if it has a proper base-type and field-identifier
            // Use field-identifier for the key.
            if (node.isRecordFieldValue()) {
              correctResponse.set(node.getFieldIdentifier(), node)
            }
            break
          case 'multiple':
          case 'ordered':
            // Initialize an array
            if (correctResponse === null) correctResponse = []

            // Add value to the array
            correctResponse.push(node.getValue())
            break
          case 'single':
            correctResponse = (correctResponse === null ? node.getValue() : correctResponse)
            break
          default:
            console.log('[CorrectResponse][Cardinality]: readChildren cardinality unhandled = ' + this.variableCardinality)
        }
      })

      return correctResponse
    },

    getVariableBaseType () {
      return this.$parent.$props.baseType
    },

    getVariableCardinality () {
      return this.$parent.$props.cardinality
    },

    evaluate () {
      return this.getValue()
    }

  },

  created () {
    try {
      this.valueBaseType = this.variableBaseType = this.getVariableBaseType()
      this.valueCardinality = this.variableCardinality = this.getVariableCardinality()
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
        this.value = this.readChildren()
        console.log('[CorrectResponse][Value:', this.getValue() ,'][BaseType:' + this.getBaseType() + '][Cardinality:' + this.getCardinality() + ']')
      } catch (err) {
        this.isQtiValid = false
        throw new QtiValidationException(err.message)
      }
    }
  }
}
</script>
