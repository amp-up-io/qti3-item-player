<template>
    <component
      ref="input"
      class="qti-text-entry-interaction"
      :is="interactionTemplate"
      v-on:textEntryUpdate="handleTextEntryUpdate"
      v-on:textEntryReady="handleTextEntryReady"
    />
</template>

<script>
/**
 * A TextEntry Interaction is an inlineInteraction that obtains a simple piece of text from the candidate.
 * Like inlineChoiceInteraction, the delivery engine must allow the candidate to review their choice within
 * the context of the surrounding text. The textEntryInteraction must be bound to a response variable with
 * single or record cardinality only. If the response variable has single cardinality the baseType must be
 * one of string, integer or float; if it has record cardinality the permitted fields are 'stringValue',
 * 'floatValue', etc.
 */
import { store } from '@/store/store'
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiParseException from '@/components/qti/exceptions/QtiParseException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import TextEntryPresentationFactory from '@/components/qti/interactions/presentation/TextEntryInteractionPresentationFactory'
import { getTextEntryInteractionSubType, textEntryInteractionAdapter } from './adapters/textentry-interaction-adapter'

const qtiAttributeValidation = new QtiAttributeValidation()

export default {
  name: 'QtiTextEntryInteraction',

  props: {
    responseIdentifier: {
      required: true,
      type: String
    },
    /*
     * The expectedLength characteristic provides a hint to the candidate as to the expected overall
     * length of the desired response measured in number of characters. A Delivery Engine should use
     * the value of this attribute to set the size of the response box, where applicable. This is not a
     * validity constraint.
     */
    expectedLength: {
      required: false,
      type: String
    },
    /*
     * If given, the pattern mask specifies a regular expression that the candidate's response must match
     * in order to be considered valid. The regular expression language used is defined in Appendix F of [XSCHEMA2, 01].
     * Care is needed to ensure that the format of the required input is clear to the candidate, especially when
     * validity checking of responses is required for progression through a test. This could be done by providing an
     * illustrative sample response in the prompt, for example.
     */
    patternMask: {
      required: false,
      type: String
    },
    /*
     * In visual environments, string interactions are typically represented by empty boxes into which the candidate
     * writes or types. However, in speech based environments it is helpful to have some placeholder text that can be
     * used to vocalize the interaction. Delivery engines should use the value of this attribute (if provided) instead
     * of their default placeholder text when this is required. Implementors should be aware of the issues concerning
     * the use of default values described in the section on Response Variables.
     */
    placeholderText: {
      required: false,
      type: String
    },
    /*
     * Used to control the format of the text entered by the candidate. This characteristic affects the way the value
     * of the associated response variable should be interpreted by response processing engines and also controls the
     * way it should be captured in the delivery engine.
     */
    format: {
      required: false,
      type: String,
      default: ''
    },
    /*
     * Override delivery platform's default patternMask error message.
     */
    dataPatternmaskMessage: {
      required: false,
      type: String
    },
    /*
     * Override delivery platform's default maxlength
     */
    dataMaxlength: {
      required: false,
      type: String
    },
    /*
     * Override delivery platform's default spellcheck attribute
     */
     dataSpellcheck: {
       required: false,
       type: String
     }
  },

  computed: {

    /**
     * @description Compute a template/component according to the interactionSubType.
     */
    interactionTemplate () {
      return textEntryInteractionAdapter(this.interactionSubType, this.createComponentProperties(), this.$attrs)
    },

    placeholder () {
      return qtiAttributeValidation.validatePlaceholderText(this.placeholderText, '')
    },

    hasPatternMask () {
      return (typeof this.patternMask !== 'undefined')
    },

    patternMaskMessage () {
      return qtiAttributeValidation.validatePatternmaskMessage(this.dataPatternmaskMessage, 'Invalid Input')
    },

    colorStyle () {
      const pnp = store.getItemContextPnp()
      return pnp.getColorStyle()
    },

    computeMaxlength () {
      return (typeof this.dataMaxlength !== 'undefined') ? this.dataMaxlength : 500
    },

    computeSpellcheck () {
      return (typeof this.dataSpellcheck !== 'undefined') ? this.dataSpellcheck : false
    }
  },

  data() {
    return {
      response: '',
      state: null,
      baseType: 'string',
      cardinality: 'single',
      interactionSubType: null,
      isValidResponse: false,
      invalidResponseMessage: 'Input Required',
      classAttribute: '',
      isDisabled: false,
      isQtiValid: true,
      presentationFactory: null,
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

  inheritAttrs: false,

  methods: {

    /**
     * @description Get this interaction's response.
     * @return {String} response string or null
     */
    getResponse () {
      if (this.response.length === 0) return null

      return this.response
    },

    /**
     * @description Set this interaction's response
     * @param {String} response - string
     */
    setResponse (response) {
      if (response === null)
        this.response = ''
      else
        this.response = response

      this.node.setResponse(this.response, true)
    },

    updateResponse (response) {
      if (response === null)
        this.response = ''
      else
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

    setInteractionSubType (interactionSubType) {
      this.interactionSubType = interactionSubType
    },

    getInteractionSubType () {
      return this.interactionSubType
    },

    disable () {
      this.toggleDisable(true)
    },

    enable () {
      this.toggleDisable(false)
    },

    /**
     * @description Utility method to disable/enable this interaction.
     * @param {Boolean} isDisabled 
     */
    toggleDisable (isDisabled) {
      this.isDisabled = isDisabled
      this.node.setIsDisabled(isDisabled)
    },

    /**
     * @description Get this interaction's invalid response message.
     * @return {String} invalidResponseMessage
     */
    getInvalidResponseMessage () {
      return this.invalidResponseMessage
    },

    initializeValue () {
      this.setResponse(null)
      this.setState(this.computeState())
      this.setIsValid(false)
    },

    resetValue () {
      console.log('[ResetValue][identifier]', this.responseIdentifier)
      this.setResponse(null)
      this.setState(this.computeState())
      this.setIsValid(false)
    },

    /**
     * @description Restores this interaction's response.  Also
     * restores this interaction's response validity.
     * @param {Object} state
     * When not null, has this schema:
     * {
     *   identifier: [String],
     *   value: [String]
     *   state: {
     *   }
     * }
     */
    restoreValue (state) {
      this.setResponse(state.value)
      this.setState(state.state)
      this.updateValidity(this.computeIsValid())
    },

    /**
     * @description Computes this interaction's cardinality - which MUST be 'single'
     * @return {String} - cardinality 'single'
     */
    getCardinality () {
      return this.cardinality
    },

    /**
     * @description For now, return an object with raw/rich text properties.
     * @return {Object} state object
     */
    computeState () {
      const state = {}
      return state
    },

    /**
     * @description The determines an interaction's validity status.
     * @return {Boolean} (true if valid, false if invalid)
     */
    computeIsValid () {
      // A null response is invalid
      if (this.response === null) return false

      // An empty string is invalid
      if (this.response.length < 1) return false

      // text entry interaction with a non-null response is valid
      return true
    },

    /**
     * @description Evaluate the interaction's response validity.
     * Update the interaction's validity if there is a change.
     */
    evaluateValidity () {
      // Save old validity value
      const priorValidity = this.getIsValid()
      // Compute new validity value
      const currentValidity = this.computeIsValid()
      // Bail if no change
      if (priorValidity === currentValidity) return
      // There is a change.
      this.updateValidity(currentValidity)
    },

    /**
     * @description Update the interaction's validity.
     * @param {Boolean} isValid
     */
    updateValidity (isValid) {
      this.setIsValid(isValid)
      // Notify store that we have a change in validity
      store.setInteractionIsValidResponse({
          identifier: this.responseIdentifier,
          isValidResponse: isValid
        })
    },

    /**
     * @description attempt to parse the interaction component
     * from the staticClass property of this $vnode.
     * @param staticClass property of the $vnode.data object
     * @param format
     */
    detectInteractionSubType (staticClass) {
      return getTextEntryInteractionSubType(staticClass)
    },

    createComponentProperties () {
      // Create default properties
      const properties = {
        responseIdentifier: this.responseIdentifier,
        placeholder: this.placeholder,
        patternMask: this.patternMask,
        patternMaskMessage: this.patternMaskMessage,
        spellcheck: this.computeSpellcheck,
        maxlength: this.computeMaxlength,
        widthClass: this.presentationFactory.getWidthClass(),
        verticalMaxlength: this.presentationFactory.getVerticalMaxLength(),
        format: this.format
      }

      return properties
    },

    handleTextEntryUpdate (data) {
      this.updateResponse(data.response)
      // Update validity
      this.evaluateValidity()
    },

    handleTextEntryReady (interaction) {
      // This gives us a handle on the sub-component's methods
      this.node = interaction.node

      if (this.priorState === null)
        this.initializeValue()
      else
        this.restoreValue(this.priorState)
    },

    /**
     * @description Retrieve this interaction's prior state.
     * When not null, has this schema:
     * {
     *   identifier: [String],
     *   value: [String]
     *   state: {
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
        throw new QtiEvaluationException('Text Entry Interaction State Invalid.  "value" property not found.')
      }
      if (!('state' in priorState)) {
        throw new QtiEvaluationException('Text Entry Interaction State Invalid.  "state" property not found.')
      }

      return priorState
    }
  },

  created () {
    try {
      this.responseDeclaration = qtiAttributeValidation.validateResponseIdentifierAttribute(store, this.responseIdentifier)
      this.setInteractionSubType(this.detectInteractionSubType(this.$vnode.data.staticClass))
      
      // Set up a presentation factory
      this.presentationFactory = new TextEntryPresentationFactory(this.$vnode.data.staticClass)

      // Pull any prior interaction state.
      this.priorState = this.getPriorState(this.responseIdentifier)

      this.cardinality = this.getCardinality()
      this.appliedRegex = qtiAttributeValidation.validatePattern('pattern-mask', this.patternMask)
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
            interactionType: 'TextEntry',
            node: this,
            resetValue: this.resetValue,
            isValidResponse: this.isValidResponse,
            invalidResponseMessage: this.getInvalidResponseMessage(),
          })

        console.log('[' + this.$options.name + '][Identifier]', this.responseIdentifier)
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
