<template>
  <div class="qti-response-else-if">
    <slot></slot>
  </div>
</template>

<script>
/*
 * This provides the 'ElseIf' clause of the 'If..Then..Else' for the response
 * processing functionality. A responseElseIf part consists of an expression which must have an
 * effective baseType of boolean and single cardinality. It also contains a set of sub-rules.
 * If the expression is 'true' then the sub-rules are processed, otherwise they are skipped
 * (including if the expression is NULL) and the following responseElseIf or responseElse
 * parts (if any) are considered instead.
 *
 * qti-response-else-if is defined in an identical way to qti-response-if.
 */
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiExitProcessingException from '@/components/qti/exceptions/QtiExitProcessingException'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'

const qtiProcessing = new QtiProcessing()

export default {
  name: 'QtiResponseElseIf',

  data () {
    return {
      expression: null,
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
     * expression (1)
     * responseRule (*)
     */
    validateChildren () {
      let countExpression = 0
      this.$slots.default.forEach((slot) => {
        if (this.isValidSlot(slot)) {
          // Detect an expression
          if (qtiProcessing.isExpressionNode(slot.componentOptions.tag)) {
            if (countExpression === 0) {
                countExpression = 1
            } else {
              throw new QtiValidationException('Multiple Expression nodes: "' + slot.componentOptions.tag + '"')
            }
          }
          // Detect * Response Rules after the Expression
          else if (qtiProcessing.isResponseRuleNode(slot.componentOptions.tag)) {
            if (countExpression === 0) {
              throw new QtiValidationException('Response Rules must follow an Expression node: "' + slot.componentOptions.tag + '"')
            }
          } else {
            throw new QtiValidationException('Node is not an Expression or a Response Rule: "' + slot.componentOptions.tag + '"')
          }
        }
      })
      if (countExpression === 0) {
        throw new QtiValidationException('Must have exactly one Expression node')
      }
      // All good.  Save off our children.
      this.processChildren()
    },

    processChildren () {
      let firstRule = true
      this.$children.forEach((rule) => {
        if (firstRule) {
          firstRule = false
          this.expression = rule
        } else {
          this.responseRules.push(rule)
        }
      })
    },

    evaluate () {
      try {
        if (this.expression.evaluate()) {
          this.responseRules.forEach((rule) => {
            rule.evaluate()
          })
          return true
        }
        return false
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
        this.validateChildren()
      } catch (err) {
        this.isQtiValid = false
        throw new QtiValidationException(err.message)
      }
    }
  }
}
</script>
