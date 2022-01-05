<template>
  <div class="qti-field-value">
    <slot></slot>
  </div>
</template>

<script>
/*
 * The field-value operator takes a sub-expression with a record container value. The result
 * is the value of the field with the specified fieldIdentifier. If there is no field with
 * that identifier then the result of the operator is NULL.
 */
import { store } from '@/store/store'
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'

const qtiAttributeValidation = new QtiAttributeValidation()
const qtiProcessing = new QtiProcessing()

export default {
  name: 'QtiFieldValue',

  props: {
    /*
     * The identifier of the field to be selected.
     */
    fieldIdentifier: {
      type: String,
      required: true
    }
  },

  data () {
    return {
      value: null,
      valueBaseType: null,
      valueCardinality: 'single',
      expression: null,
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
      return qtiProcessing.isNullValue(this.value)
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
     * Examine the child node:
     * expressions (1)
     */
    validateChildren: function () {
      let countExpression = 0
      this.$slots.default.forEach((slot) => {
        if (this.isValidSlot(slot)) {
          // Detect an expression
          if (qtiProcessing.isExpressionNode(slot.componentOptions.tag)) {
            countExpression += 1
          } else {
            throw new QtiValidationException('Node is not an Expression: "' + slot.componentOptions.tag + '"')
          }
        }
      })
      if (countExpression !== 1) {
        throw new QtiValidationException('Must have exactly one Expression node')
      }
      // Perform extra semantic validations on the expression
      this.validateExpressions()
      // All good.  Save off our children.
      this.processChildren()
    },

    validateExpressions () {
      if (this.$children.length === 1) {
        let expression = this.$children[0]
        if (expression.getCardinality() !== 'record') {
          throw new QtiValidationException('Expression must be of cardinality="record"')
        }
        // The expression node is a record.  Get a base-type for this Field.
        this.setBaseType(this.processFieldBaseType(expression))
      } else {
        throw new QtiValidationException('Must have exactly one Expression node')
      }
    },

    processChildren () {
      this.expression = this.$children[0]
    },

    /**
     * @description Get a base-type for this Field.
     * @param node - Should be an expression resolving to a record variable
     */
    processFieldBaseType (node) {
      switch (node.$vnode.componentOptions.tag) {
        case 'qti-variable':
        case 'qti-correct':
          return this.getFieldBaseTypeFromRecordVariable(node.$vnode.componentOptions.propsData.identifier)
        default:
          // What is the expression node ??
          return null
      }
    },

    getFieldBaseTypeFromRecordVariable (variableIdentifier) {
      let variableDeclaration

      try {
        variableDeclaration = qtiAttributeValidation.validateVariableIdentifierAttribute(store, variableIdentifier)
      } catch (err) {
        // No variable declaration found for this identifier.  Bail.
        return null
      }

      // Bail if our variable is not a record.
      if (variableDeclaration.cardinality !== 'record') return null

      // Pluck the field value from the record
      if (variableDeclaration.defaultValue !== null) {
        const fieldDeclaration = variableDeclaration.defaultValue.get(this.fieldIdentifier)
        return (typeof fieldDeclaration !== 'undefined') ? fieldDeclaration.getBaseType() : null
      }

      // No default value.  If this is a response declaration, check if there is a correctResponse definition
      try {
        variableDeclaration = qtiAttributeValidation.validateResponseIdentifierAttribute (store, variableIdentifier)
      } catch (err) {
        // If we get here, it's because no response declaration was found for this identifier. Bail.
        return null
      }

      // This is a response declaration.  Check for a correctResponse definition.
      if (variableDeclaration.correctResponse !== null) {
        const fieldDeclaration = variableDeclaration.correctResponse.get(this.fieldIdentifier)
        return (typeof fieldDeclaration !== 'undefined') ? fieldDeclaration.getBaseType() : null
      }

      // oh well ...
      return null
    },

    evaluate () {
      try {
        // The expression should resolve to a Record
        let value = this.expression.evaluate()

        if (qtiProcessing.isNullValue(value)) {
          console.log('[FieldValue][' + this.fieldIdentifier + ']', null)
          this.setValue(qtiProcessing.nullValue())
          return this.getValue()
        }

        if (value.getCardinality() !== 'record') {
          throw new QtiEvaluationException('qti-field-value expression is not cardinality="record"')
        }

        // Get the field value component from the record hashmap
        let fieldValue = value.get(this.fieldIdentifier)

        // Will be undefined if record does not have the field
        if (typeof fieldValue === 'undefined') {
          console.log('[FieldValue][' + this.fieldIdentifier + ']', null)
          this.setValue(qtiProcessing.nullValue())
          return this.getValue()
        }

        this.setValue(fieldValue.getValue())
        console.log('[FieldValue][' + this.fieldIdentifier + ']', this.getValue())
        return this.getValue()
      } catch (err) {
        if (err.name === 'QtiValidationException') {
          throw new QtiValidationException(err.message)
        } else if (err.nae === 'QtiEvaluationException') {
          throw new QtiEvaluationException(err.message)
        } else {
          throw new Error(err.message)
        }
      }
    }
  },

  mounted () {
    if (this.isQtiValid) {
      try {
        this.validateChildren()
      } catch (err) {
        this.isQtiValid = false
        throw new QtiValidationException(err.message)
      }
    }
  }
}
</script>
