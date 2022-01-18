<template>
  <div ref="root" class="qti-item-body">
    <slot></slot>
  </div>
</template>

<script>
import Vue from 'vue'
import { store } from '@/store/store'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiChoiceInteraction from '@/components/qti/interactions/QtiChoiceInteraction'
import QtiInlineChoiceInteraction from '@/components/qti/interactions/QtiInlineChoiceInteraction'
/*
import QtiTextEntryInteraction from '@/components/qti/interactions/QtiTextEntryInteraction'
import QtiCustomInteraction from '@/components/qti/interactions/QtiCustomInteraction'
import QtiEndAttemptInteraction from '@/components/qti/interactions/QtiEndAttemptInteraction'
import QtiFeedbackInline from '@/components/qti/body/QtiFeedbackInline'
import QtiFeedbackBlock from '@/components/qti/body/QtiFeedbackBlock'
import QtiRubricBlock from '@/components/qti/body/QtiRubricBlock'
import QtiTemplateInline from '@/components/qti/body/QtiTemplateInline'
import QtiTemplateBlock from '@/components/qti/body/QtiTemplateBlock'
import QtiPrintedVariable from '@/components/qti/body/QtiPrintedVariable'
import Img from '@/components/html/Img'
import AmpAudio from '@/components/html/AmpAudio'
*/

const qtiAttributeValidation = new QtiAttributeValidation()

Vue.component('qti-choice-interaction', QtiChoiceInteraction)
Vue.component('qti-inline-choice-interaction', QtiInlineChoiceInteraction)
/*
Vue.component('qti-text-entry-interaction', QtiTextEntryInteraction)
Vue.component('qti-custom-interaction', QtiCustomInteraction)
Vue.component('qti-end-attempt-interaction', QtiEndAttemptInteraction)
Vue.component('qti-feedback-inline', QtiFeedbackInline)
Vue.component('qti-feedback-block', QtiFeedbackBlock)
Vue.component('qti-rubric-block', QtiRubricBlock)
Vue.component('qti-template-inline', QtiTemplateInline)
Vue.component('qti-template-block', QtiTemplateBlock)
Vue.component('qti-printed-variable', QtiPrintedVariable)
Vue.component('amp-img', Img)
Vue.component('amp-audio', AmpAudio)
*/
Vue.component('amp-style', {
  render: function (createElement) {
    return createElement(
      'style',   // tag name
      this.$slots.default // array of children
    )
  }
})

export default {
  name: 'QtiItemBody',

  data () {
    return {
      mathElementMap: new Map()
    }
  },

  methods: {

    /**
     * @description This goes about the business of detecting mathml elements
     * and updating those elements in the event that there are any template math
     ^ variables in the mathml.
     */
    initializeTemplateMathVariables () {
      const mathVariables = this.getTemplateMathVariables()
      if (mathVariables.length === 0) {
        // Bail if there are no template math variables
        return
      }
      const mathElements = this.getMathElements()
      mathElements.forEach(function(mathElement) {
        // Save a copy of the original mathml IF the mathml element
        // has an id.  mathml elements with no id will not be archived and
        // cannot be updated later - for example when a new template is requested.
        this.archiveMathElement(mathElement)
        // Stamp math variable values onto the mathml
        mathElement.innerHTML = this.applyTemplateValuesToMathml(mathElement.innerHTML, mathVariables)
      }, this)
    },

    updateTemplateMathVariables () {
      const mathVariables = this.getTemplateMathVariables()
      if (mathVariables.length === 0) {
        return
      }
      const mathElements = this.getMathScriptElements()
      mathElements.forEach(function(mathElement) {
        for (let [key, archiveMathml] of this.mathElementMap) {
          const rx = new RegExp('id="(' + key + ')"', 'g')
          const hasMatchingId = mathElement.innerHTML.match(rx)
          if (hasMatchingId) {
            mathElement.innerHTML = this.applyTemplateValuesToMathml(archiveMathml, mathVariables)
            break
          }
        }
      }, this)
      this.reprocessMML()
    },

    getTemplateMathVariables () {
      return store.getTemplateMathParameterVariables()
    },

    getMathElements () {
      return this.$el.querySelectorAll(`math`)
    },

    getMathScriptElements () {
      return this.$el.querySelectorAll(`script[type="math/mml"]`)
    },

    archiveMathElement (mathElement) {
      // Generate an id if the math element has no id
      if (!mathElement.hasAttribute('id')) {
        mathElement.id = qtiAttributeValidation.randomString (5, 'a')
      }
      // Save the mathElement's original HTML with hashkey of the element's id.
      this.mathElementMap.set(mathElement.id, mathElement.outerHTML)
    },

    applyTemplateValuesToMathml (mathml, mathVariables) {
      let result = mathml
      // Search for variable identifiers inside of the mathml
      mathVariables.forEach(function(mathVariable) {
        const rx = new RegExp('<[mc]i[^>]*>(' + mathVariable.identifier + ')<\\/[mc]i>', 'g')
        const matches = mathml.match(rx)
        if (matches) {
          // Update the result with the new values inserted
          result = result.replace(rx, matches[0].replace(mathVariable.identifier, mathVariable.value))
        }
      })
      return result
    },

    reprocessMML () {
      this.$nextTick(() => {
        if (window.MathJax) {
          window.MathJax.Hub.Queue([
            'Reprocess',
            window.MathJax.Hub,
            this.$refs.root
          ])
        }
      })
    }

  },

  mounted () {
    this.initializeTemplateMathVariables()
    // Notify item we have a qti-item-body node
    this.$parent.$emit('itemBodyReady', { itemBody: this })
  }
}
</script>
