<template>
  <div ref="root">
    <component
      ref="endattempt"
      :is="interactionTemplate"
      v-on:endAttempt="handleEndAttempt"
      v-on:updateState="handleUpdateState"
      v-on:endAttemptReady="handleEndAttemptReady"
      v-bind="$attrs" />
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
import { getEndAttemptInteractionSubType, endAttemptInteractionAdapter } from './adapters/endattempt-interaction-adapter'

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
     * Extension point for specifying the max number of steps for an
     * endattempt-controller-bar.
     * String that evaluates to a positive integer (1..n)
     */
    dataSteps: {
      required: false,
      type: String
    },
    /*
     * Extension point for specifying that an endattempt-controller-bar
     * should display a New Question button: { "true" | "false" }
     */
    dataHastemplates: {
      required: false,
      type: String
    },
    /*
     * Extension point for specifying subtypes of an endattempt-controller-bar:
     * { "generic" | "solve" | "showexample" }
     */
    dataControllerType: {
      required: false,
      type: String
    },
    /*
     * Extension point for specifying whether or not to display
     * the endattempt-controller-bar progress panel: { "true" | "false" }
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
      cardinality: 'single',
      responseDeclaration: null,
      /*
       * May be one of '' | 'endattempt-controller-bar'
       */
      interactionSubType: '',
      isBtnDisabled: false,
      isValidResponse: true,
      invalidResponseMessage: '',
      isQtiValid: true,
      /*
       * Reference to the sub-component
       */
      node: null,
      /*
       * When restoring, this is where we save the prior variable state.
       */
      priorState: null
    }
  },

  computed: {

    /**
     * @description Compute a template/component according to the interactionSubType.
     */
    interactionTemplate () {
      return endAttemptInteractionAdapter(this.interactionSubType, this.createComponentProperties())
    }

  },

  methods: {

    /**
     * @description Get this interaction's response.
     * @return {Boolean} response
     */
    getResponse () {
      return this.response
    },

    /**
     * @description Set this interaction's response
     * @param {Boolean} response
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
     * @description Utility method to compute and update state.
     */
    updateState () {
      this.setState(this.computeState())
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

    getStep () {
      if (this.interactionSubType === 'endattempt-controller-bar') {
        return this.node.getStep()
      }
      return 1
    },

    setStep (step) {
      if (this.interactionSubType === 'endattempt-controller-bar') {
        this.node.setStep(step)
      }
    },

    initializeValue () {
      this.enableButton()
      this.setStep(1)
      this.updateState()
      this.setResponse(false)
      this.setIsValid(true)
    },

    resetValue () {
      console.log('[ResetValue][identifier]', this.responseIdentifier)
      this.initializeValue()
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
      if (state.state.isBtnDisabled)
        this.disableButton()
      else
        this.enableButton()

      this.setStep(state.state.step)
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
        isBtnDisabled: this.getIsBtnDisabled(),
        interactionSubType: this.getInteractionSubType()
      }
      return state
    },

    disable () {
      this.disableButton()
      this.updateState()
    },

    enable () {
      this.enableButton()
      this.setResponse(false)
      this.updateState()
    },

    getIsBtnDisabled () {
      return this.node.getIsBtnDisabled()
    },

    setIsBtnDisabled (isBtnDisabled) {
      this.node.setIsBtnDisabled(isBtnDisabled)
    },

    setInteractionSubType (interactionSubType) {
      this.interactionSubType = interactionSubType
    },

    getInteractionSubType () {
      return this.interactionSubType
    },

    /**
     * @description If the candidate invokes response processing using an
     * endAttemptInteraction then the associated response variable is
     * set to true.
     */
    handleEndAttempt (data) {
      // 1) Set response to true
      this.setResponse(data.response)
      // 2) Set state
      this.updateState()
      // 3) Notify store - invoke response processing
      this.notifyEndAttempt()
    },

    handleUpdateState () {
      this.updateState()
    },

    enableButton () {
      this.node.enable()

    },

    disableButton () {
      this.node.disable()
    },

    /**
     * @description attempt to parse the interaction component
     * from the staticClass property of this $vnode.
     * Throws an exception if none found.
     * @param staticClass property of the $vnode.data object
     */
    detectInteractionSubType (staticClass) {
      return getEndAttemptInteractionSubType(staticClass)
    },

    createComponentProperties () {
      // Create default properties
      let properties = {
        responseIdentifier: this.responseIdentifier,
        title: this.title
      }

      // Add additional props used in an endattempt-controller-bar
      properties.dataSteps        = (typeof this.dataSteps !== 'undefined') ? this.dataSteps : '1'
      properties.dataHastemplates = (typeof this.dataHastemplates !== 'undefined') ? this.dataHastemplates === 'true' : false
      properties.dataHideprogress = (typeof this.dataHideprogress !== 'undefined') ? this.dataHideprogress === 'true' : false
      properties.dataControllerType = (typeof this.dataControllerType !== 'undefined') ? this.dataControllerType : 'generic'

      return properties
    },

    handleEndAttemptReady (node) {
      this.node = node.node
    },

    notifyEndAttempt () {
      store.NotifyEndAttempt({
          identifier: this.responseIdentifier,
          step: this.getStep(),
          maximumSteps: (typeof this.dataSteps !== 'undefined') ? (this.dataSteps*1) : 1,
          interactionSubType: this.getInteractionSubType()
        })
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
      this.setInteractionSubType(this.detectInteractionSubType(this.$vnode.data.staticClass))

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

<style>
</style>
