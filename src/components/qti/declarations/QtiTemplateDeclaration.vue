<template>
  <div class="qti-template-declaration" v-bind:identifier="identifier">
    <slot></slot>
  </div>
</template>

<script>
/*
 * Template declarations declare item variables that are to be used specifically for the purposes of cloning items.
 * They can have their value set only during templateProcessing. They are referred to within the itemBody in order
 * to individualize the clone and possibly also within the responseProcessing rules if the cloning process affects
 * the way the item is scored.
 *
 * Template variables are initialized at the start of an item session.  Template processing may update
 * template variables during each iteration of template processing.  If a templateConstraint=true is
 * encountered then Template variables are reinitialized.
 *
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
  name: 'QtiTemplateDeclaration',

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
    },
    /*
     * [0-1] multiplicity
     * This characteristic determines whether or not the template variable's value should be substituted for object
     * parameter values that match its name.  Resolves to a boolean value.
     */
    paramVariable: {
      type: String,
      required: false,
      default: 'false'
    },
    /*
     * [0-1] multiplicity
     * This characteristic determines whether or not the template variable's value should be substituted for
     * identifiers that match its name in MathML expressions. See Combining Template Variables and MathML (Section 2)
     * for more information.
     */
    mathVariable: {
      type: String,
      required: false,
      default: 'false'
    }
  },

  data () {
    return {
      // this is the value that is set via defaultValue or in template processing
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
      return this.baseType
    },

    getCardinality () {
      return this.cardinality
    },

    /**
     * Utility method to reset value of this variable to default.
     */
    initializeValue () {
      // 1) if has defaultValue, use it
      if (this.defaultValue !== null) {
        this.setValue(this.defaultValue)
        return
      }

      // Unlike with outcome variables, the QTI specification is not clear about resetting
      // numeric template variables.
      // 2) if single cardinality and numeric baseType, set value to 0
      //if ((this.getCardinality() === 'single') && qtiProcessing.isBaseTypeNumeric(this.getBaseType())) {
      //  this.setValue(new BigNumber(0).toNumber())
      //  return
      //}

      // 3) null
      this.setValue(qtiProcessing.nullValue())
    },

    /**
     * Resets value of this templateDeclaration to default if it exists, or null.
     */
    reset () {
      this.initializeValue()
      // Notify store of our value
      store.setTemplateVariableValue({
          identifier: this.identifier,
          value: this.getValue()
        })
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

      // Notify $store of our initial model.  We need this Initial
      // definition before we can properly parse template variable references
      // in the rest of the item.
      store.defineTemplateDeclaration({
          identifier: this.identifier,
          baseType: this.getBaseType(),
          cardinality: this.getCardinality(),
          value: null,
          defaultValue: null,
          paramVariable: (this.paramVariable === 'true'),
          mathVariable: (this.mathVariable === 'true'),
          node: this
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
        store.defineTemplateDeclaration({
            identifier: this.identifier,
            baseType: this.getBaseType(),
            cardinality: this.getCardinality(),
            value: this.getValue(),
            defaultValue: this.defaultValue,
            paramVariable: (this.paramVariable === 'true'),
            mathVariable: (this.mathVariable === 'true'),
            node: this
          })

        console.log('[' + this.$options.name + '][' + this.identifier + '][Value]', this.getValue())
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
div.qti-template-declaration {
  display:none;
}
</style>
