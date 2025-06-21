<template>
  <div ref="item" class="qti-assessment-item">
    <event-listener
      @templateProcessingReady="handleTemplateProcessingReady"
      @itemBodyReady="handleItemBodyReady">
      <div>
        <slot></slot>
      </div>
    </event-listener>
  </div>
</template>

<script>
/*
 * An assessment item encompasses the information that is presented to a candidate and information
 * about how to score the item. Scoring takes place when candidate responses are transformed into
 * outcomes by response processing rules.
 */
import Vue from 'vue'
import { store } from '@/store/store'
import { ItemStateFactory } from '@/shared/helpers/ItemStateFactory'
import { CatalogFactory } from '@/shared/helpers/CatalogFactory'
import EventListener from '@/shared/components/EventListener'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiContextDeclaration from '@/components/qti/declarations/QtiContextDeclaration'
import QtiResponseDeclaration from '@/components/qti/declarations/QtiResponseDeclaration'
import QtiTemplateDeclaration from '@/components/qti/declarations/QtiTemplateDeclaration'
import QtiTemplateProcessing from '@/components/qti/processing/QtiTemplateProcessing'
import QtiOutcomeDeclaration from '@/components/qti/declarations/QtiOutcomeDeclaration'
import QtiCompanionMaterialsInfo from '@/components/qti/companionmaterials/QtiCompanionMaterialsInfo'
import QtiStylesheet from '@/components/qti/general/QtiStylesheet'
import QtiAssessmentStimulusRef from '@/components/qti/general/QtiAssessmentStimulusRef'
import QtiItemBody from '@/components/qti/body/QtiItemBody'
import QtiResponseProcessing from '@/components/qti/processing/QtiResponseProcessing'
import QtiCatalogInfo from '@/components/qti/catalog/QtiCatalogInfo'
import QtiModalFeedback from '@/components/qti/general/QtiModalFeedback'

Vue.component('event-listener',EventListener)
Vue.component('qti-context-declaration', QtiContextDeclaration)
Vue.component('qti-response-declaration', QtiResponseDeclaration)
Vue.component('qti-template-declaration', QtiTemplateDeclaration)
Vue.component('qti-template-processing', QtiTemplateProcessing)
Vue.component('qti-outcome-declaration', QtiOutcomeDeclaration)
Vue.component('qti-companion-materials-info', QtiCompanionMaterialsInfo)
Vue.component('qti-stylesheet', QtiStylesheet)
Vue.component('qti-assessment-stimulus-ref', QtiAssessmentStimulusRef)
Vue.component('qti-item-body', QtiItemBody)
Vue.component('qti-response-processing', QtiResponseProcessing)
Vue.component('qti-catalog-info', QtiCatalogInfo)
Vue.component('qti-modal-feedback', QtiModalFeedback)

const qtiAttributeValidation = new QtiAttributeValidation()

export default {
  name: 'QtiAssessmentItem',

  props: {
    identifier: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: false
    },
    adaptive: {
      type: String,
      required: false
    },
    timeDependent: {
      type: String,
      required: false
    },
    'xml:lang': {
      type: String,
      required: false
    }
  },

  data () {
    return {
      /*
       * This is set to true if adaptive="true"
       */
      isAdaptive: false,
      /*
       * This is set to true if time-dependent="true"
       */
      isTimeDependent: false,
      /*
       * Parse this from xml:lang
       */
      lang: null,
      /*
       * Parse this from lang
       */
      locale: null,
      /*
       * Keep a handle on the CatalogFactory
       */
      catalogFactory: null,
      /*
       * Save getResponses callback here
       */
      getResponsesCallback: null
    }
  },

  methods: {

    /**
     * @description Call endAttempt, then retrieve all variable declarations, storing them in
     * an itemState class.
     * @param target - string which identifies a callback target
     * @return object with two properties: state which is an itemState class and target
     */
    getEndAttempt (target) {
      // End the attempt.
      // Evaluate response validity.
      // Fire response processing.
      // Evaluate outcomes.
      // Show feedback (if sessionControl permits it)
      this.endAttempt(undefined, function() {
        this.notifyAttemptResults('itemEndAttemptReady', target)
      }.bind(this))
    },

    /**
     * @description Retrieve all variable declarations, storing them in an itemState class.
     * @param target - string which identifies a callback target
     * @return object with two properties: state which is an itemState class and target
     */
    getSuspendAttempt (target) {
      // Update duration before calling getResponses
      store.updateItemDuration()

      // Update the store's responses and state of response variables
      this.getResponses(function() {
        // Examine session control for validateResponses.
        this.evaluateAttemptValidity(store.getItemContextSessionControl().getValidateResponses())
        // Notify that we are ready with results
        this.notifyAttemptResults('itemSuspendAttemptReady', target)
      }.bind(this))
    },

    /**
     * @description Score an attempt.  This executes response processing and reports the 
     * serialized state of the variables.
     * @param target - string which identifies a callback target
     * @return object with two properties: state which is an itemState class and target
     */
    getScoreAttempt (target) {
      this.processResponses(true)
      // Notify that we are ready with results
      this.notifyAttemptResults('itemScoreAttemptReady', target)
    },

    /**
     * @description Utility method to serialize state and emit an event with serialized state.
     * @param eventType - 'itemEndAttemptReady' |
     *                             'itemSuspendAttemptReady' |
     *                             'itemScoreAttemptReady'
     * @param target - string which identifies a callback target
     */
    notifyAttemptResults (eventType, target) {
      // Pull state from the store
      const state = new ItemStateFactory(this.identifier, store)

      this.$parent.$emit(eventType, {
        "state": state.getSerializedState(),
        "target": (typeof target !== 'undefined' ? target : null)
      })
    },

    /**
     * @description Should only be called from NotifyEndAttempt.
     * Examine the saved state of the item's validationMessages.
     * If there are messages, and validateResponses is true, reenable
     * the EndAttemptInteraction's.
     */
     notifyEndAttemptInteractionResults () {
      // Pull state from the store
      const state = new ItemStateFactory(this.identifier, store)
      const serializedState = state.getSerializedState()

      // Enable the endAttempt interactions if there are validation
      // messages and Session Control validateResponses is true
      if (store.getItemContextSessionControl().getValidateResponses() && (serializedState.validationMessages.length > 0)) {
        store.getInteractions().forEach((interaction) => {
          if (interaction.interactionType !== 'EndAttemptInteraction') return
          if (interaction.interactionSubType !== 'endattempt-controller-bar') return
          interaction.enable()
        })
      }

      this.$parent.$emit('itemEndAttemptReady', {
        "state": serializedState,
        "target": null
      })
    },

    /**
     * @description This executes immediately upon completion
     * of an item's qti-template-processing $mount
     * @param node - an object containing a templateProcessing node
     */
    handleTemplateProcessingReady (node) {
      console.log('[QtiAssessmentItem][TemplateProcessingReady]')

      // Save template processing node in the $store
      store.defineTemplateProcessing({
          node: node.templateProcessing
        })

      // If no prior state, execute our template processing.
      if (!store.hasItemContextState()) this.executeTemplateProcessing()
    },

    /**
     * @description This executes immediately upon completion
     * of a qti-item-body $mount
     * @param node - an object containing an itemBody node
     */
    handleItemBodyReady (node) {
      console.log('[QtiAssessmentItem][ItemBodyReady][Adaptive=' + this.isAdaptive + ']', node)

      // Save the itemBody node in the store
      store.defineItemBody({
          node: node.itemBody
        })

      this.initializeResponseDeclarations(store.hasItemContextState())
      this.initializeOutcomeDeclarations(store.hasItemContextState())

      if (this.isAdaptive) {
        this.evaluateFeedbacks()
      }

      if ((store.getItemLifecycleStatus() === 'closed') ||
          (store.getItemLifecycleStatus() === 'review') ||
          (store.getItemLifecycleStatus() === 'solution')) {
        // Kill the timer and reset it to 0
        store.resetItemTimer()
        // Disable all interactions
        this.disableInteractions()
      }
    },

    /**
     * @description Utility method to get the qti-item-body node.
     * @return the itemBody node
     */
    getItemBody () {
      return store.getItemBody()
    },

    /**
     * @description Utility method to get the qti-template-processing node.
     * @return the templateProcessing node, or null
     */
    getTemplateProcessing () {
      let processing = store.getProcessing('template')
      return (typeof processing === 'undefined' ? null : processing.node)
    },

    /**
     * @description Utility method to get the qti-response-processing node.
     * @return the responseProcessing node, or null
     */
    getResponseProcessing () {
      let processing = store.getProcessing('response')
      return (typeof processing === 'undefined' ? null : processing.node)
    },

    /**
     * @description This handles all of the required actions when a
     * new template is requested from the currently loaded item.
     */
    newTemplate () {
      console.log('[QtiAssessmentItem][NewTemplate][Started]')
      // 1) Inform any listeners that we are generating a new template
      this.$parent.$emit('itemNewTemplate')
      // 2) Reset the values of the response declarations
      this.resetResponseDeclarations()
      // 3) Reset the interactions
      this.resetInteractions()
      // 4) Reset the template declarations
      this.resetTemplateDeclarations()
      // 5) Run template processing to generate new template variables
      this.executeTemplateProcessing()
      // 6) Evaluate all printed variables
      this.evaluatePrintedVariables()
      // 7) Evaluate all template math variables
      this.evaluateTemplateMathVariables()
      // 8) Evaluate all templates
      this.evaluateTemplates()
      // 9) Reset the values of the outcome declarations
      this.resetOutcomeDeclarations()
      // 10) Evaluate all feedbacks
      this.evaluateFeedbacks()
      // 11) Restart the item timer
      store.restartItemTimer()
      console.log('[QtiAssessmentItem][NewTemplate][Completed]')
      // 12) Inform any listeners that we have completed generating the new template
      this.$parent.$emit('itemNewTemplateCompleted')
    },

    evaluateTemplateMathVariables () {
      const mathVariables = store.getTemplateMathParameterVariables()
      if (mathVariables.length === 0) {
        // Bail if there are no template math variables
        return
      }
      // Update the Item Body
      const bodyNode = this.getItemBody()
      if (bodyNode !== null) {
        bodyNode.updateTemplateMathVariables()
      }
      // Update any Modal Feedbacks.
      // These are outside of the Item Body structure.
      store.getFeedbacks().forEach((feedback) => {
        if (feedback.feedbackType === 'Modal') {
          feedback.node.updateTemplateMathVariables()
        }
      })
    },

    executeTemplateProcessing () {
      let templateProcessing = this.getTemplateProcessing()
      if (templateProcessing !== null) {
        templateProcessing.evaluate()
      }
    },

    initializeOutcomeDeclarations (hasPriorState) {
      if (hasPriorState)
        // restore from State
        store.restoreOutcomeVariables()
      else
        // initialize to default values
        this.resetOutcomeDeclarations()
    },

    resetOutcomeDeclarations () {
      store.getOutcomeDeclarations().forEach((od) => {
        this.resetOutcomeDeclaration(od)
      }, this)
    },

    resetOutcomeDeclaration (declaration) {
      // If a variable was declared, it has a reset method.
      if (declaration.node !== undefined) {
        declaration.node.reset()
        return
      }
      // Must be a built-in variable that was never explicitly declared.
      // Reset its value to its built-in default.
      store.setOutcomeVariableValue({
          identifier: declaration.identifier,
          value: declaration.defaultValue
        })
    },

    initializeResponseDeclarations (hasPriorState) {
      if (hasPriorState)
        // restore from State
        store.restoreResponseVariables()
      else
        // initialize to default values
        this.resetResponseDeclarations()
    },

    resetResponseDeclarations () {
      store.getResponseDeclarations().forEach((rd) => {
        if (rd.resetValue) {
          rd.resetValue()
        }
      })
    },

    resetTemplateDeclarations () {
      store.getTemplateDeclarations().forEach((td) => {
        td.node.reset()
      })
    },

    resetInteractions () {
      // Reset the interactions themselves
      store.getInteractions().forEach((interaction) => {
        console.log('[ResetInteractions][' + interaction.identifier + ']', interaction)
        if (interaction.resetValue) {
          interaction.resetValue()
        }
        // Enable the interaction in case it was previously disabled.
        if (interaction.node.enable) {
          interaction.node.enable()
        }
      })
      // Reset isValidResponse in the store's interaction state
      store.resetInteractionStateIsValidResponse()
    },

    disableInteractions () {
      store.getInteractions().forEach((interaction) => {
        if (interaction.node.disable) {
          interaction.node.disable()
        }
      })
    },

    /**
     * @description Show all interactions' solution state.  This calls
     * each interaction's internal showSolution method - if one exists.
     */
    showSolutionInteractions () {
      // NOOP if session control showSolution = false (default)
      if (!store.getItemContextSessionControl().getShowSolution()) return

      // NOOP if Item lifecycle is not 'solution'
      if (store.getItemLifecycleStatus() !== 'solution') return

      store.getInteractions().forEach((interaction) => {
        if (interaction.node.showSolution) {
          interaction.node.showSolution(store.getResponseVariableCorrectResponse(interaction.identifier))
        }
      })
    },

    evaluateFeedbacks () {
      console.log('[EvaluateFeedback][Started]')
      store.getFeedbacks().forEach((feedback) => {
        feedback.node.evaluate()
      })
      console.log('[EvaluateFeedback][Completed]')
    },

    evaluatePrintedVariables () {
      console.log('[EvaluatePrintedVariables][Started]')
      store.getPrintedVariables().forEach((pv) => {
        pv.node.evaluate()
      })
      console.log('[EvaluatePrintedVariables][Completed]')
    },

    evaluateTemplates () {
      console.log('[EvaluateTemplates][Started]')
      store.getTemplates().forEach((template) => {
        template.node.evaluate()
      })
      console.log('[EvaluateTemplates][Completed]')
    },

    endAttempt (stateObject, callback) {
      console.log('[EndAttempt][Start][Identifier]', this.identifier)

      // Update duration before calling getResponses
      store.updateItemDuration()

      this.getResponses(function() {
        // Evaluate response validity if item session control validateResponses=true
        const isAttemptValid = this.evaluateAttemptValidity(store.getItemContextSessionControl().getValidateResponses())
        if (!isAttemptValid) {
          console.log('[EndAttempt][InvalidResponses][Identifier]', this.identifier)
          if (callback) callback()
          return
        }

        this.processResponses()

        if (this.isAdaptive) {
          this.evaluateItemCompleted()
        }

        // End attempt can be invoked from several different places.  In the event
        // that this was invoked by a Show Feedback end attempt interaction, this
        // will disable or enable other end attempt interactions in the UI.
        this.updateItemBodyUI(stateObject)

        console.log('[EndAttempt][Complete][Identifier]', this.identifier)

        if (callback) callback()

      }.bind(this))
    },

    updateItemBodyUI (stateObject) {
      // If the stateObject is undefined, this indicates that the endAttempt
      // was NOT invoked by an end attempt interaction.  In this case, bail.
      if (typeof stateObject === 'undefined') return

      // This was invoked by an endAttempt interaction - such as a Show Hint.  If this is
      // not a endattempt-controller-bar endAttempt interaction, disable the
      // endattempt-controller-bar if any exist in the item body.
      // By default, ALL end attempt interaction's are disabled when clicked.
      if (stateObject.interactionSubType !== 'endattempt-controller-bar') {
        // Was not a controller bar end attempt.
        store.getInteractions().forEach((interaction) => {
          if (interaction.interactionType === 'EndAttemptInteraction') {

            if (interaction.interactionSubType === 'endattempt-controller-bar') {
              interaction.disable()
              return
            }

            if (this.isAdaptive) {
              // In an adaptive item we want to disable any qti-end-attempt-interaction's
              // once completionStatus is 'completed'.
              if (this.isAdaptiveItemCompleted()) {
                interaction.disable()
                return
              }

              // adaptive=true and completionStatus is not 'completed'.
              // Re-enable the qti-end-attempt-interaction.
              interaction.enable()
            }
          }
        })
      }
    },

    getResponses (callback) {
      console.log('[GetResponses][Start]')

      // Initial setup for saving and callback
      store.getAsyncStateMap().clear()
      this.getResponsesCallback = callback

      let responseVariables = store.getResponseDeclarations()

      for (let i=0; i<responseVariables.length; i++) {
        const responseVariable = responseVariables[i]
        const interaction = store.getInteraction(responseVariable.identifier)

        if (typeof interaction === 'undefined') {
          // Response variable that is not bound to an interaction.
          // Set this to a default value (if one exists) or NULL - unless
          // the response is numAttempts or duration
          if ((responseVariable.identifier !== 'numAttempts' ) && (responseVariable.identifier !== 'duration')) {
            store.resetResponseVariableValue({
                identifier: responseVariable.identifier,
                value: responseVariable.defaultValue,
                state: null
              })
          }

          continue
        }

        // Response variable is bound to an interaction.
        if (interaction.interactionType !== 'PortableCustom') {
          console.log('[GetResponses][' + responseVariable.identifier + ']:', interaction.node.getResponse())
          // Notify store of our response
          store.setResponseVariableValue({
              identifier: responseVariable.identifier,
              value: interaction.node.getResponse(),
              state: interaction.node.getState()
            })
          
          continue
        }
        
        // The interaction must be a PCI.
        // Add the interaction's identifier to the asyncStateMap
        // if the PCI successfully loaded.
        if (interaction.node.pciIsReady()) {
          store.getAsyncStateMap().set(interaction.identifier, {
              identifier: interaction.identifier,
              node: interaction.node
            })
        } else {
          // Notify store of our response - presumably null
           store.setResponseVariableValue({
              identifier: responseVariable.identifier,
              value: interaction.node.getResponse(),
              state: interaction.node.getState()
            })
        }
      }

      this.initiateAsyncGetResponsesRequests()
    },

    initiateAsyncGetResponsesRequests () {
      // Get out of here right away if we have no async GetStateRequests
      if (store.getAsyncStateMap().size === 0) {
        return this.triggerGetResponsesComplete()
      }

      // Loop through all entries in the asyncStateMap and fire GetStateRequests
      for (const [key, value] of store.getAsyncStateMap().entries()) {
        console.log('[GetResponses][' + key + '][PCI Initiate]')
        // This will initiate a GetStateRequest.  Upon completion, an
        // interactionStateReady event is triggered, passing the
        // identifier of the interaction that is ready.
        value.node.getStateRequest()
      }
    },

    triggerGetResponsesComplete () {
      console.log('[GetResponses][Complete]')
      if (typeof this.getResponsesCallback === 'function') {
        this.getResponsesCallback()
      }
    },

    evaluateItemCompleted () {
      if (this.isAdaptiveItemCompleted()) {
        // Stop the item timer
        store.resetItemTimer()
        // Notify the Player that completionStatus=complete
        this.$parent.$emit('itemCompleted')
      }
    },

    isAdaptiveItemCompleted () {
      let outcomeDeclaration = store.getOutcomeDeclaration('completionStatus')
      return outcomeDeclaration.value === 'completed'
    },

    processResponses (isScoreAttempt=false) {
      console.log('[ProcessResponses][Started]')

      if (!isScoreAttempt) {
        store.incrementNumAttempts()
      }

      console.log('[ProcessResponses][IsAdaptive]', this.isAdaptive)
      if (!this.isAdaptive) {
        this.resetOutcomeDeclarations()
      }

      let responseProcessing = this.getResponseProcessing()
      if (responseProcessing !== null) {
        responseProcessing.evaluate()
      }

      if (!isScoreAttempt) {
        // For debugging purposes
        this.printOutcomeDeclarations()

        this.evaluatePrintedVariables()
        // Show feedbacks if itemSessionControl.showFeedback=true
        if (store.getItemContextSessionControl().getShowFeedback()) {
          this.evaluateFeedbacks()
        }
      }

      console.log('[ProcessResponses][Completed]')
    },

    /**
     * @description Evaluates an attempt's validity; i.e., do all interactions have a
     * valid response? Side effect: build a list of validationMessages for any
     * interactions that are invalid.
     * @param validateResponses boolean true if we are to validate.  false if no validation.
     * @return boolean (true if attempt is valid, false if it is not)
     */
    evaluateAttemptValidity (validateResponses) {
      // If we don't have to validate the responses, the attempt is valid.
      if (!validateResponses) return true
      store.resetItemContextValidationMessages()

      // Evaluate each interaction's response for validity.
      return this.evaluateInteractionResponseValidity(store.getInteractions())
    },

    evaluateInteractionResponseValidity (interactions) {
      let isAttemptValid = true
      interactions.forEach((interaction) => {
        if (!interaction.isValidResponse) {
          // Save interaction's validation message
          store.addItemContextValidationMessage({
              identifier: interaction.identifier,
              message: interaction.invalidResponseMessage
            })

          // mark attempt invalid
          isAttemptValid = false
        }
      })
      return isAttemptValid
    },

    /**
     * @description Utility method to call the CatalogFactory's bindAll
     * method.  This effectively clears out all current Catalog bindings
     * and rebinds any catalog-idref's with current PNP settings.
     */
    bindCatalog () {
      if (this.catalogFactory !== null) this.catalogFactory.bindAll()
    },

    /**
     * @description Set an element's lang attribute.
     * @param element DOM element to be set
     * @param lang {String} language
     */
    setLang (element, lang) {
      if (lang === null) return
      element.setAttribute('lang', lang)
    },

    /**
     * @description Transform some qti-assessment-item attributes.
     * Important: Run this at create time.  Mount is too late.
     */
    coerceItemAttributes () {
      this.isTimeDependent = (typeof this.timeDependent === 'undefined' ? false : this.timeDependent === 'true')
      this.isAdaptive = (typeof this.adaptive === 'undefined' ? false : this.adaptive === 'true')
      this.lang = qtiAttributeValidation.parseXmlLangAttribute(this.$props['xml:lang'])

      // For now, return 'en' if nothing found. Sorry world.
      this.locale = (this.lang === null ? 'en' : this.lang)
    },

    /**
     * @description Utility method to display outcome variables
     */
    printOutcomeDeclarations () {
      store.getOutcomeDeclarations().forEach((od) => {
        // Print all outcome variables when item is adaptive.
        if (this.isAdaptive) {
          console.log('[ProcessResponses][Outcomes][' + od.identifier + '][Value]', od.value)
        } else {
          // Not adaptive, print all except completionStatus
          if (od.identifier !== 'completionStatus') {
            console.log('[ProcessResponses][Outcomes][' + od.identifier + '][Value]', od.value)
          }
        }
      })
    }

  },

  /**
   * @description This traps all JS errors that may occur in this component.
   */
  errorCaptured (err, vm) {
    console.log('[' + err.name + '][' + vm.$options.name + '] ' + err.message)
    return false
  },

  created () {
    this.coerceItemAttributes()
  },

  mounted () {
    this.setLang(this.$refs.item, this.lang)

    // After everything is mounted, bind Catalog to the DOM
    this.catalogFactory = new CatalogFactory(this, store)
    this.bindCatalog()

    // Notify our container that we are loaded.
    this.$parent.$emit('itemReady', {
      item: this
    })
  },

  beforeDestroy () {
    // Unbind all Catalogs to avoid memory leaks
    this.catalogFactory.resetAll()
  }
}
</script>

<style>

/* ========================================
   QTI 3 shared css
   1.  Display
   2.  Special Flex styles
   3.  Float Styles
   4.  Margin
   5.  Padding
   6.  Height
   7.  Width
   8.  Text-Indent
   9.  List Styles
   10. Layout
   11. Vertical Writing Utitlities
   12. QtiAssessmentItem component utilities
   ======================================== */

/* ==========
  Display css
  =========== */
.qti-display-inline {
  display: inline;
}

.qti-display-inline-block {
  display: inline-block;
}

.qti-display-block {
  display: block;
}

.qti-display-flex {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
}

.qti-display-inline-flex {
  display: -webkit-inline-box;
  display: -ms-inline-flexbox;
  display: inline-flex;
}

.qti-display-grid {
  display: grid;
}

.qti-display-inline-grid {
  display: inline-grid;
}

.qti-display-table {
  display: table;
}

.qti-display-table-cell {
  display: table-cell;
}

.qti-display-table-row {
  display: table-row;
}

.qti-display-list-item {
  display: list-item;
}

.qti-display-inherit {
  display: inherit;
}

.qti-hidden,
.qti-display-none {
  display: none;
}

.qti-visually-hidden {
  position: fixed !important;
  overflow: hidden;
  clip: rect(1px 1px 1px 1px);
  height: 1px;
  width: 1px;
  border: 0;
  margin: -1px;
}

/* =============================
   Special flex styles
   ============================= */
.qti-flex-direction-column {
  flex-direction: column;
}

.qti-flex-direction-row {
  flex-direction: row;
}

.qti-flex-grow-1 {
  flex-grow: 1;
}

.qti-flex-grow-0 {
  flex-grow: 0;
}

/* ============
   Float styles
   ============ */
.qti-float-left {
  float: left;
}

.qti-float-right {
  float: right;
}

.qti-float-none {
  float: none;
}

/* Clearfix Hack to apply to a container of 
   floated content that overflows the container.*/
.qti-float-clearfix::after {
  content: "";
  clear: both;
  display: table;
}

/* =========
  Margin css
  ========== */

/**
 * For margin Top and Bottom and Left and Right
 */
.qti-margin-0 {
  margin: 0 !important;
}
.qti-margin-1 {
  margin: 0.25rem !important;
}
.qti-margin-2 {
  margin: 0.5rem !important;
}
.qti-margin-3 {
  margin: 1rem !important;
}
.qti-margin-4 {
  margin: 1.5rem !important;
}
.qti-margin-5 {
  margin: 3rem !important;
}
.qti-margin-auto {
  margin: auto !important;
}

/**
 * For margin Left and Right
 */
.qti-margin-x-0 {
  margin-right: 0 !important;
  margin-left: 0 !important;
}
.qti-margin-x-1 {
  margin-right: 0.25rem !important;
  margin-left: 0.25rem !important;
}
.qti-margin-x-2 {
  margin-right: 0.5rem !important;
  margin-left: 0.5rem !important;
}
.qti-margin-x-3 {
  margin-right: 1rem !important;
  margin-left: 1rem !important;
}
.qti-margin-x-4 {
  margin-right: 1.5rem !important;
  margin-left: 1.5rem !important;
}
.qti-margin-x-5 {
  margin-right: 3rem !important;
  margin-left: 3rem !important;
}
.qti-margin-x-auto {
  margin-right: auto !important;
  margin-left: auto !important;
}

/**
 * For margin Top and Bottom
 */
.qti-margin-y-0 {
  margin-top: 0 !important;
  margin-bottom: 0 !important;
}
.qti-margin-y-1 {
  margin-top: 0.25rem !important;
  margin-bottom: 0.25rem !important;
}
.qti-margin-y-2 {
  margin-top: 0.5rem !important;
  margin-bottom: 0.5rem !important;
}
.qti-margin-y-3 {
  margin-top: 1rem !important;
  margin-bottom: 1rem !important;
}
.qti-margin-y-4 {
  margin-top: 1.5rem !important;
  margin-bottom: 1.5rem !important;
}
.qti-margin-y-5 {
  margin-top: 3rem !important;
  margin-bottom: 3rem !important;
}
.qti-margin-y-auto {
  margin-top: auto !important;
  margin-bottom: auto !important;
}

/**
 * For margin Top
 */
.qti-margin-t-0 {
  margin-top: 0 !important;
}
.qti-margin-t-1 {
  margin-top: 0.25rem !important;
}
.qti-margin-t-2 {
  margin-top: 0.5rem !important;
}
.qti-margin-t-3 {
  margin-top: 1rem !important;
}
.qti-margin-t-4 {
  margin-top: 1.5rem !important;
}
.qti-margin-t-5 {
  margin-top: 3rem !important;
}
.qti-margin-t-auto {
  margin-top: auto !important;
}

/**
 * For margin Bottom
 */
.qti-margin-b-0 {
  margin-bottom: 0 !important;
}
.qti-margin-b-1 {
  margin-bottom: 0.25rem !important;
}
.qti-margin-b-2 {
  margin-bottom: 0.5rem !important;
}
.qti-margin-b-3 {
  margin-bottom: 1rem !important;
}
.qti-margin-b-4 {
  margin-bottom: 1.5rem !important;
}
.qti-margin-b-5 {
  margin-bottom: 3rem !important;
}
.qti-margin-b-auto {
  margin-bottom: auto !important;
}

/**
 * For margin Start LTR
 */
.qti-margin-s-0 {
  margin-left: 0 !important;
}
.qti-margin-s-1 {
  margin-left: 0.25rem !important;
}
.qti-margin-s-2 {
  margin-left: 0.5rem !important;
}
.qti-margin-s-3 {
  margin-left: 1rem !important;
}
.qti-margin-s-4 {
  margin-left: 1.5rem !important;
}
.qti-margin-s-5 {
  margin-left: 3rem !important;
}
.qti-margin-s-auto {
  margin-left: auto !important;
}

/**
 * For margin End LTR
 */
.qti-margin-e-0 {
  margin-right: 0 !important;
}
.qti-margin-e-1 {
  margin-right: 0.25rem !important;
}
.qti-margin-e-2 {
  margin-right: 0.5rem !important;
}
.qti-margin-e-3 {
  margin-right: 1rem !important;
}
.qti-margin-e-4 {
  margin-right: 1.5rem !important;
}
.qti-margin-e-5 {
  margin-right: 3rem !important;
}
.qti-margin-e-auto {
  margin-right: auto !important;
}

/* =========
  Padding css
  ========== */

/**
 * For padding Top and Bottom and Left and Right
 */
.qti-padding-0 {
  padding: 0 !important;
}
.qti-padding-1 {
  padding: 0.25rem !important;
}
.qti-padding-2 {
  padding: 0.5rem !important;
}
.qti-padding-3 {
  padding: 1rem !important;
}
.qti-padding-4 {
  padding: 1.5rem !important;
}
.qti-padding-5 {
  padding: 3rem !important;
}

/**
 * For padding Left and Right
 */
.qti-padding-x-0 {
  padding-right: 0 !important;
  padding-left: 0 !important;
}
.qti-padding-x-1 {
  padding-right: 0.25rem !important;
  padding-left: 0.25rem !important;
}
.qti-padding-x-2 {
  padding-right: 0.5rem !important;
  padding-left: 0.5rem !important;
}
.qti-padding-x-3 {
  padding-right: 1rem !important;
  padding-left: 1rem !important;
}
.qti-padding-x-4 {
  padding-right: 1.5rem !important;
  padding-left: 1.5rem !important;
}
.qti-padding-x-5 {
  padding-right: 3rem !important;
  padding-left: 3rem !important;
}

/**
 * For padding Top and Bottom
 */
.qti-padding-y-0 {
  padding-top: 0 !important;
  padding-bottom: 0 !important;
}
.qti-padding-y-1 {
  padding-top: 0.25rem !important;
  padding-bottom: 0.25rem !important;
}
.qti-padding-y-2 {
  padding-top: 0.5rem !important;
  padding-bottom: 0.5rem !important;
}
.qti-padding-y-3 {
  padding-top: 1rem !important;
  padding-bottom: 1rem !important;
}
.qti-padding-y-4 {
  padding-top: 1.5rem !important;
  padding-bottom: 1.5rem !important;
}
.qti-padding-y-5 {
  padding-top: 3rem !important;
  padding-bottom: 3rem !important;
}

/**
 * For padding Top
 */
.qti-padding-t-0 {
  padding-top: 0 !important;
}
.qti-padding-t-1 {
  padding-top: 0.25rem !important;
}
.qti-padding-t-2 {
  padding-top: 0.5rem !important;
}
.qti-padding-t-3 {
  padding-top: 1rem !important;
}
.qti-padding-t-4 {
  padding-top: 1.5rem !important;
}
.qti-padding-t-5 {
  padding-top: 3rem !important;
}

/**
 * For padding Bottom
 */
.qti-padding-b-0 {
  padding-bottom: 0 !important;
}
.qti-padding-b-1 {
  padding-bottom: 0.25rem !important;
}
.qti-padding-b-2 {
  padding-bottom: 0.5rem !important;
}
.qti-padding-b-3 {
  padding-bottom: 1rem !important;
}
.qti-padding-b-4 {
  padding-bottom: 1.5rem !important;
}
.qti-padding-b-5 {
  padding-bottom: 3rem !important;
}

/**
 * For padding Start LTR
 */
.qti-padding-s-0 {
  padding-left: 0 !important;
}
.qti-padding-s-1 {
  padding-left: 0.25rem !important;
}
.qti-padding-s-2 {
  padding-left: 0.5rem !important;
}
.qti-padding-s-3 {
  padding-left: 1rem !important;
}
.qti-padding-s-4 {
  padding-left: 1.5rem !important;
}
.qti-padding-s-5 {
  padding-left: 3rem !important;
}

/**
 * For padding End LTR
 */
.qti-padding-e-0 {
  padding-right: 0 !important;
}
.qti-padding-e-1 {
  padding-right: 0.25rem !important;
}
.qti-padding-e-2 {
  padding-right: 0.5rem !important;
}
.qti-padding-e-3 {
  padding-right: 1rem !important;
}
.qti-padding-e-4 {
  padding-right: 1.5rem !important;
}
.qti-padding-e-5 {
  padding-right: 3rem !important;
}

/* ====================
   Horizontal alignment
   ==================== */
.qti-align-left {
  text-align: left;
}

.qti-align-center {
  text-align: center;
}

.qti-align-right {
  text-align: right;
}

/* ==================
   Vertical alignment
   ================== */
.qti-valign-top {
  vertical-align: top;
}

.qti-valign-middle {
  vertical-align: middle;
}

.qti-valign-baseline {
  vertical-align: baseline;
}

.qti-valign-bottom {
  vertical-align: bottom;
}

/* =====================
   Other QTI 3 Utilities
   ===================== */
.qti-bordered {
  border: 1px solid var(--table-border-color);
}

.qti-underline {
  text-decoration: underline;
  text-decoration-color: var(--foreground);
}

.qti-italic {
  font-style: italic;
}

.qti-well {
  min-height:20px;
  padding:19px;
  margin-bottom:20px;
  background-color: var(--well-bg);
  border: var(--well-border);
  border-radius:4px;box-shadow: var(--well-box-shadow);
}

/* =============
   Height styles
   ============= */
.qti-height-0 { height: 0px; }
.qti-height-px { height: 1px; }
.qti-height-0p5 { height: 0.125rem; }
.qti-height-1 { height: 0.25rem; }
.qti-height-1p5 { height: 0.375rem; }
.qti-height-2 { height: 0.5rem; }
.qti-height-2p5 { height: 0.625rem; }
.qti-height-3 { height: 0.75rem; }
.qti-height-3p5 { height: 0.875rem; }
.qti-height-4 { height: 1rem; }
.qti-height-5 { height: 1.25rem; }
.qti-height-6 { height: 1.5rem; }
.qti-height-7 { height: 1.75rem; }
.qti-height-8 { height: 2rem; }
.qti-height-9 { height: 2.25rem; }
.qti-height-10 { height: 2.5rem; }
.qti-height-11 {height: 2.75rem; }
.qti-height-12 { height: 3rem; }
.qti-height-14 { height: 3.5rem; }
.qti-height-16 { height: 4rem; }
.qti-height-20 { height: 5rem; }
.qti-height-24 { height: 6rem; }
.qti-height-28 { height: 7rem; }
.qti-height-32 { height: 8rem; }
.qti-height-36 { height: 9rem; }
.qti-height-40 { height: 10rem; }
.qti-height-44 {height: 11rem; }
.qti-height-48 { height: 12rem; }
.qti-height-52 { height: 13rem; }
.qti-height-56 { height: 14rem; }
.qti-height-60 { height: 15rem; }
.qti-height-64 { height: 16rem; }
.qti-height-72 { height: 18rem; }
.qti-height-80 { height: 20rem; }
.qti-height-96 { height: 24rem; }
.qti-height-112 { height: 28rem; }
.qti-height-1-2 { height: 50%; }
.qti-height-1-3 { height: 33.333333%; }
.qti-height-2-3 { height: 66.666667%; }
.qti-height-1-4 { height: 25%; }
.qti-height-2-4 { height: 50%; }
.qti-height-3-4 { height: 75%; }
.qti-height-1-5 { height: 20%; }
.qti-height-2-5 { height: 40%; }
.qti-height-3-5 { height: 60%; }
.qti-height-4-5 { height: 80%; }
.qti-height-1-6 { height: 16.666667%; }
.qti-height-2-6 { height: 33.333333%; }
.qti-height-3-6 { height: 50%; }
.qti-height-4-6 { height: 66.666667%; }
.qti-height-5-6 { height: 83.333333%; }
.qti-height-auto { height: auto; }
.qti-height-full { height: 100%; }

/* ============
   Width styles
   ============ */
.qti-width-0	{ width: 0px; }
.qti-width-px { width: 1px; }
.qti-width-0p5 { width: 0.125rem; }
.qti-width-1	{ width: 0.25rem; }
.qti-width-1p5 { width: 0.375rem; }
.qti-width-2	{ width: 0.5rem; }
.qti-width-2p5 { width: 0.625rem; }
.qti-width-3	{ width: 0.75rem; }
.qti-width-3p5 { width: 0.875rem; }
.qti-width-4	{ width: 1rem; }
.qti-width-5	{ width: 1.25rem; }
.qti-width-6	{width: 1.5rem; }
.qti-width-7	{ width: 1.75rem; }
.qti-width-8	{ width: 2rem; }
.qti-width-9	{ width: 2.25rem; }
.qti-width-10 { width: 2.5rem; }
.qti-width-11 { width: 2.75rem; }
.qti-width-12 { width: 3rem; }
.qti-width-14 { width: 3.5rem; }
.qti-width-16 { width: 4rem; }
.qti-width-20 { width: 5rem; }
.qti-width-24 { width: 6rem; }
.qti-width-28 { width: 7rem; }
.qti-width-32 { width: 8rem; }
.qti-width-36 { width: 9rem; }
.qti-width-40 { width: 10rem; }
.qti-width-44 { width: 11rem; }
.qti-width-48 { width: 12rem; }
.qti-width-52 { width: 13rem; }
.qti-width-56 { width: 14rem; }
.qti-width-60 { width: 15rem; }
.qti-width-64 { width: 16rem; }
.qti-width-72 { width: 18rem; }
.qti-width-80 { width: 20rem; }
.qti-width-96 { width: 24rem; }
.qti-width-auto { width: auto; }
.qti-width-1-2 { width: 50%; }
.qti-width-1-3 { width: 33.333333%; }
.qti-width-2-3 { width: 66.666667%; }
.qti-width-1-4 { width: 25%; }
.qti-width-2-4 { width: 50%; }
.qti-width-3-4 { width: 75%; }
.qti-width-1-5 { width: 20%; }
.qti-width-2-5 { width: 40%; }
.qti-width-3-5 { width: 60%; }
.qti-width-4-5 { width: 80%; }
.qti-width-1-6 { width: 16.666667%; }
.qti-width-2-6 { width: 33.333333%; }
.qti-width-3-6 { width: 50%; }
.qti-width-4-6 { width: 66.666667%; }
.qti-width-5-6 { width: 83.333333%; }
.qti-width-1-12 { width: 8.333333%; }
.qti-width-2-12 { width: 16.666667%; }
.qti-width-3-12 { width: 25%; }
.qti-width-4-12 { width: 33.333333%; }
.qti-width-5-12 { width: 41.666667%; }
.qti-width-6-12 { width: 50%; }
.qti-width-7-12 { width: 58.333333%; }
.qti-width-8-12 { width: 66.666667%; }
.qti-width-9-12 { width: 75%; }
.qti-width-10-12	{ width: 83.333333%; }
.qti-width-11-12 { width: 91.666667%; }
.qti-width-full, .qti-fullwidth { width: 100%; }

/* ==================
   Text Indent styles
   ================== */
.qti-text-indent-0 {
  text-indent: 0px;
}

.qti-text-indent-px {
  text-indent: 1px;
}

.qti-text-indent-0p5 {
  text-indent: 0.125rem;
}

.qti-text-indent-1 {
  text-indent: 0.25rem;
}

.qti-text-indent-1p5 {
  text-indent: 0.375rem;
}

.qti-text-indent-2 {
  text-indent: 0.5rem;
}

.qti-text-indent-2p5 {
  text-indent: 0.625rem;
}

.qti-text-indent-3 {
  text-indent: 0.75rem;
}

.qti-text-indent-3p5 {
  text-indent: 0.875rem;
}

.qti-text-indent-4 {
  text-indent: 1rem;
}

.qti-text-indent-5 {
  text-indent: 1.25rem;
}

.qti-text-indent-6 {
  text-indent: 1.5rem;
}

.qti-text-indent-7 {
  text-indent: 1.75rem;
}

.qti-text-indent-8 {
  text-indent: 2rem;
}

.qti-text-indent-12 {
  text-indent: 3rem;
}

.qti-text-indent-16 {
  text-indent: 4rem;
}

.qti-text-indent-20 {
  text-indent: 5rem;
}

.qti-text-indent-24 {
  text-indent: 6rem;
}

.qti-text-indent-28 {
  text-indent: 7rem;
}

.qti-text-indent-32 {
  text-indent: 8rem;
}

/* =================
   List Style styles
   ================= */
.qti-list-style-type-none {
  list-style-type: none;
}

.qti-list-style-type-disc {
  list-style-type: disc;
}

.qti-list-style-type-circle {
  list-style-type: circle;
}

.qti-list-style-type-square {
  list-style-type: square;
}

.qti-list-style-type-decimal {
  list-style-type: decimal;
}

.qti-list-style-type-decimal-leading-zero {
  list-style-type: decimal-leading-zero;
}

.qti-list-style-type-lower-alpha {
  list-style-type: lower-alpha;
}

.qti-list-style-type-upper-alpha {
  list-style-type: upper-alpha;
}

.qti-list-style-type-lower-roman {
  list-style-type: lower-roman;
}

.qti-list-style-type-upper-roman {
  list-style-type: upper-roman;
}

.qti-list-style-type-lower-latin {
  list-style-type: lower-latin;
}

.qti-list-style-type-upper-latin {
  list-style-type: upper-latin;
}

.qti-list-style-type-lower-greek {
  list-style-type: lower-greek;
}

.qti-list-style-type-arabic-indic {
  list-style-type: arabic-indic;
}

.qti-list-style-type-armenian {
  list-style-type: armenian;
}

.qti-list-style-type-lower-armenian {
  list-style-type: lower-armenian;
}

.qti-list-style-type-upper-armenian {
  list-style-type: upper-armenian;
}

.qti-list-style-type-bengali {
  list-style-type: bengali;
}

.qti-list-style-type-cambodian {
  list-style-type: cambodian;
}

.qti-list-style-type-simp-chinese-formal {
  list-style-type: simp-chinese-formal;
}

.qti-list-style-type-simp-chinese-informal {
  list-style-type: simp-chinese-informal;
}

.qti-list-style-type-trad-chinese-formal {
  list-style-type: trad-chinese-formal;
}

.qti-list-style-type-trad-chinese-informal {
  list-style-type: trad-chinese-informal;
}

.qti-list-style-type-cjk-ideographic {
  list-style-type: cjk-ideographic;
}

.qti-list-style-type-cjk-heavenly-stem {
  list-style-type: cjk-heavenly-stem;
}

.qti-list-style-type-cjk-earthly-branch {
  list-style-type: cjk-earthly-branch;
}

.qti-list-style-type-devanagari {
  list-style-type: devanagari;
}

.qti-list-style-type-ethiopic-halehame-ti-er {
  list-style-type: ethiopic-halehame-ti-er;
}

.qti-list-style-type-ethiopic-halehame-ti-et {
  list-style-type: ethiopic-halehame-ti-et;
}

.qti-list-style-type-ethiopic-halehame-am {
  list-style-type: ethiopic-halehame-am;
}

.qti-list-style-type-ethiopic-halehame {
  list-style-type: ethiopic-halehame;
}

.qti-list-style-type-georgian {
  list-style-type: georgian;
}

.qti-list-style-type-gujarati {
  list-style-type: gujarati;
}

.qti-list-style-type-gurmukhi {
  list-style-type: gurmukhi;
}

.qti-list-style-type-hangul {
  list-style-type: hangul;
}

.qti-list-style-type-hangul-consonant {
  list-style-type: hangul-consonant;
}

.qti-list-style-type-hebrew {
  list-style-type: hebrew;
}

.qti-list-style-type-hiragana {
  list-style-type: hiragana;
}

.qti-list-style-type-hiragana-iroha {
  list-style-type: hiragana-iroha;
}

.qti-list-style-type-khmer {
  list-style-type: khmer;
}

.qti-list-style-type-korean-hangul-formal {
  list-style-type: korean-hangul-formal;
}

.qti-list-style-type-korean-hanja-formal {
  list-style-type: korean-hanja-formal;
}

.qti-list-style-type-korean-hanja-informal {
  list-style-type: korean-hanja-informal;
}

.qti-list-style-type-lao {
  list-style-type: lao;
}

.qti-list-style-type-malayalam {
  list-style-type: malayalam;
}

.qti-list-style-type-mongolian {
  list-style-type: mongolian;
}

.qti-list-style-type-myanmar {
  list-style-type: myanmar;
}

.qti-list-style-type-oriya {
  list-style-type: oriya;
}

.qti-list-style-type-persian {
  list-style-type: persian;
}

.qti-list-style-type-thai {
  list-style-type: thai;
}

.qti-list-style-type-tibetan {
  list-style-type: tibetan;
}

.qti-list-style-type-telugu {
  list-style-type: telugu;
}

.qti-list-style-type-urdu {
  list-style-type: urdu;
}

/* ========================================================================================
   ======================= Begin Layout Row and Column Definitions ========================
   ======================================================================================== */

/* ===========================
   Base layout row definitions
   =========================== */

.qti3-player-container .qti-layout-row {
  margin-left: 0;
  width: 100%;
  *zoom: 1;
}

.qti3-player-container-fluid .qti-layout-row {
  width: 100%;
  *zoom: 1;
}

.qti-layout-row:before,
.qti-layout-row:after {
  display: table;
  content: "";
  line-height: 0;
}

.qti-layout-row:after {
  clear: both;
}

/* =============================
   Base qti-layout-col css
   ============================= */
.qti-layout-row [class*="qti-layout-col"] {
  display: block;
  width: 100%;
  min-height:30px;
  -webkit-box-sizing: border-box;
     -moz-box-sizing: border-box;
          box-sizing: border-box;
  float: left;
  margin-left: 2.127659574468085%;
  *margin-left: 2.074468085106383%;
}

.qti-layout-row [class*="qti-layout-col"]:first-child {
  margin-left: 0;
}

.qti-layout-row .qti-layout-col12 {
  width: 100%;
  *width: 99.94680851063829%;
}

.qti-layout-row .qti-layout-col11 {
  width: 91.48936170212765%;
  *width: 91.43617021276594%;
}

.qti-layout-row .qti-layout-col10 {
  width: 82.97872340425532%;
  *width: 82.92553191489361%;
}

.qti-layout-row .qti-layout-col9  {
  width: 74.46808510638297%;
  *width: 74.41489361702126%;
}

.qti-layout-row .qti-layout-col8  {
  width:65.95744680851064%;
  *width:65.90425531914893%;
}

.qti-layout-row .qti-layout-col7  {
  width: 57.44680851063829%;
  *width: 57.39361702127659%;
}

.qti-layout-row .qti-layout-col6  {
  width: 48.93617021276595%;
  *width: 48.88297872340425%;
}

.qti-layout-row .qti-layout-col5  {
  width: 40.42553191489362%;
  *width: 40.37234042553192%;
}

.qti-layout-row .qti-layout-col4  {
  width: 31.914893617021278%;
  *width: 31.861702127659576%;
}

.qti-layout-row .qti-layout-col3  {
  width: 23.404255319148934%;
  *width: 23.351063829787233%;
}

.qti-layout-row .qti-layout-col2  {
  width: 14.893617021276595%;
  *width:14.840425531914894%;
}

.qti-layout-row .qti-layout-col1  {
  width: 6.382978723404255%;
  *width: 6.329787234042553%;
}

.qti-layout-row .qti-layout-offset11 {
  margin-left: 95.74468085106382%;
  *margin-left: 95.6382978723404%;
}

.qti-layout-row .qti-layout-offset11:first-child {
  margin-left: 93.61702127659574%;
  *margin-left: 93.51063829787232%;
}

.qti-layout-row .qti-layout-offset10 {
  margin-left: 87.23404255319149%;
  *margin-left: 87.12765957446807%;
}

.qti-layout-row .qti-layout-offset10:first-child {
  margin-left: 85.1063829787234%;
  *margin-left: 84.99999999999999%;
}

.qti-layout-row .qti-layout-offset9  {
  margin-left: 78.72340425531914%;
  *margin-left: 78.61702127659572%;
}

.qti-layout-row .qti-layout-offset9:first-child  {
  margin-left: 76.59574468085106%;
  *margin-left: 76.48936170212764%;
}

.qti-layout-row .qti-layout-offset8  {
  margin-left: 70.2127659574468%;
  *margin-left: 70.10638297872339%;
}

.qti-layout-row .qti-layout-offset8:first-child  {
  margin-left: 68.08510638297872%;
  *margin-left: 67.9787234042553%;
}

.qti-layout-row .qti-layout-offset7  {
  margin-left: 61.70212765957446%;
  *margin-left: 61.59574468085106%;
}

.qti-layout-row .qti-layout-offset7:first-child {
  margin-left: 59.574468085106375%;
  *margin-left: 59.46808510638297%;
}

.qti-layout-row .qti-layout-offset6  {
  margin-left: 53.191489361702125%;
  *margin-left: 53.085106382978715%;
}

.qti-layout-row .qti-layout-offset6:first-child  {
  margin-left: 51.063829787234035%;
  *margin-left: 50.95744680851063%;
}

.qti-layout-row .qti-layout-offset5  {
  margin-left: 44.68085106382979%;
  *margin-left: 44.57446808510638%;
}

.qti-layout-row .qti-layout-offset5:first-child  {
  margin-left: 42.5531914893617%;
  *margin-left: 42.4468085106383%;
}

.qti-layout-row .qti-layout-offset4  {
  margin-left: 36.170212765957444%;
  *margin-left: 36.06382978723405%;
}

.qti-layout-row .qti-layout-offset4:first-child  {
  margin-left: 34.04255319148936%;
  *margin-left: 33.93617021276596%;
}

.qti-layout-row .qti-layout-offset3  {
  margin-left: 27.659574468085104%;
  *margin-left: 27.5531914893617%;
}

.qti-layout-row .qti-layout-offset3:first-child  {
  margin-left: 25.53191489361702%;
  *margin-left: 25.425531914893618%;
}

.qti-layout-row .qti-layout-offset2  {
  margin-left: 19.148936170212764%;
  *margin-left: 19.04255319148936%;
}

.qti-layout-row .qti-layout-offset2:first-child  {
  margin-left: 17.02127659574468%;
  *margin-left: 16.914893617021278%;
}

.qti-layout-row .qti-layout-offset1  {
  margin-left: 10.638297872340425%;
  *margin-left: 10.53191489361702%;
}

.qti-layout-row .qti-layout-offset1:first-child  {
  margin-left: 8.51063829787234%;
  *margin-left: 8.404255319148938%;
}

/* ============================================
   Overrides for narrower than iPad in portrait
   ============================================ */
@media (max-width:767px) {

  .qti3-player-container-fluid {
    padding: 0;
  }

  .qti3-player-container-fluid .qti-layout-row {
    width: 100%;
  }

  .qti-layout-row {
    margin-left:0;
  }

  [class*="qti-layout-col"] {
    float: none;
    display: block;
    width: 100%;
    margin-left: 0;
    -webkit-box-sizing: border-box;
       -moz-box-sizing: border-box;
            box-sizing: border-box;
  }

  .qti-layout-col12,
  .qti3-player-container-fluid .qti-layout-row .qti-layout-col12 {
    width: 100%;
    -webkit-box-sizing: border-box;
       -moz-box-sizing: border-box;
            box-sizing: border-box;
  }

  .qti3-player-container-fluid .qti-layout-row [class*="offset"]:first-child {
    margin-left: 0;
  }
}

/* ====================================================
   Overrides for between iPad in portrait and landscape
   ==================================================== */
@media (min-width:768px) and (max-width:979px) {

  .qti3-player-container .qti-layout-row {
    margin-left: 0;
    width: 100%;
    *zoom: 1;
  }

  .qti3-player-container-fluid .qti-layout-row {
    width: 100%;
    *zoom: 1;
  }

  .qti-layout-row:before,
  .qti-layout-row:after {
    display: table;
    content: "";
    line-height: 0;
  }

  .qti-layout-row:after {
    clear: both;
  }

  .qti-layout-row [class*="qti-layout-col"] {
    display: block;
    width: 100%;
    min-height: 30px;
    -webkit-box-sizing: border-box;
       -moz-box-sizing: border-box;
            box-sizing: border-box;
    float: left;
    margin-left: 2.7624309392265194%;
    *margin-left: 2.709239449864817%;
  }

  .qti-layout-row [class*="qti-layout-col"]:first-child {
    margin-left: 0;
  }

  .qti-layout-row .qti-layout-col12 {
    width: 100%;
    *width: 99.94680851063829%;
  }

  .qti-layout-row .qti-layout-col11 {
    width: 91.43646408839778%;
    *width: 91.38327259903608%;
  }

  .qti-layout-row .qti-layout-col10 {
    width: 82.87292817679558%;
    *width: 82.81973668743387%;
  }

  .qti-layout-row .qti-layout-col9 {
    width: 74.30939226519337%;
    *width: 74.25620077583166%;
  }

  .qti-layout-row .qti-layout-col8 {
    width: 65.74585635359117%;
    *width: 65.69266486422946%;
  }

  .qti-layout-row .qti-layout-col7 {
    width: 57.18232044198895%;
    *width: 57.12912895262725%;
  }

  .qti-layout-row .qti-layout-col6 {
    width: 48.61878453038674%;
    *width: 48.56559304102504%;
  }

  .qti-layout-row .qti-layout-col5 {
    width: 40.05524861878453%;
    *width: 40.00205712942283%;
  }

  .qti-layout-row .qti-layout-col4 {
    width: 31.491712707182323%;
    *width: 31.43852121782062%;
  }

  .qti-layout-row .qti-layout-col3 {
    width: 22.92817679558011%;
    *width: 22.87498530621841%;
  }

  .qti-layout-row .qti-layout-col2 {
    width: 14.3646408839779%;
    *width: 14.311449394616199%;
  }

  .qti-layout-row .qti-layout-col1 {
    width: 5.801104972375691%;
    *width: 5.747913483013988%;
  }

  .qti-layout-row .qti-layout-offset11 {
    margin-left: 96.96132596685082%;
    *margin-left: 96.8549429881274%;
  }

  .qti-layout-row .qti-layout-offset11:first-child {
    margin-left: 94.1988950276243%;
    *margin-left: 94.09251204890089%;
  }

  .qti-layout-row .qti-layout-offset10 {
    margin-left: 88.39779005524862%;
    *margin-left: 88.2914070765252%;
  }

  .qti-layout-row .qti-layout-offset10:first-child {
    margin-left: 85.6353591160221%;
    *margin-left: 85.52897613729868%;
  }

  .qti-layout-row .qti-layout-offset9 {
    margin-left: 79.8342541436464%;
    *margin-left: 79.72787116492299%;
  }

  .qti-layout-row .qti-layout-offset9:first-child {
    margin-left: 77.07182320441989%;
    *margin-left: 76.96544022569647%;
  }

  .qti-layout-row .qti-layout-offset8 {
    margin-left: 71.2707182320442%;
    *margin-left: 71.16433525332079%;
  }

  .qti-layout-row .qti-layout-offset8:first-child {
    margin-left: 68.50828729281768%;
    *margin-left: 68.40190431409427%;
  }

  .qti-layout-row .qti-layout-offset7 {
    margin-left: 62.70718232044199%;
    *margin-left: 62.600799341718584%;
  }

  .qti-layout-row .qti-layout-offset7:first-child {
    margin-left: 59.94475138121547%;
    *margin-left: 59.838368402492065%;
  }

  .qti-layout-row .qti-layout-offset6 {
    margin-left: 54.14364640883978%;
    *margin-left: 54.037263430116376%;
  }

  .qti-layout-row .qti-layout-offset6:first-child {
    margin-left: 51.38121546961326%;
    *margin-left: 51.27483249088986%;
  }

  .qti-layout-row .qti-layout-offset5 {
    margin-left: 45.58011049723757%;
    *margin-left: 45.47372751851417%;
  }

  .qti-layout-row .qti-layout-offset5:first-child {
    margin-left: 42.81767955801105%;
    *margin-left: 42.71129657928765%;
  }

  .qti-layout-row .qti-layout-offset4 {
    margin-left: 37.01657458563536%;
    *margin-left: 36.91019160691196%;
  }

  .qti-layout-row .qti-layout-offset4:first-child {
    margin-left: 34.25414364640884%;
    *margin-left: 34.14776066768544%;
  }

  .qti-layout-row .qti-layout-offset3 {
    margin-left: 28.45303867403315%;
    *margin-left: 28.346655695309746%;
  }

  .qti-layout-row .qti-layout-offset3:first-child {
    margin-left: 25.69060773480663%;
    *margin-left: 25.584224756083227%;
  }

  .qti-layout-row .qti-layout-offset2 {
    margin-left: 19.88950276243094%;
    *margin-left: 19.783119783707537%;
  }

  .qti-layout-row .qti-layout-offset2:first-child {
    margin-left: 17.12707182320442%;
    *margin-left: 17.02068884448102%;
  }

  .qti-layout-row .qti-layout-offset1 {
    margin-left: 11.32596685082873%;
    *margin-left: 11.219583872105325%;
  }

  .qti-layout-row .qti-layout-offset1:first-child {
    margin-left: 8.56353591160221%;
    *margin-left: 8.457152932878806%;
  }
}

/* ===========================================
   Overrides for typical desktop or chromebook
   =========================================== */
@media (min-width:1200px) {

  .qti3-player-container .qti-layout-row {
    margin-left: 0;
    width: 100%;
    *zoom: 1;
  }

  .qti3-player-container-fluid .qti-layout-row {
    width: 100%;
    *zoom: 1;
  }

  .qti-layout-row:before,
  .qti-layout-row:after {
    display: table;
    content: "";
    line-height: 0;
  }

  .qti-layout-row:after {
    clear: both;
  }

  .qti-layout-row [class*="qti-layout-col"] {
    display: block;
    width: 100%;
    min-height: 30px;
    -webkit-box-sizing: border-box;
       -moz-box-sizing: border-box;
            box-sizing: border-box;
    float: left;
    margin-left: 2.564102564102564%;
    *margin-left: 2.5109110747408616%;
  }

  .qti-layout-row [class*="qti-layout-col"]:first-child {
    margin-left: 0;
  }

  .qti-layout-row .qti-layout-col12 {
    width: 100%;
    *width: 99.94680851063829%;
  }

  .qti-layout-row .qti-layout-col11 {
    width: 91.45299145299145%;
    *width: 91.39979996362975%;
  }

  .qti-layout-row .qti-layout-col10 {
    width: 82.90598290598291%;
    *width: 82.8527914166212%;
  }

  .qti-layout-row .qti-layout-col9 {
    width: 74.35897435897436%;
    *width: 74.30578286961266%;
  }

  .qti-layout-row .qti-layout-col8 {
    width: 65.81196581196582%;
    *width: 65.75877432260411%;
  }

  .qti-layout-row .qti-layout-col7 {
    width: 57.26495726495726%;
    *width: 57.21176577559556%;
  }

  .qti-layout-row .qti-layout-col6 {
    width: 48.717948717948715%;
    *width: 48.664757228587014%;
  }

  .qti-layout-row .qti-layout-col5 {
    width: 40.17094017094017%;
    *width: 40.11774868157847%;
  }

  .qti-layout-row .qti-layout-col4 {
    width: 31.623931623931625%;
    *width: 31.570740134569924%;
  }

  .qti-layout-row .qti-layout-col3 {
    width: 23.076923076923077%;
    *width: 23.023731587561375%;
  }

  .qti-layout-row .qti-layout-col2 {
    width: 14.52991452991453%;
    *width: 14.476723040552828%;
  }

  .qti-layout-row .qti-layout-col1 {
    width: 5.982905982905983%;
    *width: 5.929714493544281%;
  }

  .qti-layout-row .qti-layout-offset11 {
    margin-left: 96.58119658119658%;
    *margin-left: 96.47481360247316%;
  }

  .qti-layout-row .qti-layout-offset11:first-child {
    margin-left: 94.01709401709402%;
    *margin-left: 93.91071103837061%;
  }

  .qti-layout-row .qti-layout-offset10 {
    margin-left: 88.03418803418803%;
    *margin-left: 87.92780505546462%;
  }

  .qti-layout-row .qti-layout-offset10:first-child {
    margin-left: 85.47008547008548%;
    *margin-left: 85.36370249136206%;
  }

  .qti-layout-row .qti-layout-offset9 {
    margin-left: 79.48717948717949%;
    *margin-left: 79.38079650845607%;
  }

  .qti-layout-row .qti-layout-offset9:first-child {
    margin-left: 76.92307692307693%;
    *margin-left: 76.81669394435352%;
  }

  .qti-layout-row .qti-layout-offset8 {
    margin-left: 70.94017094017094%;
    *margin-left: 70.83378796144753%;
  }

  .qti-layout-row .qti-layout-offset8:first-child {
    margin-left: 68.37606837606839%;
    *margin-left: 68.26968539734497%;
  }

  .qti-layout-row .qti-layout-offset7 {
    margin-left: 62.393162393162385%;
    *margin-left: 62.28677941443899%;
  }

  .qti-layout-row .qti-layout-offset7:first-child  {
    margin-left: 59.82905982905982%;
    *margin-left: 59.72267685033642%;
  }

  .qti-layout-row .qti-layout-offset6 {
    margin-left: 53.84615384615384%;
    *margin-left: 53.739770867430444%;
  }

  .qti-layout-row .qti-layout-offset6:first-child {
    margin-left: 51.28205128205128%;
    *margin-left: 51.175668303327875%;
  }

  .qti-layout-row .qti-layout-offset5 {
    margin-left: 45.299145299145295%;
    *margin-left: 45.1927623204219%;
  }

  .qti-layout-row .qti-layout-offset5:first-child {
    margin-left: 42.73504273504273%;
    *margin-left: 42.62865975631933%;
  }

  .qti-layout-row .qti-layout-offset4 {
    margin-left: 36.75213675213675%;
    *margin-left: 36.645753773413354%;
  }

  .qti-layout-row .qti-layout-offset4:first-child {
    margin-left: 34.18803418803419%;
    *margin-left: 34.081651209310785%;
  }

  .qti-layout-row .qti-layout-offset3 {
    margin-left: 28.205128205128204%;
    *margin-left: 28.0987452264048%;
  }

  .qti-layout-row .qti-layout-offset3:first-child {
    margin-left: 25.641025641025642%;
    *margin-left: 25.53464266230224%;
  }

  .qti-layout-row .qti-layout-offset2 {
    margin-left: 19.65811965811966%;
    *margin-left: 19.551736679396257%;
  }

  .qti-layout-row .qti-layout-offset2:first-child {
    margin-left: 17.094017094017094%;
    *margin-left: 16.98763411529369%;
  }

  .qti-layout-row .qti-layout-offset1 {
    margin-left: 11.11111111111111%;
    *margin-left: 11.004728132387708%;
  }

  .qti-layout-row .qti-layout-offset1:first-child {
    margin-left: 8.547008547008547%;
    *margin-left: 8.440625568285142%;
  }
}

/* ======================
   Vertical Writing Utils
   ====================== */
.qti-writing-mode-vertical-rl {
  writing-mode: vertical-rl;
}

.qti-writing-mode-vertical-lr {
  writing-mode: vertical-lr;
}

/* Enable horizontal scrolling on overflow-x */
div.qti-writing-mode-vertical-rl,
div.qti-writing-mode-vertical-lr {
  width: 100%;
  overflow-x: auto;
}

.qti-writing-mode-horizontal-tb {
  writing-mode: horizontal-tb;
}

.qti-text-combine-upright-all {
  text-combine-upright: all;
}

.qti-text-orientation-upright {
  text-orientation: upright;
}

.qti-text-transform-fullwidth {
  text-transform: full-width;
}

/* ===========================================
   QtiAssessmentItem component utility classes
   not part of QTI 3 Best Practices
   =========================================== */

/* Overrides to improve appearance of visual header tags */
h2 {
  font-size: 1.3rem;
}

h3 {
  font-size: 1.2rem;
}

h4 {
  font-size: 1.1rem;
}

h5 {
  font-size: 1rem;
}

h2, h3, h4, h5, h6 {
  margin-top: 1rem;
  margin-bottom: 1rem;
}

p {
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: inherit;
  line-height: inherit;
}
article, aside, figcaption, figure, footer, header, hgroup, main, nav, section {
  display: block;
  font-size: inherit;
  line-height: inherit;
}

ol, ul, dl {
  margin-top: 0;
  margin-bottom: 1rem;
}

ol ol, ul ul, ol ul, ul ol {
  margin-bottom: 0;
}

dt {
  font-weight: 500;
}

dd {
  margin-bottom: .5rem;
  margin-left: 0;
}

blockquote {
   margin: 0 0 1rem;
   line-height: inherit;
}

b, strong {
  font-weight: bolder;
  font-size: inherit;
  line-height: inherit;
}

small {
  font-size: 80%;
  line-height: inherit;
}

sub, sup {
  position: relative;
  font-size: 75%;
  line-height: 0;
  vertical-align: baseline;
}

sub {
  bottom: -.25em;
}

sup {
  top: -.5em;
}

figure {
  margin: 0 0 1rem;
}

/* All images share these two properties */
img {
  vertical-align: middle;
  border-style: none;
}

/* When NOT in a GGM, permit image responsiveness */
img:not(.qti-ggm-group-wrapper *)  {
  max-width: 100%;
  height: auto;
}

svg {
  overflow: hidden;
  vertical-align: middle;
}

hr {
  -webkit-box-sizing: content-box;
  box-sizing: content-box;
  height: 0;
  overflow: visible;
  margin-top: 1rem;
  margin-bottom: 1rem;
  border: 0;
  border-top: var(--hr-border);
}

code {
  padding: 2px 4px;
  font-size: 90%;
  color: rgba(0,0,0,.87);
  background-color: #f9f2f4;
  white-space: nowrap;
  border-radius: 4px;
}

/* Hack to improve presentation of Shared CSS examples */
div.code pre {
  font-size: smaller;
  line-height: .75rem;
  overflow: unset;
}

/* Table classes */
.table {
  width: 100%;
  margin-bottom: 4px;
  color: var(--foreground);
  background-color: transparent;
  border-collapse: collapse;
}

.table th {
  font-weight: 400;
}

.table  th,
.table  td {
  padding: 4px;
  vertical-align: top;
  border-top: 1px solid;
  border-color: inherit;
}

.table-bordered {
    border: 1px solid var(--table-border-color);
}

.table-bordered thead th {
    border-bottom: 1px solid var(--table-border-color);
}

.table-bordered tbody:first-child tr:first-child th,
.table-bordered tbody:first-child tr:first-child td {
  border-top: 0;
}

.table-bordered tbody tr th,
.table-bordered tbody tr td {
  border-bottom: 0;
}

.table-bordered th,
.table-bordered td {
  border-left: 1px solid;
  border-color: inherit;
}

.qti3-player-item-card {
  display: -webkit-flex;
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

.qti3-player-item-card-body {
  flex-grow: 1 1 auto;
  overflow: auto;
  /* VERY IMPORTANT.  Setting height will result in the card body
     being scrollable.  Setting min-height avoids this.
  */
  min-height: 28em;
  width: 100%;
}

.qti3-player-item-card-body-scrollable {
  flex-grow: 1 1 auto;
  overflow: auto;
  /* VERY IMPORTANT.  Setting height will result in the card body
     being scrollable.  Setting min-height avoids this.
  */
  height: 28em;
  width: 100%;
}

.qti3-player-item-card-header {
  display: -webkit-flex;
  display: flex;
  margin-bottom: 0;
  background-color: var(--item-card-panel-bgc);
  border-bottom: 1px solid var(--item-card-panel-bc);
}

.qti3-player-item-card-footer {
  display: grid;
  margin-top: 0;
  background-color: var(--item-card-panel-bgc);
  border-top: 1px solid var(--item-card-panel-bc);
}

.qti3-player-item-card-bordered {
  border: 1px solid var(--item-card-panel-bc);
}

.qti3-player-item-card-bordered-rounded {
  border-radius: 5px;
  border: 1px solid var(--item-card-panel-bc);
}

.qti3-player-item-card-raised {
  box-shadow: 0 2px 2px 0 rgba(0,0,0,.14),0 3px 1px -2px rgba(0,0,0,.12),0 1px 5px 0 rgba(0,0,0,.2);
}

.qti3-player-item-card-raised-rounded {
  border-radius: 5px;
  box-shadow: 0 2px 2px 0 rgba(0,0,0,.14),0 3px 1px -2px rgba(0,0,0,.12),0 1px 5px 0 rgba(0,0,0,.2);
}

/* Override floats */
.qti3-player-float-right {
  float: right;
}

.qti3-player-float-left {
  float: left;
}

/* For match interaction placeholders */
.placeholder-fade {
  opacity: 0.5;
}

/* ===========================================
   QtiAssessmentItem component utility classes
   to support Chinese, Japanese, Korean and
   Mongolian text
   =========================================== */
.qti3-player-writing-mode-vertical-rl {
  writing-mode: vertical-rl;
}

.qti3-player-writing-mode-vertical-lr {
  writing-mode: vertical-lr;
}

/* Enable horizontal scrolling on overflow-x */
div.qti3-player-writing-mode-vertical-rl,
div.qti3-player-writing-mode-vertical-lr {
  width: 100%;
  overflow-x: auto;
}

.qti3-player-writing-mode-horizontal-tb {
  writing-mode: horizontal-tb;
}

.qti3-player-text-combine-upright-all {
  text-combine-upright: all;
}

.qti3-player-text-orientation-upright {
  text-orientation: upright;
}

.qti3-player-text-transform-fullwidth {
  text-transform: full-width;
}
</style>
