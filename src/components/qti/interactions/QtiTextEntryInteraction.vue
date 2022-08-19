<template>
  <span ref="root" class="qti-text-entry-interaction">
    <input
      ref="input"
      class="text-entry-input"
      v-bind="$attrs"
      v-model="response"
      type="text"
      :placeholder="placeholder"
      autocapitalize="none"
      :spellcheck="computeSpellcheck"
      :maxlength="computeMaxlength"
      v-on:input="handleInput($event)"
    />
    <tooltip
      ref="tooltip"
      v-if="hasPatternMask"
      :target="() => $refs['input']"
      :message="patternMaskMessage"
      :color-style="colorStyle"
    />
  </span>
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
import Tooltip from '@/shared/components/Tooltip'

const qtiAttributeValidation = new QtiAttributeValidation()

export default {
  name: 'QtiTextEntryInteraction',

  components: {
    Tooltip
  },

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
      // Used for reverting to the prior response when a patternMask is applied
      priorResponse: '',
      state: null,
      baseType: 'string',
      cardinality: 'single',
      isValidResponse: false,
      invalidResponseMessage: 'Input Required',
      // Save provided patternMask as a Regex here
      appliedRegex: null,
      // Used to toggle the patternMask message tooltip
      displayMessage: false,
      isQtiValid: true,
      // If we are restoring, this is where we save the prior variable state
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
      if (response === null) {
        this.response = ''
        return
      }

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
     * @description For textEntryInteraction with no patternMask, the maxlength
     * attribute (500) on the Input element is the only gatekeeper.
     * If a patternMask exists (appliedRegex is not null), use it to enforce the desired input.
     */
    handleInput (event) {
      event.preventDefault()
      if (this.appliedRegex !== null)
        this.applyPatternMask(this.$refs.input.value)
      else
        this.setResponse(this.$refs.input.value)

      // Update validity
      this.evaluateValidity()
    },

    applyPatternMask (value) {
      if (this.appliedRegex.test(value)) {
        // Pattern mask succeeded.  Update the response
        // and the new priorResponse.
        this.setResponse(value)
        this.priorResponse = value
        return
      }

      // Pattern mask failed.  Display the message and revert the
      // control to the priorResponse.
      this.showPatternMaskMessage()
      this.setResponse(this.priorResponse)
      this.$refs.input.value = this.priorResponse
    },

    showPatternMaskMessage () {
      this.$refs.tooltip.show()
      this.hidePatternMaskMessage()
    },

    hidePatternMaskMessage (timeout=3000) {
      setTimeout(() => {
          this.$refs.tooltip.hide()
        }, timeout)
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
input[type="text"] {
  margin: 0;
  vertical-align:inherit;
  padding: 0 .3rem;
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.6rem;
  height: calc(1.5em + .35rem);
  color: var(--foreground);
  width: 8.6rem;
  background-color: var(--background);
  background-clip: padding-box;
  border-width: 1px;
  border-color: var(--choice-control-focus-border);
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  border-radius: .25rem;
  transition: border-color .15s ease-in-out,box-shadow .15s ease-in-out;
}

input[type="text"]:focus {
  color: var(--foreground);
  background-color: var(--background);
  border-color: var(--choice-control-focus-border);
  outline: 0;
  box-shadow: var(--choice-control-focus-shadow);
}

input[type="text"]::placeholder {
  color: var(--foreground);
  opacity: 0.6;
  font-style: italic;
}

.qti-text-entry-interaction.qti-align-center input {
  text-align: center;
}

.qti-text-entry-interaction.qti-align-left input {
  text-align: left;
}

.qti-text-entry-interaction.qti-align-right input {
  text-align: right;
}

.qti-input-width-1 .text-entry-input {
  width: 1.7rem;
}

.qti-input-width-2 .text-entry-input {
  width: 2.7rem;
}

.qti-input-width-3 .text-entry-input {
  width: 3.7rem;
}

.qti-input-width-4 .text-entry-input {
  width: 4.7rem;
}
.qti-input-width-5 .text-entry-input {
  width: 5.6rem;
}

.qti-input-width-6 .text-entry-input {
  width: 6.6rem;
}

.qti-input-width-10 .text-entry-input {
  width: 10.4rem;
}

.qti-input-width-15 .text-entry-input {
  width: 15.2rem;
}

.qti-input-width-20 .text-entry-input {
  width: 20.0rem;
}

.qti-input-width-25 .text-entry-input {
  width: 25.0rem;
}

.qti-input-width-30 .text-entry-input {
  width: 30.0rem;
}

.qti-input-width-35 .text-entry-input {
  width: 35.0rem;
}

.qti-input-width-40 .text-entry-input {
  width: 40.0rem;
}

.qti-input-width-45 .text-entry-input {
  width: 45.0rem;
}

.qti-input-width-50 .text-entry-input {
  width: 50.0rem;
}

.qti-input-width-72 .text-entry-input {
  width: 100%;
}
</style>
