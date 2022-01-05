<template>
  <div class="qti-map-response">
    <slot></slot>
  </div>
</template>

<script>
/*
 * This expression looks up the value of a response variable and then transforms it using the associated mapping,
 * which must have been declared. The result is a single float. If the response variable has single cardinality
 * then the value returned is simply the mapped target value from the map. If the response variable has multiple
 * or ordered cardinality then the value returned is the sum of the mapped target values. This expression cannot
 * be applied to variables of record cardinality.
 *
 * For example, if a mapping associates the identifiers {A,B,C,D} with the values {0,1,0.5,0} respectively then
 * mapResponse will map the single value 'C' to the numeric value 0.5 and the set of values {C,B} to the value 1.5.
 *
 * If a container contains multiple instances of the same value then that value is counted once only. To continue
 * the example above {B,B,C} would still map to 1.5 and not 2.5.
 */
import { store } from '@/store/store'
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'

const qtiAttributeValidation = new QtiAttributeValidation()
const qtiProcessing = new QtiProcessing()

export default {
  name: 'QtiMapResponse',

  props: {
    // Identifiers should have no more than 32 characters for compatibility with version 1.
    identifier: {
      type: String,
      required: true
    }
  },

  data () {
    return {
      value: null,
      valueBaseType: 'float',
      valueCardinality: 'single',
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

    setCardinality (cardinality) {
      this.valueCardinality = cardinality
    },

    /**
     * Iterate through the child nodes:
     * There should be zero child nodes of this component.
     */
    validateChildren () {
      // TODO: ??
    },

    evaluate () {
      try {
        let responseDeclaration = qtiAttributeValidation.validateResponseIdentifierAttribute (store, this.identifier)

        if (typeof responseDeclaration === 'undefined') {
          throw new QtiEvaluationException('Cannot find response declaration for identifier: "' + this.identifier + '"')
        }

        if (responseDeclaration.mapping === null) {
          throw new QtiEvaluationException('Cannot find mapping for response declaration: "' + this.identifier + '"')
        }

        this.setValue(qtiProcessing.mapResponse(responseDeclaration))
        return this.getValue()
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
  },

  created () {
    try {
      let responseDeclaration = qtiAttributeValidation.validateResponseIdentifierAttribute (store, this.identifier)
      if (responseDeclaration.cardinality === 'record') {
        throw new QtiValidationException('Cannot be applied to variables of "record" cardinality')
      }
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
        this.validateChildren()
      } catch (err) {
        this.isQtiValid = false
        throw new QtiValidationException(err.message)
      }
    }
  }
}
</script>
