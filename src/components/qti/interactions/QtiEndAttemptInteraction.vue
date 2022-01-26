<template>
  <div ref="root">
    <template v-if="interactionSubType === 'mxlcontroller'">
      <div
        ref="mxlcontroller"
        class="mxl-controller"
        v-bind="$attrs">
        <div class="row">
          <div class="col">
            <div id="msgPanel">
              <div v-bind:class="progressClass">
                <div id="msgNotes">{{ progressMessage }}</div>
                <div class="progress">
                  <div class="progress-bar" :style="{ width: progressActiveWidth + '%' }" role="progressbar" :aria-valuenow="progressActiveWidth" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-auto">
            <button v-if="hasTemplates" id="btnTryAnother" @click.prevent="handleMxlTryAnother" type="button" class="btn btn-secondary btn-rounded">Try Another</button>
            <button ref="checkanswer" id="btnCheckAnswer" @click.prevent="handleMxlCheckAnswer" type="button" class="btn btn-primary btn-rounded">{{ title }}</button>
          </div>
        </div>
      </div>
    </template>
    <template v-else>
      <button
        ref="endattempt"
        class="qti-end-attempt-interaction"
        @click.prevent="handleEndAttempt"
        type="button"
        v-bind="$attrs">
        {{ title }}
      </button>
    </template>
  </div>
</template>

<script>
/*
 * The end attempt interaction is a special type of interaction which allows item authors to provide
 * the candidate with control over the way in which the candidate terminates an attempt. The candidate
 * can use the interaction to terminate the attempt (triggering response processing) immediately,
 * typically to request a hint. It must be bound to a response variable with base-type boolean and
 * single cardinality. If the candidate invokes response processing using an endAttemptInteraction
 * then the associated response variable is set to 'true'. If response processing is invoked in any
 * other way, either through a different endAttemptInteraction or through the default method for
 * the delivery engine, then the associated response variable is set to 'false'. The default value
 * of the response variable is always ignored.
 */
import { store } from '@/store/store'
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiParseException from '@/components/qti/exceptions/QtiParseException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'

const qtiAttributeValidation = new QtiAttributeValidation()

export default {
  name: 'QtiEndAttemptInteraction',

  props: {
    responseIdentifier: {
      required: true,
      type: String
    },
    /*
     * The string that should be displayed to the candidate as a prompt for ending the attempt
     * using this interaction. This should be short, preferably one word. A typical value would
     * be "Hint". For example, in a graphical environment it would be presented as the label on
     * a button that, when pressed, ends the attempt.
     */
    title: {
      required: true,
      type: String
    },
    /*
     * Extension point for specifying the max number of steps for an item.
     * String that evaluates to a positive integer (1..n)
     */
    dataSteps: {
      required: false,
      type: String
    },
    /*
     * Extension point for specifying that this end attempt interaction should display
     * a Try Another button: { "true" | "false" }
     */
    dataHastemplates: {
      required: false,
      type: String
    },
    /*
     * Extension point for specifying subtypes of mxl-controller-bar:
     * { "generic" | "solve" | "showexample" }
     */
    dataControllerType: {
      required: false,
      type: String
    },
    /*
     * Extension point for specifying whether or not to display
     * the mxl-progress-panel: { "true" | "false" }
     */
    dataHideprogress: {
      required: false,
      type: String
    }
  },

  inheritAttrs: false,

  data() {
    return {
      response: false,
      state: null,
      baseType: null,
      cardinality: null,
      responseDeclaration: null,
      interactionSubType: '',
      step: 1,  // For adaptive items, this permits us to display completion percentage
      isBtnDisabled: false,
      isValidResponse: true,
      invalidResponseMessage: '',
      isQtiValid: true,
      // If we are restoring, this is where we save the prior variable state
      priorState: null
    }
  },

  computed: {

    progressMaximumSteps () {
      return (typeof this.dataSteps === 'undefined') ? 1 : (this.dataSteps*1)
    },

    progressActiveWidth () {
      let max = this.progressMaximumSteps
      max = this.step > max ? this.step : max
      return Math.floor(100 * (this.step / max))
    },

    progressMessage () {
      if (this.step === this.progressMaximumSteps) {
        return 'All Parts Showing'
      }
      return 'Step ' + this.step + ' of ' + this.progressMaximumSteps
    },

    hasTemplates () {
      return (typeof this.dataHastemplates !== 'undefined') ? this.dataHastemplates === 'true' : false
    },

    controllerType () {
      return (typeof this.dataControllerType !== 'undefined') ? this.dataControllerType : 'generic'
    },

    progressClass () {
      return {
        'mxl-progress-panel': true,
        'progress-hidden': (typeof this.dataHideprogress !== 'undefined') ? this.dataHideprogress === 'true' : false
      }
    }

  },

  methods: {

    /**
     * @description Get this interaction's response.
     * @return {String or Array} response - depending on cardinality
     */
    getResponse () {
      return this.response
    },

    /**
     * @description Set this interaction's response
     * @param {String or Array} response - (string or array depending on cardinality)
     *                                     containing selected choice identifier(s).
     */
    setResponse (response) {
      this.response = response
    },

    /**
     * @description Get this interaction's state.
     * @return {Object} state
     */
    getState () {
      return this.state
    },

    /**
     * @description Set/restore this interaction's state.
     * @param {Object} state
     */
    setState (state) {
      this.state = state
    },

    /**
     * @description Get this interaction's response validity.
     * @return {Boolean} isValidResponse
     */
    getIsValid () {
      return this.isValidResponse
    },

    /**
     * @description Set this interaction's response validity.
     * @param {Boolean} isValid
     */
    setIsValid (isValid) {
      this.isValidResponse = isValid
    },

    /**
     * @description Get this interaction's invalid response message.
     * @return {String} empty string
     */
    getInvalidResponseMessage () {
      return this.invalidResponseMessage
    },

    /**
     * @description Computes this interaction's cardinality.
     * @return {String} - cardinality 'single'
     */
    getCardinality () {
      return this.cardinality
    },

    initializeValue () {
      this.setResponse(false)
      this.enableButton()
      this.setStep(1)
      this.setState(this.computeState())
      this.setIsValid(true)
    },

    resetValue () {
      console.log('[ResetValue][identifier]', this.responseIdentifier)
      this.setResponse(false)
      this.enableButton()
      this.setState(this.computeState())
      this.setIsValid(true)
    },

    /**
     * @description Restores this interaction's response and state.
     * Also restores this interaction's response validity.
     * @param {Object} state
     * When not null, has this schema:
     * {
     *   identifier: [String],
     *   value: [Boolean]
     *   state: {
     *     step: [Number],
     *     isBtnDisabled: [Boolean]
     *   }
     * }
     */
    restoreValue (state) {
      this.setStep(state.state.step)

      if (state.state.isBtnDisabled)
        this.disableButton()
      else
        this.enableButton()

      this.setState(this.computeState())
      this.setResponse(this.computeResponse(state.value))
      this.setIsValid(true)
    },

    /**
     * @description Build a response from the value.
     * @param {Boolean} value - may be null or a boolean
     * @return {Boolean} response
     */
    computeResponse (value) {
      if (value === null) return false
      return value
    },

    /**
     * @description For an end attempt interaction, we track
     * 'step' and 'isBtnDisabled'
     * @return {Object} state object
     */
    computeState () {
      const state = {
        step: this.getStep(),
        isBtnDisabled: this.getIsBtnDisabled()
      }
      return state
    },

    disable () {
      this.disableButton()
      this.setState(this.computeState())
    },

    enable () {
      this.enableButton()
      this.setResponse(false)
      this.setState(this.computeState())
    },

    getStep () {
      return this.step
    },

    setStep (step) {
      this.step = step
    },

    getIsBtnDisabled () {
      return this.isBtnDisabled
    },

    setIsBtnDisabled (isBtnDisabled) {
      this.isBtnDisabled = isBtnDisabled
    },

    /**
     * @description If the candidate invokes response processing using an
     * endAttemptInteraction then the associated response variable is
     * set to true.
     */
    handleEndAttempt () {
      // 1) Disable the button if this is a plain qti-end-attempt-interaction
      this.toggleEndAttemptDisabled()
      // 2) Set response to true
      this.setResponse(true)
      // 3) Set state
      this.setState(this.computeState())
      // 4) Notify store - should invoke response processing
      this.notifyEndAttempt()
    },

    enableButton () {
      switch (this.interactionSubType) {
        case 'mxlcontroller':
          this.toggleButtonDisabled(this.$refs.mxlcontroller, false)
          break
        default:
          this.toggleButtonDisabled(this.$refs.endattempt, false)
      }
    },

    disableButton () {
      switch (this.interactionSubType) {
        case 'mxlcontroller':
          this.toggleButtonDisabled (this.$refs.checkanswer, true)
          break
        default:
          this.toggleButtonDisabled(this.$refs.endattempt, true)
      }
    },

    toggleEndAttemptDisabled () {
      if (this.interactionSubType === '') this.toggleButtonDisabled(this.$refs.endattempt, true)
    },

    /**
     * @description Utility method to increment the
     * current step state (saved in the 'step' data property)
     */
    incrementStep () {
      this.setStep(this.getStep() + 1)
    },

    toggleButtonDisabled (buttonRef, disable) {
      if (disable)
        buttonRef.setAttribute('disabled', '')
      else
        buttonRef.removeAttribute('disabled')

      this.setIsBtnDisabled(disable)
    },

    updateCheckAnswerState () {
      switch (this.controllerType) {
        case 'generic':
          if (!this.finalizeCheckAnswerState()) this.incrementStep()
          break
        case 'showexample':
        case 'solve':
          this.incrementStep()
          this.finalizeCheckAnswerState()
          break
        default:
      }
    },

    finalizeCheckAnswerState () {
      // Step < Max means we are not final.
      if (this.step < this.progressMaximumSteps)  return false

      // Step >= MaxSteps and we are final.
      // Setting response to 'true' communicates that the item is complete.
      this.setResponse(true)
      // Disable the checkanswer button
      this.toggleButtonDisabled(this.$refs.checkanswer, true)
      return true
    },

    resetCheckAnswerState () {
      this.setStep(1)
      this.toggleButtonDisabled(this.$refs.checkanswer, false)
    },

    /**
     * @description Handles computation of this interaction's subtype.
     * @param {Nodelist} classList - this component's classList
     * @return {String} interaction sub type
     */
    getInteractionSubType (classList) {
      // Detect a supported custom interaction type
      if (classList.contains('mxl-controller-bar')) return 'mxlcontroller'

      return ''
    },

    notifyEndAttempt () {
      store.NotifyEndAttempt({
          identifier: this.responseIdentifier,
          step: this.step,
          maximumSteps: this.progressMaximumSteps,
          interactionSubType: this.interactionSubType
        })
    },

    handleNewTemplate () {
      store.NotifyNewTemplate({
          identifier: this.responseIdentifier,
          step: this.step,
          maximumSteps: this.progressMaximumSteps
        })
    },

    handleMxlTryAnother () {
      this.resetCheckAnswerState()
      this.handleNewTemplate()
    },

    handleMxlCheckAnswer () {
      this.updateCheckAnswerState()
      this.notifyEndAttempt()
    },

    /**
     * @description Retrieve this interaction's prior state.
     * When not null, has this schema:
     * {
     *   identifier: [String],
     *   value: [Boolean]
     *   state: {
     *     step: [Number],
     *     isBtnDisabled: [Boolean]
     *   }
     * }
     * @param {String} identifier - of a response variable
     * @return {Object} - a prior state or null
     */
    getPriorState (identifier) {
      const priorState = store.getItemContextStateVariable(identifier)

      // If priorState is null, we are not restoring anything
      if (priorState === null) return null

      // Perform basic consistency checking on this priorState
      if (!('value' in priorState)) {
        throw new QtiEvaluationException('End Attempt Interaction State Invalid.  "value" property not found.')
      }
      if (!('state' in priorState)) {
        throw new QtiEvaluationException('End Attempt Interaction State Invalid.  "state" property not found.')
      }
      if (!('step' in priorState.state)) {
        throw new QtiEvaluationException('End Attempt Interaction State Invalid.  "step" property not found.')
      }
      if (!('isBtnDisabled' in priorState.state)) {
        throw new QtiEvaluationException('End Attempt Interaction State Invalid.  "isBtnDisabled" property not found.')
      }

      return priorState
    }

  },

  created () {
    try {
      this.responseDeclaration = qtiAttributeValidation.validateResponseIdentifierAttribute(store, this.responseIdentifier)

      // Pull any prior interaction state.
      this.priorState = this.getPriorState(this.responseIdentifier)

    } catch (err) {
      this.isQtiValid = false
      if (err.name === 'QtiValidationException') {
        throw new QtiValidationException(err.message)
      } else if (err.name === 'QtiParseException') {
        throw new QtiParseException(err.message)
      } else {
        throw new Error(err.message)
      }
    }
  },

  mounted () {
    if (this.isQtiValid) {
      try {

        if (this.priorState === null)
          this.initializeValue()
        else
          this.restoreValue(this.priorState)

        // Switch template based on detected subtype in the classList
        this.interactionSubType = this.getInteractionSubType(this.$el.classList)

        // Notify store of our new component
        store.defineInteraction({
            identifier: this.responseIdentifier,
            interactionType: 'EndAttemptInteraction',
            interactionSubType: this.interactionSubType,
            node: this,
            resetValue: this.resetValue,
            disable: this.disable,
            enable: this.enable,
            isValidResponse: this.isValidResponse,
            invalidResponseMessage: this.getInvalidResponseMessage()
        })

        console.log('[' + this.$options.name + ':' + this.interactionSubType + '][Identifier]', this.responseIdentifier)
      } catch (err) {
        this.isQtiValid = false
        console.log('[' + this.$options.name + '][ValidationError]', err.name, err.message)
        throw new QtiValidationException(err.message)
      }
    }
  }
}
</script>

<style scoped>

button.qti-end-attempt-interaction {
  display: inline-block;
  margin: 0;
  font-family: inherit;
  font-size: .875rem;
  line-height: inherit;
  font-weight: 400;
  text-transform: none;
  -webkit-appearance: button;
  text-align: center;
  vertical-align: middle;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  border: 1px solid transparent;
  padding: .47rem .75rem;
  border-radius: .25rem;
  outline: 0!important;
  color: var(--ea-button-default-color);
  background-color: var(--ea-button-default-bgc);
  border-color: var(--ea-button-secondary-bc);
  -webkit-transition: color .15s ease-in-out,background-color .15s ease-in-out,border-color .15s ease-in-out,-webkit-box-shadow .15s ease-in-out;
  transition: color .15s ease-in-out,background-color .15s ease-in-out,border-color .15s ease-in-out,-webkit-box-shadow .15s ease-in-out;
  transition: color .15s ease-in-out,background-color .15s ease-in-out,border-color .15s ease-in-out,box-shadow .15s ease-in-out;
  transition: color .15s ease-in-out,background-color .15s ease-in-out,border-color .15s ease-in-out,box-shadow .15s ease-in-out,-webkit-box-shadow .15s ease-in-out;
}

button.qti-end-attempt-interaction:focus {
  border-color: var(--choice-ctrlh-focus-bc);
  box-shadow: var(--choice-control-focus-shadow);
}

button.qti-end-attempt-interaction:hover {
  filter: var(--ea-button-hover-brightness);
}

button.qti-end-attempt-interaction:not(:disabled) {
  cursor: pointer;
}

button.qti-end-attempt-interaction:disabled {
  pointer-events: none;
}

.qti-color-secondary button.qti-end-attempt-interaction {
  color: var(--ea-button-secondary-color);
  background-color: var(--ea-button-secondary-bgc);
  border-color: var(--ea-button-secondary-bc);
}

.qti-color-secondary button.qti-end-attempt-interaction:focus {
  color: var(--ea-button-secondary-color);
  background-color: var(--ea-button-secondary-bgc);
  border-color: var(--choice-ctrlh-focus-bc);
  box-shadow: var(--choice-control-focus-shadow);
}

.qti-color-secondary button.qti-end-attempt-interaction:not(:disabled):hover {
  filter: var(--ea-button-hover-brightness);
}

button.qti-end-attempt-interaction:disabled {
  color: var(--gray);
  background-color: var(--light);
  border-color: var(--light);
  filter: brightness(90%);
}

.mxl-controller {
  position: absolute;
  bottom: 0px;
  left: 0px;
  height: 60px;
  width: 100%;
	padding: 10px 10px 5px;
  border-radius: 0 0 2px 2px;
  border-top: 1px solid #eee;
  background-color: #eff2f7;
  border-top: 1px solid rgba(0,0,0,.125);
}

.mxl-controller #btnCheckAnswer,
.mxl-controller #btnTryAnother {
  margin-left:5px;
}

.mxl-controller #msgPanel {
	width: 160px;
  float: left;
  margin-left: 32px;
}

.progress {
  width: 160px;
  height: 10px;
  background-color: #bbb;
  border-radius: .25rem;
}

.progress-bar {
  border-radiums: .25rem;
}

.mxl-progress-panel {
  margin-top: -2px;
  line-height: 28px;
  font-weight: normal;
  text-align: center;
}
.mxl-progress-panel.progress-hidden {
  display: none;
}
</style>
