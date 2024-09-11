<template>
  <div class="qti-context-declaration" v-bind:identifier="identifier">
    <slot></slot>
  </div>
</template>

<script>
/*
 * Context declarations declare item variables that are global in scope.
 *
 * Context variables are initialized at the start of an item session.  They can have their
 * values set and retrieved during templateProcessing or responseProcessing.
 */
import Vue from 'vue'
import { store } from '@/store/store'
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiParseException from '@/components/qti/exceptions/QtiParseException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'
import QtiDefaultValue from '@/components/qti/declarations/QtiDefaultValue'

Vue.component('qti-default-value', QtiDefaultValue)

const qtiAttributeValidation = new QtiAttributeValidation()
const qtiProcessing = new QtiProcessing()

export default {
  name: 'QtiContextDeclaration',

  props: {
    identifier: {
      type: String,
      required: true
    },
    baseType: {
      type: String,
      // baseType not required on cardinality==record
      required: false
    },
    cardinality: {
      type: String,
      required: true
    }
  },

  data () {
    return {
      // this is the value that is set via defaultValue, template processing, or response processing
      value: null,
      /* [0-1] multiplicity */
      defaultValue: null,
      // internal validation status
      isQtiValid: true
    }
  },

  methods: {

    getIdentifier () {
      return this.identifier
    },

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
      if (this.cardinality === 'record') return null
      return this.baseType
    },

    getCardinality () {
      return this.cardinality
    },

    /**
     * Utility method to resets value of this variable to default.
     */
    initializeValue () {
      // 1) if has defaultValue, use it
      if (this.defaultValue !== null) {
        this.setValue(this.defaultValue)
        return
      }
      // 2) null
      this.setValue(qtiProcessing.nullValue())
    },

    /**
     * Resets value of this templateDeclaration to default if it exists, or null.
     */
    reset () {
      this.initializeValue()
    },

    /**
     * Iterate through the optional child node: qti-default-value
     */
    readChildren: function () {
      this.$children.forEach((node) => {
        // detect the node type from the className
        switch (node.$el.className) {
          case 'qti-default-value':
            this.defaultValue = node.getValue()
            break

          default:
            throw new QtiValidationException('[' + this.$options.name + '][Unhandled Child Node]: "' + node.$el.className + '"')
        }
      })
    },

    /**
     * @description Retrieve this variable's prior state.
     * When not null, has this schema:
     * {
     *   identifier: [String],
     *   value: [Value saved from last attempt]
     * }
     * @param {String} identifier - of an outcome variable
     */
    getPriorState (identifier) {
      const priorState = store.getItemContextStateVariable(identifier)
      console.log('[ContextDeclaration][' + identifier + '][priorState]', priorState)

      // If priorState is null, we are not restoring anything
      if (priorState === null) return null

      // Perform basic consistency checking on this priorState
      if (!('value' in priorState)) {
        throw new QtiEvaluationException('Variable Restore State Invalid.  "value" property not found.')
      }

      this.setValue(priorState.value)
      return priorState
    }
  },

  created: function() {
    try {
      qtiAttributeValidation.validateCardinality(this.cardinality)
      qtiAttributeValidation.validateBaseTypeAndCardinality(this.baseType, this.cardinality === 'record')
      qtiAttributeValidation.validateIdentifierAttribute(this.identifier)

      // Notify store of our initial model.  We need this Initial
      // definition before we can properly parse template variable references
      // in the rest of the item.
      store.defineContextDeclaration({
          identifier: this.identifier,
          baseType: this.getBaseType(),
          cardinality: this.getCardinality(),
          value: null,
          resetValue: this.reset,
          defaultValue: null
        })

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

  mounted: function () {
    if (this.isQtiValid) {
      try {
        this.readChildren()

        if (this.getPriorState(this.identifier) === null) {
          // Initialize a value when no prior state
          this.initializeValue()
        }

        // Notify store of our updated model.
        store.defineContextDeclaration({
            identifier: this.identifier,
            baseType: this.getBaseType(),
            cardinality: this.getCardinality(),
            value: this.getValue(),
            resetValue: this.reset,
            defaultValue: this.defaultValue
          })

        console.log('[' + this.$options.name + '][' + this.identifier + '][DefaultValue]', this.defaultValue)
      } catch (err) {
        this.isQtiValid = false
        if (err.name === 'QtiValidationException') {
          throw new QtiValidationException(err.message)
        } else if (err.name === 'QtiEvaluationException') {
          throw new QtiEvaluationException(err.message)
        } else {
          throw new Error(err.message)
        }
      }
    }
  }
}
</script>

<style>
div.qti-context-declaration {
  display:none;
}
</style>
