<template>
  <div class="qti-outcome-declaration" v-bind:identifier="identifier">
    <slot></slot>
  </div>
</template>

<script>
/**
 * Outcome variables are declared by outcome declarations. Their value is set either from a default given in the declaration itself or
 * by a responseRule during responseProcessing. Items that declare a numeric outcome variable representing the candidate's overall
 * performance on the item should use the outcome name 'SCORE' for the variable. SCORE needs to be a float. Items that declare a maximum
 * score (in multiple response choice interactions, for example) should do so by declaring the * 'MAXSCORE' variable. MAXSCORE needs
 * to be a float. Items or tests that want to make the fact that the candidate scored above a predefined treshold available as a variable
 * should use the 'PASSED' variable. PASSED needs to be a boolean. At runtime, outcome variables are instantiated as part of an item
 * session. Their values may be initialized with a default value and/or set during responseProcessing. If no default value is given in
 * the declaration then the outcome variable is initialized to NULL unless the outcome is of a numeric type (integer or float) in which
 * case it is initialized to 0. Declared outcomes with numeric types should indicate their range of possible values using normalMaximum
 * and normalMinimum, especially if this range differs from [0,1].
 */
import Vue from 'vue'
import { store } from '@/store/store'
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiParseException from '@/components/qti/exceptions/QtiParseException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'
import QtiDefaultValue from '@/components/qti/declarations/QtiDefaultValue'
import QtiInterpolationTable from '@/components/qti/declarations/QtiInterpolationTable'
import QtiMatchTable from '@/components/qti/declarations/QtiMatchTable'
import BigNumber from 'bignumber.js'

Vue.component('qti-default-value', QtiDefaultValue)
Vue.component('qti-interpolation-table', QtiInterpolationTable)
Vue.component('qti-match-table', QtiMatchTable)

const qtiAttributeValidation = new QtiAttributeValidation()
const qtiProcessing = new QtiProcessing()

export default {
  name: 'QtiOutcomeDeclaration',

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
    view: {
      // A list from an enumerated value set of: { author | candidate | proctor | scorer | testConstructor | tutor }
      type:String,
      required: false
    },
    interpretation: {
      type: String,
      required: false
    },
    longInterpretation: {
      type: String,
      required: false
    },
    normalMaximum: {
      type: String,
      required: false
    },
    normalMinimum: {
      type: String,
      required: false
    },
    masteryValue: {
      type: String,
      required: false
    },
    externalScored: {
      type: String,
      required: false
    },
    variableIdentifierRef: {
      type: String,
      required: false
    }
  },

  data () {
    return {
      value: null,
      /* [0-1] multiplicity */
      defaultValue: null,
      /* [0-1] multiplicity */
      lookupTable: null,
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
      // 2) if single cardinality and numeric baseType, set value to 0
      if ((this.getCardinality() === 'single') && qtiProcessing.isBaseTypeNumeric(this.getBaseType())) {
        this.setValue(new BigNumber(0).toNumber())
        return
      }
      // 3) null
      this.setValue(qtiProcessing.nullValue())
    },

    /**
  	 * Resets value of this variable to default.
  	 *
  	 * Per IMS QTI Test, Section and Item Information Model section "2.2.2.2 Outcome Variables", "At runtime,
  	 * outcome variables are instantiated as part of an item session.  Their values may be initialized
  	 * with a default value and/or set during responseProcessing. If no default value is given in the
  	 * declaration then the outcome variable is initialized to NULL unless the outcome is of a numeric
  	 * type (integer or float) in which case it is initialized to 0."
  	 */
    reset () {
      this.initializeValue()
      // Notify store of our value
      store.setOutcomeVariableValue({
          identifier: this.identifier,
          value: this.getValue()
        })
    },

    /**
     * Iterate through the optional child nodes:
     * [0-1] qti-default-value
     * [0-1] qti-match-table || qti-interpolation-table
     */
    readChildren () {
      let lookupTableCount = 0
      this.$children.forEach((node) => {
        // detect the node type from the className
        switch (node.$el.className) {
          case 'qti-default-value':
            this.defaultValue = node.getValue()
            break

          case 'qti-match-table':
          case 'qti-interpolation-table':
            // Max of 1 of these
            if (lookupTableCount > 0) {
              throw new QtiValidationException('[' + this.$options.name + '] maximum of one lookupTable permitted "' + node.$el.className + '"')
            } else {
              lookupTableCount = 1
            }
            this.lookupTable = node
            break

          default:
            throw new QtiValidationException('[' + this.$options.name + '][Unhandled Child Node]: "' + node.$el.className + '"')
        }
      })
    }
  },

  created () {
    try {
      qtiAttributeValidation.validateCardinality(this.cardinality)
      qtiAttributeValidation.validateBaseTypeAndCardinality(this.baseType, this.cardinality === 'record')
      qtiAttributeValidation.validateIdentifierAttribute(this.identifier)

      // A little extra validation for the SCORE and MAXSCORE variables - because SCORE is frequently improperly defined.
      if ((this.identifier === 'SCORE') || (this.identifier === 'MAXSCORE')) {
        if ((typeof this.baseType === 'undefined') || (this.baseType !== 'float')) {
          throw new QtiValidationException('Outcome declaration "' + this.identifier + '" has invalid base-type.  Must be base-type="float".')
        }
        if ((typeof this.cardinality === 'undefined') || (this.cardinality !== 'single')) {
          throw new QtiValidationException('Outcome declaration "' + this.identifier + '" has invalid cardinality.  Must be cardinality="single".')
        }
      }

      // Notify store of our initial model.  We need this Initial
      // definition before we can properly parse outcome variable references
      // in the rest of the item.
      store.defineOutcomeDeclaration({
          identifier: this.identifier,
          baseType: this.getBaseType(),
          cardinality: this.getCardinality(),
          value: null,
          defaultValue: null,
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

  mounted () {
    if (this.isQtiValid) {
      try {
        this.readChildren()

        // Initialize a value
        this.initializeValue()

        store.defineOutcomeDeclaration({
            identifier: this.identifier,
            baseType: this.getBaseType(),
            cardinality: this.getCardinality(),
            view: this.view,
            interpretation: this.interpretation,
            longInterpretation: this.longInterpretation,
            normalMaximum: this.normalMaximum,
            normalMinimum: this.normalMinimum,
            masteryValue: this.masteryValue,
            externalScored: this.externalScored,
            variableIdentifierRef: this.variableIdentifierRef,
            value: this.getValue(),
            defaultValue: this.defaultValue,
            lookupTable: this.lookupTable,
            lookupTableType: this.lookupTableType,
            node: this
          })

        console.log('[' + this.$options.name + '][' + this.identifier + '][DefaultValue]', this.defaultValue, '[lookupTable]', this.lookupTable)
      } catch (err) {
        this.isQtiValid = false
        throw new QtiValidationException(err.message)
      }
    }
  }
}
</script>
