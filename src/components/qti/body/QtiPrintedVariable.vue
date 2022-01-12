<template>
  <div ref="root" class="qti-printed-variable">
    {{value}}
  </div>
</template>

<script>
/*
 * The outcome variable or template variable must have been defined. The values of response variables
 * cannot be printed directly as their values are implicitly known to the candidate through the interactions
 * they are bound to; if necessary, their values can be assigned to outcomes during responseProcessing and
 * displayed to the candidate as part of a bodyElement visible only in the appropriate feedback states.
 *
 * If the variable's value is NULL then the element is ignored. Variables of baseType string are treated as
 * simple runs of text. Variables of baseType integer or float are converted to runs of text (strings) using
 * the formatting rules described below. Float values should only be formatted in the e, E, f, g, G, r or R styles.
 * Variables of baseType duration are treated as floats, representing the duration in seconds. Variables of baseType
 * file are rendered using a control that enables the user to open the file. The control should display the name
 * associated with the file, if any. Variables of baseType uri are rendered using a control that enables the user
 * to open the identified resource, for example, by following a hypertext link in the case of a URL. For variables
 * of single cardinality, the value of the variable is printed. For variables of ordered cardinality, if the
 * attribute index is set, the single value corresponding to the indexed member is printed, otherwise an ordered
 * list of the values within the container is printed, delimited by the string value of the delimiter attribute.
 * For variables of multiple cardinality, a list of the values within the container is printed, delimited by
 * the string value of the delimiter attribute. For variables of record cardinality, if the attribute field is
 * set, the value corresponding to the specified field is printed, otherwise a list of the field names and
 * corresponding field values within the variable is printed, delimited by the string value of the delimiter
 * attribute and with the correspondence between them indicated by the string value of the mappingIndicator
 * attribute.
 */
import { store } from '@/store/store'
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import printf from 'printf'

const qtiAttributeValidation = new QtiAttributeValidation()

export default {
  name: 'QtiPrintedVariable',

  props: {
    id: {
      type: String,
      required: false
    },
    language: {
      type: String,
      required: false
    },
    label: {
      type: String,
      required: false
    },
    baseuri: {
      type: String,
      required: false
    },
    /*
     * [1] multiplicity
     * The outcome variable or template variable must have been defined. The values of response variables
     * cannot be printed directly as their values are implicitly known to the candidate through the interactions
     * they are bound to; if necessary, their values can be assigned to outcomes during responseProcessing
     * and displayed to the candidate as part of a bodyElement visible only in the appropriate feedback states.
     */
    identifier: {
      type: String,
      required: true
    },
    /*
     * [0..1] multiplicity
     * The format conversion specifier to use when converting numerical values to strings
     * (see Number Formatting Rules in Subsection 2.3.4 for details).
     */
    format: {
      type: String,
      required: false
    },
    base: {
      type: String,
      required: false
    },
    index: {
      type: String,
      required: false
    },
    powerForm: {
      type: String,
      required: false
    },
    field: {
      type: String,
      required: false
    },
    delimiter: {
      type: String,
      required: false
    },
    mappingIndicator: {
      type: String,
      required: false
    }
  },

  data () {
    return {
      value: this.identifier,
      declaration: null,
      isQtiValid: true
    }
  },

  methods: {

    printedValue (value) {
      if (typeof this.format === 'undefined') {
        return value
      }
      return printf(this.format, value)
    },

    evaluate () {
      try {
        this.declaration = qtiAttributeValidation.validatePrintedVariableIdentifierAttribute(store, this.identifier)
        this.value = this.printedValue(this.declaration.value)
        console.log('[QtiPrintedVariable][' + this.identifier + '][Value]', this.value)
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
      qtiAttributeValidation.validatePrintedVariableIdentifierAttribute(store, this.identifier)
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

        // Notify $store of our new component
        store.dispatch(
          'definePrintedVariable', {
            node: this
          })

        this.evaluate()
      } catch (err) {
        this.isQtiValid = false
        throw new QtiValidationException(err.message)
      }
    }
  }
}
</script>

<style>
.qti-printed-variable {
  display: inline-block;
}
</style>
