<template>
  <div class="qti-template-constraint">
    <slot></slot>
  </div>
</template>

<script>
/*
 * A templateConstraint contains an expression which must have an effective baseType of boolean
 * and single cardinality. If the expression is 'false' (including if the expression is NULL),
 * the template variables are set to their default values and templateProcessing is restarted;
 * this happens repeatedly until the expression is 'true' or the maximum number of iterations is
 * reached. In the event that the maximum number of iterations is reached, any default values
 * provided for the variables during declaration are used. Processing then continues with the
 * next templateRule after the templateConstraint, or finishes if there are no further
 * templateRules. By using a templateConstraint, authors can ensure that the values of variables
 * set during templateProcessing satisfy the condition specified by the boolean expression.
 * For example, two randomly selected numbers might be required which have no common factors.
 * A templateConstraint may occur anywhere as a child of templateProcessing. It may not be used
 * as a child of any other element. Any number of templateConstraints may be used, though two
 * or more consecutive templateConstraints could be combined using the 'and' element to combine
 * their boolean expressions. The maximum number of times that the operations preceding the
 * templateConstraint can be expected to be performed is assumed to be 100; implementations
 * may permit more iterations, but there must be a finite maximum number of iterations. This
 * prevents the occurrence of an endless loop. It is the responsibility of the author to provide
 * default values for any variables assigned under a templateConstraint.
 */
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiTemplateConstraintException from '@/components/qti/exceptions/QtiTemplateConstraintException'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'

const qtiProcessing = new QtiProcessing()

export default {
  name: 'QtiTemplateConstraint',

  data () {
    return {
      expression: null,
      iterationCount: 0,
      isQtiValid: true
    }
  },

  methods: {

    getIterationCount () {
      return this.iterationCount
    },

    setIterationCount (iterationCount) {
      this.iterationCount = iterationCount
    },

    incrementIterationCount () {
      this.setIterationCount(this.getIterationCount() + 1)
    },

    resetIterationCount () {
      this.setIterationCount(0)
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
     * Iterate through the child nodes.
     * There should be exactly one expression.
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
          } else {
            throw new QtiValidationException('Node is not an Expression: "' + slot.componentOptions.tag + '"')
          }
        }
      })
      if (countExpression === 0) {
        throw new QtiValidationException('Must have exactly one Expression node')
      }
      // Perform extra semantic validations on the expression.
      this.validateExpression()
      // All good.  Save off our children.
      this.processChildren()
    },

    validateExpression () {
      let expression = this.$children[0]
      if (expression.getBaseType() !== 'boolean') {
        throw new QtiValidationException('Expression must be of base-type="boolean"')
      }
      if (expression.getCardinality() !== 'single') {
        throw new QtiValidationException('Expression must be of cardinality="single"')
      }
    },

    processChildren () {
      this.expression = this.$children[0]
    },

    evaluate () {
      try {
        // Implementations must support at least 100 iterations.
        // If we exceed max iterations then we proceed with the next
        // template processing rule (if any)
        if (this.iterationCount > 100) {
          this.resetIterationCount()
          console.log('[TemplateConstraint][MaxIterations]')
          // Proceed with next template rule
          return
        }

        let value = this.expression.evaluate()

        if (qtiProcessing.isNullValue(value) || (!value)) {
          this.incrementIterationCount()
          console.log('[TemplateConstraint][False][' + this.getIterationCount() + ']')
          throw new QtiTemplateConstraintException('TemplateConstraint:false')
        }

        this.resetIterationCount()
        console.log('[TemplateConstraint][True]')
        // Proceed with next template rule
      } catch (err) {
        if (err.name === 'QtiValidationException') {
          throw new QtiValidationException(err.message)
        } else if (err.name === 'QtiEvaluationException') {
          throw new QtiEvaluationException(err.message)
        } else if (err.name === 'QtiTemplateConstraintException') {
          throw new QtiTemplateConstraintException(err.message)
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
