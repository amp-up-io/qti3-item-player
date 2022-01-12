<template>
  <div ref="root" class="qti-modal-feedback">
    <ModalFeedback ref="modal">
      <template v-slot:header>
        <h5>{{ modalTitle }}</h5>
      </template>

      <template v-slot:body>
        <slot></slot>
      </template>

      <template v-slot:footer>
          <button class="btn btn-primary" @click="$refs.modal.hide()">OK</button>
      </template>
    </ModalFeedback>
  </div>
</template>

<script>
/*
 * Modal feedback is shown to the candidate directly following response processing. The value of an outcome
 * variable is used in conjunction with the showHide and identifier characteristics to determine whether or
 * not the feedback is shown. The content of the modalFeedback must not contain any interactions.
 */
import Vue from 'vue'
import { store } from '@/store/store'
import ModalDialog from '@/shared/components/ModalDialog'
import QtiStylesheet from '@/components/qti/general/QtiStylesheet'
import QtiContentBody from '@/components/qti/body/QtiContentBody'
import QtiCatalogInfo from '@/components/qti/catalog/QtiCatalogInfo'
import QtiPrintedVariable from '@/components/qti/body/QtiPrintedVariable'
//import Img from '@/components/qti/html/Img'
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'

const qtiAttributeValidation = new QtiAttributeValidation()

Vue.component('ModalDialog', ModalDialog)
Vue.component('qti-stylesheet', QtiStylesheet)
Vue.component('qti-content-body', QtiContentBody)
Vue.component('qti-catalog-info', QtiCatalogInfo)
Vue.component('qti-printed-variable', QtiPrintedVariable)
//Vue.component('amp-img', Img)

export default {
  name: 'QtiModalFeedback',

  props: {
    /*
     * [1] multiplicity
     * The identifier that determines the visibility of the feedback in conjunction with the showHide characteristic.
     */
    identifier: {
      type: String,
      required: true
    },
    /*
     * [1] multiplicity
     * The identifier of an outcome variable that must have a base-type of identifier and be of either single
     * or multiple cardinality. The visibility of the feedback is controlled by assigning a value (or values)
     * to this outcome variable during responseProcessing.
     */
    outcomeIdentifier: {
      type: String,
      required: true
    },
    /*
     * [1] multiplicity
     * The showHide characteristic determines how the visibility of the qti-modal-feedback is controlled.
     * If set to show then the modal is hidden by default and shown only if the associated outcome
     * variable matches, or contains, the value of the identifier characteristic. If set to hide then the
     * modal is shown by default and hidden if the associated outcome variable matches, or contains,
     * the value of the identifier characteristic.
     */
    showHide: {
      type: String,
      required: true
    },
    /*
     * Delivery engines are not required to present the title to the candidate but may do so, for example
     * as the title of a modal pop-up window.
     */
    title: {
      type: String,
      required: false
    }
  },

  computed: {
    modalTitle () {
      return (typeof this.title === 'undefined' ? undefined : this.title)
    }
  },

  data () {
    return {
      outcomeDeclaration: null,
      mathElementMap: new Map(),
      isQtiValid: true
    }
  },

  inheritAttrs: true,

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
      return this.$store.getters.getTemplateMathParameterVariables()
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
    },

    /**
     * @description This method shows or hides the Feedback based
     * on the show param value.  If show, we reveal, else we hide.
     * @param show (boolean)
     */
    display (show) {
      if (show) {
        // show
        this.$refs.modal.show()
      } else {
        // hide
        this.$refs.modal.hide()
      }
    },

    evaluate () {
      // Get outcomeDeclaration value
      this.outcomeDeclaration = qtiAttributeValidation.validateOutcomeIdentifierAttribute(store, this.outcomeIdentifier)

      if (this.outcomeDeclaration.cardinality === 'single') {
        if (this.outcomeDeclaration.value === this.identifier) {
          this.display(this.show)
          return
        }

        // If hide is true, but we don't have an identifier match, show the modal.
        if (!this.show) {
          this.display(true)
        }
        return
      }

      if (this.outcomeDeclaration.cardinality === 'multiple') {
        for (let i = 0; i < this.outcomeDeclaration.value.length; i++) {
          if (this.outcomeDeclaration.value[i] === this.identifier) {
            this.display(this.show)
            return
          }
        }

        // If hide is true, but we don't have an identifier match, show the modal.
        if (!this.show) {
          this.display(true)
        }
      }
    }
  },

  created () {
    try {
      let declaration = qtiAttributeValidation.validateOutcomeIdentifierAttribute(store, this.outcomeIdentifier)
      if (declaration.baseType !== 'identifier') {
        throw new QtiValidationException('Invalid outcome variable base-type: "' + declaration.baseType + '".  Must be "identifier".')
      }
      if ((declaration.cardinality !== 'single') && (declaration.cardinality !== 'multiple')) {
        throw new QtiValidationException('Invalid outcome variable cardinality: "' + declaration.cardinality + '".  Must be "single" or "multiple".')
      }
      qtiAttributeValidation.validateIdentifierAttribute(this.identifier)
      this.show = qtiAttributeValidation.validateShowHideAttribute(this.showHide)
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
        this.initializeTemplateMathVariables()

        // Notify $store of our new component
        store.dispatch(
          'defineFeedback', {
            outcomeIdentifier: this.outcomeIdentifier,
            identifier: this.identifier,
            feedbackType: 'Modal',
            node: this
          })

        console.log('[ModalFeedback]', this)
      } catch (err) {
        this.isQtiValid = false
        throw new QtiValidationException(err.message)
      }
    }
  }
}
</script>
