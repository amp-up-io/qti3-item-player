<template>
  <div class="qti-default-value">
    <slot></slot>
  </div>
</template>

<script>
/* An optional default value for the variable. The point at which a variable is set to its
 * default value varies depending on the type of item variable.
 */
import Vue from 'vue'
import QtiValue from '@/components/qti/declarations/QtiValue'
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'

Vue.component('qti-value', QtiValue)

export default {
  name: 'QtiDefaultValue',

  props: {
    /* A human readable interpretation of the default value. */
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
      let defaultValue = null

      this.$children.forEach((node) => {
        switch (this.variableCardinality) {
          case 'record':
            // Initialize a hashmap
            if (defaultValue === null) defaultValue = new Map()

            // Add the node if it has a proper base-type and field-identifier
            // Use field-identifier for the key.
            if (node.isRecordFieldValue()) {
              defaultValue.set(node.getFieldIdentifier(), node)
            }
            break
          case 'multiple':
          case 'ordered':
            // Initialize an array
            if (defaultValue === null) defaultValue = []

            // Add value to the array
            defaultValue.push(node.getValue())
            break
          case 'single':
            defaultValue = (defaultValue === null ? node.getValue() : defaultValue)
            break
          default:
            console.log('[DefaultValue][Cardinality]: readChildren cardinality unhandled = ' + this.variableCardinality)
        }
      })

      return defaultValue
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
        console.log('[DefaultValue][Value:', this.getValue() ,'][BaseType:' + this.getBaseType() + '][Cardinality:' + this.getCardinality() + ']')
      } catch (err) {
        this.isQtiValid = false
        throw new QtiValidationException(err.message)
      }
    }
  }
}
</script>
