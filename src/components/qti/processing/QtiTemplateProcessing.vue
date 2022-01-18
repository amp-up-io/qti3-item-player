<template>
  <div class="qti-template-processing">
    <slot></slot>
  </div>
</template>

<script>
/*
 * Template processing consists of one or more templateRules that are followed by the cloning engine or
 * delivery system in order to assign values to the template variables. Template processing is identical in
 * form to responseProcessing except that the purpose is to assign values to template variables,
 * not outcome variables.
 */
import { store } from '@/store/store'
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'
import '@/components/qti/processing'

const qtiProcessing = new QtiProcessing()

export default {
  name: 'QtiTemplateProcessing',

  props: {
  },

  data () {
    return {
      templateRules: [],
      isQtiValid: true,
    }
  },

  methods: {

    /**
     * @description If a qti-template-constraint is 'false' (including if the expression is NULL),
     * the template variables are set to their default values and templateProcessing is restarted;
     */
    resetTemplateProcessing () {
      // Reset template variables
      store.resetTemplateVariables()
      // Restart the processing
      this.evaluate()
    },

    /**
     * Iterate through the optional child nodes:
     * qti-set-template-value
     * qti-exit-template
     * qti-template-condition
     * qti-set-default-value
     * qti-set-correct-response
     * qti-template-constraint
     */
    validateChildren () {
      this.$children.forEach((node) => {
        if (!qtiProcessing.isTemplateRuleNode(node.$el.className)) {
          throw new QtiValidationException('Invalid Template Rule: "' + node.$el.className + '"')
        }
      })
      this.processChildren()
    },

    processChildren () {
      this.$children.forEach((rule) => {
        this.templateRules.push(rule)
      })
    },

    evaluate () {
      try {
        this.templateRules.forEach((rule) => {
          rule.evaluate()
        })
      } catch (err) {
        if (err.name === 'QtiValidationException') {
          throw new QtiValidationException(err.message)
        } else if (err.name === 'QtiEvaluationException') {
          throw new QtiEvaluationException(err.message)
        } else if (err.name === 'QtiExitProcessingException') {
          console.log('[' + err.name + '] ' + err.message)
        } else if (err.name === 'QtiTemplateConstraintException') {
          this.resetTemplateProcessing()
        } else {
          throw new Error(err.message)
        }
      }
    }

  },

  created () {
  },

  mounted () {
    if (this.isQtiValid) {
      try {
        // Post-process children
        this.validateChildren()
        // Notify item we have a template processing node.
        this.$parent.$emit('templateProcessingReady', { templateProcessing: this })
      } catch (err) {
        this.isQtiValid = false
        throw new QtiValidationException(err.message)
      }
    }
  }
}
</script>
