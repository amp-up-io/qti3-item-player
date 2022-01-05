<template>
  <div class="qti-value"
    v-bind:variable-basetype="variableBaseType"
    v-bind:variable-cardinality="variableCardinality">
    <div class="amp-value__container">
      <slot></slot>
    </div>
  </div>
</template>

<script>
/* A class that can represent a single value of any base-type in variable declarations and
 * result reports. The base-type is defined by the 'base-type' attribute of the declaration except
 * in the case of variables with record cardinality.
 *
 * Parents can be qti-correct-response or qti-default-value.
 */
import { store } from '@/store/store'
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiParseException from '@/components/qti/exceptions/QtiParseException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiValueValidation from '@/components/qti/validation/QtiValueValidation'
import BigNumber from 'bignumber.js'

const qtiAttributeValidation = new QtiAttributeValidation()
const qtiValueValidation = new QtiValueValidation()

export default {
  name: 'QtiValue',

  props: {
    // This characteristic is only used for specifying the base-type of a value that forms part of a record.
    baseType: {
      type: String,
      required: false
    },
    // This characterisic is only used for specifying the field identifier for a value that forms part of a record.
    fieldIdentifier: {
      type: String,
      required: false
    }
  },

  data () {
    return {
      singleValue: null,
      valueBaseType: null,
      valueCardinality: 'single',
      valueFieldIdentifier: null,
      variableBaseType: null,
      variableCardinality: null,
      isQtiValid: true
    }
  },

  methods: {

    getValue () {
      if (this.isNull()) {
        return null
      }

      switch(this.valueBaseType) {
        case 'integer':
        case 'float':
          return this.singleValue.toNumber()

        case 'boolean':
          return this.singleValue

        case 'string':
        case 'identifier':
          return this.singleValue

        default:
          console.log('[QtiValue][GetValue Exception]', 'Unhandled BaseType:' + this.valueBaseType)
          return null
      }
    },

    isNull () {
      return this.singleValue === null
    },

    getBaseType () {
      return this.valueBaseType
    },

    getCardinality () {
      return 'single'
    },

    getFieldIdentifier () {
      return this.valueFieldIdentifier
    },

    isRecordFieldValue () {
      return ((this.valueFieldIdentifier !== null) && (this.valueBaseType !== null))
    },

    readChildren (node) {
      if (this.valueBaseType != null) {
        this.singleValue = this.parseSingleValue(this.valueBaseType, node.textContent)
      }
    },

    parseSingleValue (baseType, textContent) {
      let value = null
      try {
        switch(baseType) {
          case 'integer':
            value = new BigNumber(qtiValueValidation.IntegerValue(textContent))
            break

          case 'float':
            value = new BigNumber(qtiValueValidation.FloatValue(textContent))
            break

          case 'boolean':
            value = qtiValueValidation.BooleanValue(textContent)
            break

          case 'string':
            value = qtiValueValidation.StringValue(textContent)
            break

          case 'identifier':
            value = qtiValueValidation.IdentifierValue(textContent)
            break

          default:
            throw new QtiParseException('[QtiValue][Unhandled BaseType]: "' + baseType + '"')
        }
      } catch (err) {
        throw new QtiParseException(err.message)
      }
      return value
    },

    _getVariableBaseType (responseDeclaration) {
      return (typeof responseDeclaration !== 'undefined' ? responseDeclaration.baseType : null)
    },

    _getVariableCardinality (responseDeclaration) {
      return (typeof responseDeclaration !== 'undefined' ? responseDeclaration.cardinality : null)
    },

    _validateAttributes (variableBaseType, variableCardinality) {
      if (variableCardinality === 'record') {
        // Parent variable is a record.
        // Must have baseType and fieldIdentifier attributes defined
        if (typeof this.baseType === 'undefined') {
          throw new QtiValidationException('base-type is a required attribute for "record" cardinality')
        } else {
          qtiAttributeValidation.validateBaseType(this.baseType)
          this.valueBaseType = this.baseType
        }
        if (typeof this.fieldIdentifier === 'undefined') {
          throw new QtiValidationException('field-identifier is a required attribute for "record" cardinality')
        } else {
          qtiAttributeValidation.validateIdentifierAttribute(this.fieldIdentifier)
          this.valueFieldIdentifier = this.fieldIdentifier
        }
      } else {
        // Parent variable is not a record
        // must not have baseType or fieldIdentifier
        if (typeof this.baseType !== 'undefined') {
          throw new QtiValidationException('base-type only permitted for record cardinality.')
        }
        if (typeof this.fieldIdentifier !== 'undefined') {
          throw new QtiValidationException('field-identifier only permitted for record cardinality.')
        }
        this.valueBaseType = variableBaseType
      }
    }

  },

  created: function() {
    try {
      let declaration = qtiAttributeValidation.validateVariableIdentifierAttribute (store, this.$parent.$parent.$props.identifier)

      if (typeof declaration === 'undefined') {
        // Did not find required variable declaration
        throw new QtiValidationException('Variable declaration not found: "' + this.$parent.$parent.$props.identifier + '"')
      }

      // Found a declaration.  Pull its cardinality and baseType.
      this.variableCardinality = this._getVariableCardinality(declaration)
      this.variableBaseType = this._getVariableBaseType(declaration)
      this._validateAttributes(this.variableBaseType, this.variableCardinality)
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

  mounted: function() {
    let node = this.$el.querySelector(`.amp-value__container`)
    if (this.isQtiValid) {
      try {
        this.readChildren(node)
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
      console.log('[' + this.$options.name + '][Value:' + this.getValue() + '][BaseType:' + this.getBaseType() + '][FieldIdentifier:' + this.getFieldIdentifier() + ']')
    }
    node.remove()
  }
}
</script>
