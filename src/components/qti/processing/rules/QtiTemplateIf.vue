<template>
  <div class="qti-template-if">
    <slot></slot>
  </div>
</template>

<script>
/*
 * This provides the 'If' clause of the 'If..Then..Else' for the template processing functionality.
 * A templateIf part consists of an expression which must have an effective baseType of boolean and single
 * cardinality. It also contains a set of sub-rules. If the expression is true then the sub-rules are
 * processed, otherwise they are skipped (including if the expression is NULL) and the following
 * templateElseIf or templateElse parts (if any) are considered instead.
 */
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiExitProcessingException from '@/components/qti/exceptions/QtiExitProcessingException'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'

const qtiAttributeValidation = new QtiAttributeValidation()
const qtiProcessing = new QtiProcessing()

export default {
  name: 'QtiTemplateIf',

  data () {
    return {
      expression: null,
      templateRules: [],
      isQtiValid: true
    }
  },

  methods: {

    /**
     * Iterate through the child nodes:
     * expression (1)
     * templateRule (*)
     */
    validateChildren () {
      let countExpression = 0
      this.$slots.default.forEach((slot) => {
        if (qtiAttributeValidation.isValidSlot(slot)) {
          // Detect an expression
          if (qtiProcessing.isExpressionNode(slot.componentOptions.tag)) {
            if (countExpression === 0) {
                countExpression = 1
            } else {
              throw new QtiValidationException('Multiple Expression nodes: "' + slot.componentOptions.tag + '"')
            }
          }
          // Detect * Template Rules after the Expression
          else if (qtiProcessing.isTemplateRuleNode(slot.componentOptions.tag)) {
            if (countExpression === 0) {
              throw new QtiValidationException('Template Rules must follow an Expression node: "' + slot.componentOptions.tag + '"')
            }
          } else {
            throw new QtiValidationException('Node is not an Expression or a Template Rule: "' + slot.componentOptions.tag + '"')
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
          this.templateRules.push(rule)
        }
      })
    },

    evaluate () {
      try {
        if (this.expression.evaluate()) {
          this.templateRules.forEach((rule) => {
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
