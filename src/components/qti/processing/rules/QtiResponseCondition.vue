<template>
  <div class="qti-response-condition">
    <slot></slot>
  </div>
</template>

<script>
/*
 * This enables the 'If..Then..Else' rules to be defined for the response processing.
 * If the expression given in a responseIf or responseElseIf evaluates to 'true' then
 * the sub-rules contained within it are followed and any following responseElseIf or
 * responseElse parts are ignored for this response condition. If the expression given
 * in a responseIf or responseElseIf does not evaluate to 'true' then consideration
 * passes to the next responseElseIf or, if there are no more responseElseIf parts
 * then the sub-rules of the responseElse are followed (if specified)
 */
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiExitProcessingException from '@/components/qti/exceptions/QtiExitProcessingException'

const qtiAttributeValidation = new QtiAttributeValidation()

export default {
  name: 'QtiResponseCondition',

  data () {
    return {
      responseRules: [],
      isQtiValid: true
    }
  },

  methods: {

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
     * Iterate through the child nodes:
     * qti-response-if (1)
     * qti-response-else-if (*)
     * qti-response-else (0..1)
     */
    validateChildren () {
      // Must have at least 1
      let countResponseIf = 0
      // Must not have more than 1
      let countResponseElse = 0
      this.$slots.default.forEach((slot) => {
        if (qtiAttributeValidation.isValidSlot(slot)) {
          // detect the slot type from the component tag
          switch (slot.componentOptions.tag) {
            case 'qti-response-if':
              if (countResponseIf === 0) {
                countResponseIf = 1
              } else {
                throw new QtiValidationException('Only 1 qti-response-if node permitted')
              }
              break

            case 'qti-response-else':
              if (countResponseIf === 0) {
                throw new QtiValidationException('qti-response-else node not permitted before qti-response-if')
              }
              if (countResponseElse === 0) {
                countResponseElse = 1
              } else {
                throw new QtiValidationException('More than one qti-response-else node')
              }
              break

            case 'qti-response-else-if':
              if (countResponseIf === 0) {
                throw new QtiValidationException('qti-response-else-if node not permitted before qti-response-if')
              }
              if (countResponseElse === 1) {
                throw new QtiValidationException('qti-response-else-if node not permitted after qti-response-else')
              }
              break

            default:
              throw new QtiValidationException('Invalid Child Node: "' + slot.componentOptions.tag + '"')
          }
        }
      })
      if (countResponseIf === 0) {
        throw new QtiValidationException('Must have 1 qti-response-if node')
      }
      // All good.  Save off our children.
      this.processChildren()
    },

    processChildren () {
      this.$children.forEach((rule) => {
        this.responseRules.push(rule)
      })
    },

    evaluate () {
      try {
        this.responseRules.every(rule => {
          if (rule.evaluate()) {
            return false
          }
          return true
        })
      } catch (err) {
        if (err.name === 'QtiValidationException') {
          throw new QtiValidationException(err.message)
        } else if (err.name === 'QtiEvaluationException') {
          throw new QtiEvaluationException(err.message)
        } else if (err.name === 'QtiExitProcessingException') {
          throw new QtiExitProcessingException(err.message)
        } else {
          throw new Error(err.message)
        }
      }
    }
  },

  mounted () {
    if (this.isQtiValid) {
      try {
        // Validate children.
        this.validateChildren()
      } catch (err) {
        this.isQtiValid = false
        throw new QtiValidationException(err.message)
      }
    }
  }
}
</script>
