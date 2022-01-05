<template>
  <div class="qti-response-declaration" v-bind:identifier="identifier">
    <slot></slot>
  </div>
</template>

<script>
/*
 * Response variables are declared by response declarations and bound to interactions
 * in the itemBody.
 */
import Vue from 'vue'
import { store } from '@/store/store'
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiParseException from '@/components/qti/exceptions/QtiParseException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiDefaultValue from '@/components/qti/declarations/QtiDefaultValue'
import QtiCorrectResponse from '@/components/qti/declarations/QtiCorrectResponse'
import QtiMapping from '@/components/qti/declarations/QtiMapping'
import QtiAreaMapping from '@/components/qti/declarations/QtiAreaMapping'

Vue.component('qti-default-value', QtiDefaultValue)
Vue.component('qti-correct-response', QtiCorrectResponse)
Vue.component('qti-mapping', QtiMapping)
Vue.component('qti-area-mapping', QtiAreaMapping)

const qtiAttributeValidation = new QtiAttributeValidation()

export default {
  name: 'QtiResponseDeclaration',

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
      // this is the value that is set via defaultValue or an interaction response
      value: null,
      /* [0-1] multiplicity */
      defaultValue: null,
      /* [0-1] multiplicity */
      correctResponse: null,
      /* [0-1] multiplicity */
      mapping: null,
      /* [0-1] multiplicity */
      areaMapping: null,
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
      return this.baseType
    },

    getCardinality () {
      return this.cardinality
    },

    /**
     * Iterate through the optional child nodes: qti-default-value, qti-correct-response, qti-mapping, qti-area-mapping
     */
    readChildren: function () {
      this.$children.forEach((node) => {
        // detect the node type from the className
        switch (node.$el.className) {
          case 'qti-default-value':
            this.defaultValue = node.getValue()
            break

          case 'qti-correct-response':
            this.correctResponse = node.getValue()
            break

          case 'qti-mapping':
            this.mapping = node
            break

          /*
          case 'qti-area-mapping':
            this.areaMapping = node
            break
          */

          default:
            throw new QtiValidationException('[' + this.$options.name + '][Unhandled Child Node]: "' + node.$el.className + '"')
        }
      })
    }
  },

  created: function() {
    try {
      qtiAttributeValidation.validateCardinality(this.cardinality)
      qtiAttributeValidation.validateBaseTypeAndCardinality(this.baseType, this.cardinality === 'record')
      qtiAttributeValidation.validateIdentifierAttribute(this.identifier)

      // Notify store of our initial model.  We need this Initial
      // definition before we can properly process interactions.
      store.defineResponseDeclaration({
          identifier: this.identifier,
          baseType: this.getBaseType(),
          cardinality: this.getCardinality(),
          value: null,
          defaultValue: null,
          correctResponse: null,
          mapping: null,
          areaMapping: null
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

        // Notify store of our updated model.
        store.defineResponseDeclaration({
            identifier: this.identifier,
            baseType: this.getBaseType(),
            cardinality: this.getCardinality(),
            value: this.getValue(),
            defaultValue: this.defaultValue,
            correctResponse: this.correctResponse,
            mapping: this.mapping,
            areaMapping: this.areaMapping
          })

        console.log('[' + this.$options.name + '][' + this.identifier + '][CorrectResponse]', this.correctResponse, '[Mapping]', this.mapping)
      } catch (err) {
        this.isQtiValid = false
        throw new QtiValidationException(err.message)
      }
    }
  }
}
</script>
