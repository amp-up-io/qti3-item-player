<template>
  <div class="qti-assessment-item">
    <event-listener @templateProcessingReady="handleTemplateProcessingReady" @itemBodyReady="handleItemBodyReady">
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
import EventListener from '@/shared/components/EventListener'
import QtiContextDeclaration from '@/components/qti/declarations/QtiContextDeclaration'
import QtiResponseDeclaration from '@/components/qti/declarations/QtiResponseDeclaration'
import QtiTemplateDeclaration from '@/components/qti/declarations/QtiTemplateDeclaration'
//import QtiTemplateProcessing from '@/components/qti/processing/QtiTemplateProcessing'
import QtiOutcomeDeclaration from '@/components/qti/declarations/QtiOutcomeDeclaration'
import QtiCompanionMaterialsInfo from '@/components/qti/companionmaterials/QtiCompanionMaterialsInfo'
import QtiStylesheet from '@/components/qti/general/QtiStylesheet'
import QtiItemBody from '@/components/qti/body/QtiItemBody'
import QtiResponseProcessing from '@/components/qti/processing/QtiResponseProcessing'
import QtiCatalogInfo from '@/components/qti/catalog/QtiCatalogInfo'
import QtiModalFeedback from '@/components/qti/general/QtiModalFeedback'

Vue.component('event-listener',EventListener)
Vue.component('qti-context-declaration', QtiContextDeclaration)
Vue.component('qti-response-declaration', QtiResponseDeclaration)
Vue.component('qti-template-declaration', QtiTemplateDeclaration)
//Vue.component('qti-template-processing', QtiTemplateProcessing)
Vue.component('qti-outcome-declaration', QtiOutcomeDeclaration)
Vue.component('qti-companion-materials-info', QtiCompanionMaterialsInfo)
Vue.component('qti-stylesheet', QtiStylesheet)
Vue.component('qti-item-body', QtiItemBody)
Vue.component('qti-response-processing', QtiResponseProcessing)
Vue.component('qti-catalog-info', QtiCatalogInfo)
Vue.component('qti-modal-feedback', QtiModalFeedback)

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
       * If any interactions contain invalid responses then this will be set to false.
       */
      isValidAttempt: true,
      /*
       * This is set to true if adaptive="true"
       */
      isAdaptive: false,
      /*
       * This is set to true if time-dependent="true"
       */
      isTimeDependent: false,
      /*
       * Try to parse this from xml:lang
       */
      locale: null
    }
  },

  methods: {

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

      // Now execute our template processing
      this.executeTemplateProcessing()
    },

    /**
     * @description This executes immediately upon completion
     * of a qti-item-body $mount
     * @param node - an object containing an itemBody node
     */
    handleItemBodyReady (node) {
      console.log('[QtiAssessmentItem][ItemBodyReady][Adaptive=' + this.isAdaptive + ']', node)

      // Save the itemBody node in the $store
      store.defineItemBody({
          node: node.itemBody
        })

      if (this.isAdaptive) {
        this.resetOutcomeDeclarations()
        this.evaluateFeedbacks()
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
      // 1) Reset the values of the response declarations
      this.resetResponseDeclarations()
      // 2) Reset the interactions
      this.resetInteractions()
      // 3) Reset the template declarations
      this.resetTemplateDeclarations()
      // 4) Run template processing to generate new template variables
      this.executeTemplateProcessing()
      // 5) Evaluate all printed variables
      this.evaluatePrintedVariables()
      // 6) Evaluate all template math variables
      this.evaluateTemplateMathVariables()
      // 7) Evaluate all templates
      this.evaluateTemplates()
      // 8) Reset the values of the outcome declarations
      this.resetOutcomeDeclarations()
      // 9) Evaluate all feedbacks
      this.evaluateFeedbacks()
      console.log('[QtiAssessmentItem][NewTemplate][Completed]')
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
      store.getInteractions().forEach((interaction) => {
        console.log('[ResetInteractions][' + interaction.identifier + ']', interaction)
        if (interaction.resetValue) {
          interaction.resetValue()
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

    endAttempt (stateObject) {
      console.log('[EndAttempt][Start][Identifier]', this.identifier)

      // End attempt can be invoked from several different places.  In the event
      // that this was invoked by a Show Feedback end attempt interaction, this
      // will disable various parts of the UI.
      this.updateItemBodyUI(stateObject)

      this.getResponses()

      // Evaluate response validity if item session control validateResponses=true
      this.isValidAttempt = this.evaluateAttemptValidity(store.getItemContextSessionControl().getValidateResponses())
      if (this.isValidAttempt) {
        this.processResponses()
      }

      if (this.isAdaptive) {
        this.evaluateItemCompleted()
      }
      console.log('[EndAttempt][Complete][Identifier]', this.identifier)
    },

    updateItemBodyUI (stateObject) {
      if (typeof stateObject === 'undefined') {
        return
      }
      // This was invoked by an endAttempt interaction.  If this is not a
      // mxlcontroller end attempt interaction, disable the mxlcontroller if one exists
      // in the item body.
      if (stateObject.interactionSubType !== 'mxlcontroller') {
        // Was not a mxlcontroller end attempt.
        store.getInteractions().forEach((interaction) => {
          if ((interaction.interactionType === 'EndAttemptInteraction') &&
            (interaction.interactionSubType === 'mxlcontroller')) {
            interaction.disable()
            return
          }
        })
      }
    },

    getResponses () {
      console.log('[GetResponses][Start]')
      let responseVariables = store.getResponseDeclarations()
      responseVariables.forEach((responseVariable) => {
        const interaction = store.getInteraction(responseVariable.identifier)
        if (typeof interaction !== 'undefined') {
          console.log('[GetResponses][' + responseVariable.identifier + ']:', interaction.node.getResponse())
          // Notify store of our response
          store.setResponseVariableValue({
              identifier: responseVariable.identifier,
              value: interaction.node.getResponse(),
              state: interaction.node.getState()
            })
          return
        }

        // Response variable that is not bound to an interaction.
        // Set this to a default value (if one exists) or NULL - unless the response is numAttempts or duration
        if ((responseVariable.identifier !== 'numAttempts' ) && (responseVariable.identifier !== 'duration')) {
          store.resetResponseVariableValue({
              identifier: responseVariable.identifier,
              value: responseVariable.defaultValue,
              state: null
            })
        }
      })
      console.log('[GetResponses][Complete]')
    },

    /**
     * @description Retrieve all variable declarations, storing them in an itemState class.
     * @param target - string which identifies a callback target
     * @return object with two properties: state which is an itemState class and target
     */
    getItemState (target) {
      // Update the store's responses and state of response variables
      this.getResponses()

      // Examine session control for validateResponses.
      this.evaluateAttemptValidity(store.getItemContextSessionControl().getValidateResponses())

      const state = new ItemStateFactory(
        store.getItemContextGuid(),
        this.identifier,
        store.getResponseDeclarations(),
        store.getTemplateDeclarations(),
        store.getOutcomeDeclarations(),
        store.getItemContextValidationMessages()
      )

      this.$parent.$emit('itemStateReady', {
        "state": state.getSerializedState(),
        "target": (typeof target !== 'undefined' ? target : null)
      })
    },

    evaluateItemCompleted () {
      let outcomeDeclaration = store.getOutcomeDeclaration('completionStatus')

      if (outcomeDeclaration.value === 'completed') {
        this.$parent.$emit('itemCompleted')
      }
    },

    incrementNumAttempts () {
      let numAttempts = store.getResponseDeclaration('numAttempts')
      let newNumAttemptsValue = numAttempts.value + 1
      store.setResponseVariableValue({
          identifier: 'numAttempts',
          value: newNumAttemptsValue
        })
    },

    processResponses () {
      console.log('[ProcessResponses][Started]')
      this.incrementNumAttempts()

      console.log('[ProcessResponses][IsAdaptive]', this.isAdaptive)
      if (!this.isAdaptive) {
        this.resetOutcomeDeclarations()
      }

      let responseProcessing = this.getResponseProcessing()
      if (responseProcessing !== null) {
        responseProcessing.evaluate()
      }

      // For debugging purposes
      this.printOutcomeDeclarations()

      this.evaluatePrintedVariables()
      this.evaluateFeedbacks()

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
     * @description Transform some qti-assessment-item attributes.
     * Important: Run this at create time.  Mount is too late.
     */
    coerceItemAttributes () {
      this.isTimeDependent = (typeof this.timeDependent === 'undefined' ? false : this.timeDependent === 'true')
      this.isAdaptive = (typeof this.adaptive === 'undefined' ? false : this.adaptive === 'true')
      // For now, return 'en' if nothing found. Sorry world.
      this.locale = (typeof this.$props['xml-lang'] === 'undefined' ? 'en' : this.$props['xml-lang'])
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
    // Initialize built-in declarations before we do anything else.
    store.initializeBuiltInDeclarations()
  },

  mounted () {
    // Notify our container that we are loaded.
    this.$parent.$emit('itemReady', {
      item: this
    })
  }
}
</script>

<style>

/* ================
   QTI 3 shared css
   ================*/

/* QTI 3 Display overrides */
.qti-display-inline-block {
  display: inline-block;
}

.qti-display-block {
  display: block;
}

.qti-display-flex {
  display: flex;
}

.qti-display-grid {
  display: grid;
}

.qti-hidden {
  display: none;
}

.qti-visually-hidden {
  position:fixed !important;
  overflow: hidden;
  clip: rect(1px 1px 1px 1px);
  height: 1px;
  width: 1px;
  border: 0;
  margin: -1px;
}

/* QTI 3 Horizontal alignment */
.qti-align-left {
  text-align: left;
}

.qti-align-center {
  text-align: center;
}

.qti-align-right {
  text-align: right;
}

/* QTI 3 Vertical alignment */
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

/* QTI 3 utility classes */
.qti-fullwidth {
  width: 100%;
}

.qti-bordered {
  border: 1px solid var(--table-border-color);
  padding: 2px;
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
  margin-top: 0;
  margin-bottom: 0.5rem;
}

p {
  margin-top: 0;
  margin-bottom: 1rem;
}
article, aside, figcaption, figure, footer, header, hgroup, main, nav, section {
  display: block;
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
}

b, strong {
  font-weight: bolder;
}

small {
  font-size: 80%;
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

img {
  vertical-align: middle;
  border-style: none;
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

/* Table classes */
.table {
  width: 100%;
  margin-bottom: 4px;
  color: var(--foreground);
  background-color: transparent;
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

/* ========================================================================================
   ======================= Begin Layout Row and Column Definitions ========================
   ======================================================================================== */

/* ======================================
   Base layout row and column definitions
   ====================================== */

/* Set row left-margin to -20px because every column in a row has a left-margin of 20px */
.qti-layout-row {
  margin-left: -20px;
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

/* By default, all columns are floated left with default left-margin separator of 20px */
[class*="qti-layout-col"] {
  float: left;
  min-height: 1px;
  margin-left: 20px;
}

.qti-layout-col12 { width: 940px; }
.qti-layout-col11 { width: 860px; }
.qti-layout-col10 { width: 780px; }
.qti-layout-col9  { width: 700px; }
.qti-layout-col8  { width: 620px; }
.qti-layout-col7  { width: 540px; }
.qti-layout-col6  { width: 460px; }
.qti-layout-col5  { width: 380px; }
.qti-layout-col4  { width: 300px; }
.qti-layout-col3  { width: 220px; }
.qti-layout-col2  { width: 140px; }
.qti-layout-col1  { width: 60px; }

.qti-layout-offset11 { margin-left: 900px; }
.qti-layout-offset10 { margin-left: 820px; }
.qti-layout-offset9  { margin-left: 740px; }
.qti-layout-offset8  { margin-left: 660px; }
.qti-layout-offset7  { margin-left: 580px; }
.qti-layout-offset6  { margin-left: 500px; }
.qti-layout-offset5  { margin-left: 420px; }
.qti-layout-offset4  { margin-left: 340px; }
.qti-layout-offset3  { margin-left: 260px; }
.qti-layout-offset2  { margin-left: 180px; }
.qti-layout-offset1  { margin-left: 100px; }

/* =============================
   Base FLUID qti-layout-row css
   ============================= */

.qti3-player-container-fluid .qti-layout-row {
  margin-left: 0
}

.qti3-player-container-fluid .qti-layout-row {
  width: 100%; *zoom: 1;
}

.qti3-player-container-fluid .qti-layout-row:before,
.qti3-player-container-fluid .qti-layout-row:after {
  display: table;
  content: "";
  line-height: 0;
}

.qti3-player-container-fluid .qti-layout-row:after {
  clear: both;
}

/* =============================
   Base FLUID qti-layout-col css
   ============================= */

.qti3-player-container-fluid .qti-layout-row [class*="qti-layout-col"] {
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

.qti3-player-container-fluid .qti-layout-row [class*="qti-layout-col"]:first-child {
  margin-left: 0;
}

.qti3-player-container-fluid .qti-layout-row .qti-layout-col12 {
  width: 100%;
  *width: 99.94680851063829%;
}

.qti3-player-container-fluid .qti-layout-row .qti-layout-col11 {
  width: 91.48936170212765%;
  *width: 91.43617021276594%;
}

.qti3-player-container-fluid .qti-layout-row .qti-layout-col10 {
  width: 82.97872340425532%;
  *width: 82.92553191489361%;
}

.qti3-player-container-fluid .qti-layout-row .qti-layout-col9  {
  width: 74.46808510638297%;
  *width: 74.41489361702126%;
}

.qti3-player-container-fluid .qti-layout-row .qti-layout-col8  {
  width:65.95744680851064%;
  *width:65.90425531914893%;
}

.qti3-player-container-fluid .qti-layout-row .qti-layout-col7  {
  width: 57.44680851063829%;
  *width: 57.39361702127659%;
}

.qti3-player-container-fluid .qti-layout-row .qti-layout-col6  {
  width: 48.93617021276595%;
  *width: 48.88297872340425%;
}

.qti3-player-container-fluid .qti-layout-row .qti-layout-col5  {
  width: 40.42553191489362%;
  *width: 40.37234042553192%;
}

.qti3-player-container-fluid .qti-layout-row .qti-layout-col4  {
  width: 31.914893617021278%;
  *width: 31.861702127659576%;
}

.qti3-player-container-fluid .qti-layout-row .qti-layout-col3  {
  width: 23.404255319148934%;
  *width: 23.351063829787233%;
}

.qti3-player-container-fluid .qti-layout-row .qti-layout-col2  {
  width: 14.893617021276595%;
  *width:14.840425531914894%;
}

.qti3-player-container-fluid .qti-layout-row .qti-layout-col1  {
  width: 6.382978723404255%;
  *width: 6.329787234042553%;
}

.qti3-player-container-fluid .qti-layout-row .qti-layout-offset11 {
  margin-left: 95.74468085106382%;
  *margin-left: 95.6382978723404%;
}

.qti3-player-container-fluid .qti-layout-row .qti-layout-offset11:first-child {
  margin-left: 93.61702127659574%;
  *margin-left: 93.51063829787232%;
}

.qti3-player-container-fluid .qti-layout-row .qti-layout-offset10 {
  margin-left: 87.23404255319149%;
  *margin-left: 87.12765957446807%;
}

.qti3-player-container-fluid .qti-layout-row .qti-layout-offset10:first-child {
  margin-left: 85.1063829787234%;
  *margin-left: 84.99999999999999%;
}

.qti3-player-container-fluid .qti-layout-row .qti-layout-offset9  {
  margin-left: 78.72340425531914%;
  *margin-left: 78.61702127659572%;
}

.qti3-player-container-fluid .qti-layout-row .qti-layout-offset9:first-child  {
  margin-left: 76.59574468085106%;
  *margin-left: 76.48936170212764%;
}

.qti3-player-container-fluid .qti-layout-row .qti-layout-offset8  {
  margin-left: 70.2127659574468%;
  *margin-left: 70.10638297872339%;
}

.qti3-player-container-fluid .qti-layout-row .qti-layout-offset8:first-child  {
  margin-left: 68.08510638297872%;
  *margin-left: 67.9787234042553%;
}

.qti3-player-container-fluid .qti-layout-row .qti-layout-offset7  {
  margin-left: 61.70212765957446%;
  *margin-left: 61.59574468085106%;
}

.qti3-player-container-fluid .qti-layout-row .qti-layout-offset7:first-child {
  margin-left: 59.574468085106375%;
  *margin-left: 59.46808510638297%;
}

.qti3-player-container-fluid .qti-layout-row .qti-layout-offset6  {
  margin-left: 53.191489361702125%;
  *margin-left: 53.085106382978715%;
}

.qti3-player-container-fluid .qti-layout-row .qti-layout-offset6:first-child  {
  margin-left: 51.063829787234035%;
  *margin-left: 50.95744680851063%;
}

.qti3-player-container-fluid .qti-layout-row .qti-layout-offset5  {
  margin-left: 44.68085106382979%;
  *margin-left: 44.57446808510638%;
}

.qti3-player-container-fluid .qti-layout-row .qti-layout-offset5:first-child  {
  margin-left: 42.5531914893617%;
  *margin-left: 42.4468085106383%;
}

.qti3-player-container-fluid .qti-layout-row .qti-layout-offset4  {
  margin-left: 36.170212765957444%;
  *margin-left: 36.06382978723405%;
}

.qti3-player-container-fluid .qti-layout-row .qti-layout-offset4:first-child  {
  margin-left: 34.04255319148936%;
  *margin-left: 33.93617021276596%;
}

.qti3-player-container-fluid .qti-layout-row .qti-layout-offset3  {
  margin-left: 27.659574468085104%;
  *margin-left: 27.5531914893617%;
}

.qti3-player-container-fluid .qti-layout-row .qti-layout-offset3:first-child  {
  margin-left: 25.53191489361702%;
  *margin-left: 25.425531914893618%;
}

.qti3-player-container-fluid .qti-layout-row .qti-layout-offset2  {
  margin-left: 19.148936170212764%;
  *margin-left: 19.04255319148936%;
}

.qti3-player-container-fluid .qti-layout-row .qti-layout-offset2:first-child  {
  margin-left: 17.02127659574468%;
  *margin-left: 16.914893617021278%;
}

.qti3-player-container-fluid .qti-layout-row .qti-layout-offset1  {
  margin-left: 10.638297872340425%;
  *margin-left: 10.53191489361702%;
}

.qti3-player-container-fluid .qti-layout-row .qti-layout-offset1:first-child  {
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

  [class*="qti-layout-col"],
  .amp-item-container-fluid .qti-layout-row [class*="qti-layout-col"] {
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

  .qti-layout-row {
    margin-left: -20px;
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

  [class*="qti-layout-col"] {
    float: left;
    min-height: 1px;
    margin-left: 20px;
  }

  .qti-layout-col12 { width: 724px; }
  .qti-layout-col11 { width: 662px; }
  .qti-layout-col10 { width: 600px; }
  .qti-layout-col9  { width: 538px; }
  .qti-layout-col8  { width: 476px; }
  .qti-layout-col7  { width: 414px; }
  .qti-layout-col6  { width: 352px; }
  .qti-layout-col5  { width: 290px; }
  .qti-layout-col4  { width: 228px; }
  .qti-layout-col3  { width: 166px; }
  .qti-layout-col2  { width: 104px; }
  .qti-layout-col1  { width: 42px; }

  .qti-layout-offset11 { margin-left: 702px; }
  .qti-layout-offset10 { margin-left: 640px; }
  .qti-layout-offset9  { margin-left: 578px; }
  .qti-layout-offset8  { margin-left: 516px; }
  .qti-layout-offset7  { margin-left: 454px; }
  .qti-layout-offset6  { margin-left: 392px; }
  .qti-layout-offset5  { margin-left: 330px; }
  .qti-layout-offset4  { margin-left: 268px; }
  .qti-layout-offset3  { margin-left: 206px; }
  .qti-layout-offset2  { margin-left: 144px; }
  .qti-layout-offset1  { margin-left: 82px; }

  .qti3-player-container-fluid .qti-layout-row {
    width: 100%;
    *zoom: 1;
  }

  .qti3-player-container-fluid .qti-layout-row:before,
  .qti3-player-container-fluid .qti-layout-row:after {
    display: table;
    content: "";
    line-height: 0;
  }

  .qti3-player-container-fluid .qti-layout-row:after {
    clear: both;
  }

  .qti3-player-container-fluid .qti-layout-row [class*="qti-layout-col"] {
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

  .qti3-player-container-fluid .qti-layout-row [class*="qti-layout-col"]:first-child {
    margin-left: 0;
  }

  .qti3-player-container-fluid .qti-layout-row .qti-layout-col12 {
    width: 100%;
    *width: 99.94680851063829%;
  }

  .qti3-player-container-fluid .qti-layout-row .qti-layout-col11 {
    width: 91.43646408839778%;
    *width: 91.38327259903608%;
  }

  .qti3-player-container-fluid .qti-layout-row .qti-layout-col10 {
    width: 82.87292817679558%;
    *width: 82.81973668743387%;
  }

  .qti3-player-container-fluid .qti-layout-row .qti-layout-col9 {
    width: 74.30939226519337%;
    *width: 74.25620077583166%;
  }
  .qti3-player-container-fluid .qti-layout-row .qti-layout-col8 {
    width: 65.74585635359117%;
    *width: 65.69266486422946%;
  }

  .qti3-player-container-fluid .qti-layout-row .qti-layout-col7 {
    width: 57.18232044198895%;
    *width: 57.12912895262725%;
  }

  .qti3-player-container-fluid .qti-layout-row .qti-layout-col6 {
    width: 48.61878453038674%;
    *width: 48.56559304102504%;
  }

  .qti3-player-container-fluid .qti-layout-row .qti-layout-col5 {
    width: 40.05524861878453%;
    *width: 40.00205712942283%;
  }

  .qti3-player-container-fluid .qti-layout-row .qti-layout-col4 {
    width: 31.491712707182323%;
    *width: 31.43852121782062%;
  }

  .qti3-player-container-fluid .qti-layout-row .qti-layout-col3 {
    width: 22.92817679558011%;
    *width: 22.87498530621841%;
  }

  .qti3-player-container-fluid .qti-layout-row .qti-layout-col2 {
    width: 14.3646408839779%;
    *width: 14.311449394616199%;
  }

  .qti3-player-container-fluid .qti-layout-row .qti-layout-col1 {
    width: 5.801104972375691%;
    *width: 5.747913483013988%;
  }

  .qti3-player-container-fluid .qti-layout-row .qti-layout-offset11 {
    margin-left: 96.96132596685082%;
    *margin-left: 96.8549429881274%;
  }

  .qti3-player-container-fluid .qti-layout-row .qti-layout-offset11:first-child {
    margin-left: 94.1988950276243%;
    *margin-left: 94.09251204890089%;
  }

  .qti3-player-container-fluid .qti-layout-row .qti-layout-offset10 {
    margin-left: 88.39779005524862%;
    *margin-left: 88.2914070765252%;
  }

  .qti3-player-container-fluid .qti-layout-row .qti-layout-offset10:first-child {
    margin-left: 85.6353591160221%;
    *margin-left: 85.52897613729868%;
  }

  .qti3-player-container-fluid .qti-layout-row .qti-layout-offset9 {
    margin-left: 79.8342541436464%;
    *margin-left: 79.72787116492299%;
  }

  .qti3-player-container-fluid .qti-layout-row .qti-layout-offset9:first-child {
    margin-left: 77.07182320441989%;
    *margin-left: 76.96544022569647%;
  }

  .qti3-player-container-fluid .qti-layout-row .qti-layout-offset8 {
    margin-left: 71.2707182320442%;
    *margin-left: 71.16433525332079%;
  }

  .qti3-player-container-fluid .qti-layout-row .qti-layout-offset8:first-child {
    margin-left: 68.50828729281768%;
    *margin-left: 68.40190431409427%;
  }

  .qti3-player-container-fluid .qti-layout-row .qti-layout-offset7 {
    margin-left: 62.70718232044199%;
    *margin-left: 62.600799341718584%;
  }

  .qti3-player-container-fluid .qti-layout-row .qti-layout-offset7:first-child {
    margin-left: 59.94475138121547%;
    *margin-left: 59.838368402492065%;
  }

  .qti3-player-container-fluid .qti-layout-row .qti-layout-offset6 {
    margin-left: 54.14364640883978%;
    *margin-left: 54.037263430116376%;
  }

  .qti3-player-container-fluid .qti-layout-row .qti-layout-offset6:first-child {
    margin-left: 51.38121546961326%;
    *margin-left: 51.27483249088986%;
  }

  .qti3-player-container-fluid .qti-layout-row .qti-layout-offset5 {
    margin-left: 45.58011049723757%;
    *margin-left: 45.47372751851417%;
  }

  .qti3-player-container-fluid .qti-layout-row .qti-layout-offset5:first-child {
    margin-left: 42.81767955801105%;
    *margin-left: 42.71129657928765%;
  }

  .qti3-player-container-fluid .qti-layout-row .qti-layout-offset4 {
    margin-left: 37.01657458563536%;
    *margin-left: 36.91019160691196%;
  }

  .qti3-player-container-fluid .qti-layout-row .qti-layout-offset4:first-child {
    margin-left: 34.25414364640884%;
    *margin-left: 34.14776066768544%;
  }

  .qti3-player-container-fluid .qti-layout-row .qti-layout-offset3 {
    margin-left: 28.45303867403315%;
    *margin-left: 28.346655695309746%;
  }

  .qti3-player-container-fluid .qti-layout-row .qti-layout-offset3:first-child {
    margin-left: 25.69060773480663%;
    *margin-left: 25.584224756083227%;
  }

  .qti3-player-container-fluid .qti-layout-row .qti-layout-offset2 {
    margin-left: 19.88950276243094%;
    *margin-left: 19.783119783707537%;
  }

  .qti3-player-container-fluid .qti-layout-row .qti-layout-offset2:first-child {
    margin-left: 17.12707182320442%;
    *margin-left: 17.02068884448102%;
  }

  .qti3-player-container-fluid .qti-layout-row .qti-layout-offset1 {
    margin-left: 11.32596685082873%;
    *margin-left: 11.219583872105325%;
  }

  .qti3-player-container-fluid .qti-layout-row .qti-layout-offset1:first-child {
    margin-left: 8.56353591160221%;
    *margin-left: 8.457152932878806%;
  }
}

/* ===========================================
   Overrides for typical desktop or chromebook
   =========================================== */
@media (min-width:1200px) {

  .qti-layout-row {
    margin-left: -30px;
    *zoom:1;
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

  [class*="qti-layout-col"] {
    float: left;
    min-height: 1px;
    margin-left: 30px;
  }

  .qti-layout-col12 { width: 1170px; }
  .qti-layout-col11 { width: 1070px; }
  .qti-layout-col10 { width: 970px; }
  .qti-layout-col9  { width: 870px; }
  .qti-layout-col8  { width: 770px; }
  .qti-layout-col7  { width: 670px; }
  .qti-layout-col6  { width: 570px; }
  .qti-layout-col5  { width: 470px; }
  .qti-layout-col4  { width: 370px; }
  .qti-layout-col3  { width: 270px; }
  .qti-layout-col2  { width: 170px; }
  .qti-layout-col1  { width: 70px; }

  .qti-layout-offset11 { margin-left: 1130px; }
  .qti-layout-offset10 { margin-left: 1030px; }
  .qti-layout-offset9  { margin-left: 930px; }
  .qti-layout-offset8  { margin-left: 830px; }
  .qti-layout-offset7  { margin-left: 730px; }
  .qti-layout-offset6  { margin-left: 630px; }
  .qti-layout-offset5  { margin-left: 530px; }
  .qti-layout-offset4  { margin-left: 430px; }
  .qti-layout-offset3  { margin-left: 330px; }
  .qti-layout-offset2  { margin-left: 230px; }
  .qti-layout-offset1  { margin-left: 130px; }

  .qti3-player-container-fluid .qti-layout-row {
    width: 100%;
    *zoom: 1;
  }

  .qti3-player-container-fluid .qti-layout-row:before,
  .qti3-player-container-fluid .qti-layout-row:after {
    display: table;
    content: "";
    line-height: 0;
  }

  .qti3-player-container-fluid .qti-layout-row:after {
    clear: both;
  }

  .qti3-player-container-fluid .qti-layout-row [class*="qti-layout-col"] {
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

  .qti3-player-container-fluid .qti-layout-row [class*="qti-layout-col"]:first-child {
    margin-left: 0;
  }

  .qti3-player-container-fluid .qti-layout-row .qti-layout-col12 {
    width: 100%;
    *width: 99.94680851063829%;
  }

  .qti3-player-container-fluid .qti-layout-row .qti-layout-col11 {
    width: 91.45299145299145%;
    *width: 91.39979996362975%;
  }

  .qti3-player-container-fluid .qti-layout-row .qti-layout-col10 {
    width: 82.90598290598291%;
    *width: 82.8527914166212%;
  }

  .qti3-player-container-fluid .qti-layout-row .qti-layout-col9 {
    width: 74.35897435897436%;
    *width: 74.30578286961266%;
  }

  .qti3-player-container-fluid .qti-layout-row .qti-layout-col8 {
    width: 65.81196581196582%;
    *width: 65.75877432260411%;
  }

  .qti3-player-container-fluid .qti-layout-row .qti-layout-col7 {
    width: 57.26495726495726%;
    *width: 57.21176577559556%;
  }

  .qti3-player-container-fluid .qti-layout-row .qti-layout-col6 {
    width: 48.717948717948715%;
    *width: 48.664757228587014%;
  }

  .qti3-player-container-fluid .qti-layout-row .qti-layout-col5 {
    width: 40.17094017094017%;
    *width: 40.11774868157847%;
  }

  .qti3-player-container-fluid .qti-layout-row .qti-layout-col4 {
    width: 31.623931623931625%;
    *width: 31.570740134569924%;
  }

  .qti3-player-container-fluid .qti-layout-row .qti-layout-col3 {
    width: 23.076923076923077%;
    *width: 23.023731587561375%;
  }

  .qti3-player-container-fluid .qti-layout-row .qti-layout-col2 {
    width: 14.52991452991453%;
    *width: 14.476723040552828%;
  }

  .qti3-player-container-fluid .qti-layout-row .qti-layout-col1 {
    width: 5.982905982905983%;
    *width: 5.929714493544281%;
  }

  .qti3-player-container-fluid .qti-layout-row .qti-layout-offset11 {
    margin-left: 96.58119658119658%;
    *margin-left: 96.47481360247316%;
  }

  .qti3-player-container-fluid .qti-layout-row .qti-layout-offset11:first-child {
    margin-left: 94.01709401709402%;
    *margin-left: 93.91071103837061%;
  }

  .qti3-player-container-fluid .qti-layout-row .qti-layout-offset10 {
    margin-left: 88.03418803418803%;
    *margin-left: 87.92780505546462%;
  }

  .qti3-player-container-fluid .qti-layout-row .qti-layout-offset10:first-child {
    margin-left: 85.47008547008548%;
    *margin-left: 85.36370249136206%;
  }

  .qti3-player-container-fluid .qti-layout-row .qti-layout-offset9 {
    margin-left: 79.48717948717949%;
    *margin-left: 79.38079650845607%;
  }

  .qti3-player-container-fluid .qti-layout-row .qti-layout-offset9:first-child {
    margin-left: 76.92307692307693%;
    *margin-left: 76.81669394435352%;
  }

  .qti3-player-container-fluid .qti-layout-row .qti-layout-offset8 {
    margin-left: 70.94017094017094%;
    *margin-left: 70.83378796144753%;
  }

  .qti3-player-container-fluid .qti-layout-row .qti-layout-offset8:first-child {
    margin-left: 68.37606837606839%;
    *margin-left: 68.26968539734497%;
  }

  .qti3-player-container-fluid .qti-layout-row .qti-layout-offset7 {
    margin-left: 62.393162393162385%;
    *margin-left: 62.28677941443899%;
  }

  .qti3-player-container-fluid .qti-layout-row .qti-layout-offset7:first-child  {
    margin-left: 59.82905982905982%;
    *margin-left: 59.72267685033642%;
  }

  .qti3-player-container-fluid .qti-layout-row .qti-layout-offset6 {
    margin-left: 53.84615384615384%;
    *margin-left: 53.739770867430444%;
  }

  .qti3-player-container-fluid .qti-layout-row .qti-layout-offset6:first-child {
    margin-left: 51.28205128205128%;
    *margin-left: 51.175668303327875%;
  }

  .qti3-player-container-fluid .qti-layout-row .qti-layout-offset5 {
    margin-left: 45.299145299145295%;
    *margin-left: 45.1927623204219%;
  }

  .qti3-player-container-fluid .qti-layout-row .qti-layout-offset5:first-child {
    margin-left: 42.73504273504273%;
    *margin-left: 42.62865975631933%;
  }

  .qti3-player-container-fluid .qti-layout-row .qti-layout-offset4 {
    margin-left: 36.75213675213675%;
    *margin-left: 36.645753773413354%;
  }

  .qti3-player-container-fluid .qti-layout-row .qti-layout-offset4:first-child {
    margin-left: 34.18803418803419%;
    *margin-left: 34.081651209310785%;
  }

  .qti3-player-container-fluid .qti-layout-row .qti-layout-offset3 {
    margin-left: 28.205128205128204%;
    *margin-left: 28.0987452264048%;
  }

  .qti3-player-container-fluid .qti-layout-row .qti-layout-offset3:first-child {
    margin-left: 25.641025641025642%;
    *margin-left: 25.53464266230224%;
  }

  .qti3-player-container-fluid .qti-layout-row .qti-layout-offset2 {
    margin-left: 19.65811965811966%;
    *margin-left: 19.551736679396257%;
  }

  .qti3-player-container-fluid .qti-layout-row .qti-layout-offset2:first-child {
    margin-left: 17.094017094017094%;
    *margin-left: 16.98763411529369%;
  }

  .qti3-player-container-fluid .qti-layout-row .qti-layout-offset1 {
    margin-left: 11.11111111111111%;
    *margin-left: 11.004728132387708%;
  }

  .qti3-player-container-fluid .qti-layout-row .qti-layout-offset1:first-child {
    margin-left: 8.547008547008547%;
    *margin-left: 8.440625568285142%;
  }
}
</style>
