<template>
  <div class="qti-custom-interaction">
    <component
      :is="customInteractionTemplate"
      v-on:customInteractionUpdate="handleCustomInteractionUpdate"
      v-on:customInteractionReady="handleCustomInteractionReady">
      <slot></slot>
    </component>
  </div>
</template>

<script>
/**
 * The qti-custom-interaction provides an opportunity for extensibility of this specification 
 * to include support for interactions not currently built into QTI 3.
 *
 * Supported Custom Interactions:
 * amp:likert-numeric - This serves as a (hopefully) useful example implementation.
 * 
 *    <qti-custom-interaction class="amp:likert-numeric" response-identifier="RESPONSE">
 *      <custom-option><![CDATA[{
 *        "initialValue": 50,
 *        "min": 0,
 *        "max": 100,
 *        "step": 1,
 *        "invalidResponseMessage": "You must make a selection"
 *       }]]></custom-option>
 *    </qti-custom-interaction>
 * 
 */
import { store } from '@/store/store'
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiParseException from '@/components/qti/exceptions/QtiParseException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import { getCustomInteractionSubType, customInteractionAdapter } from '@/components/qti/interactions/adapters/custom-interaction-adapter'

const qtiAttributeValidation = new QtiAttributeValidation()

export default {
  name: 'QtiCustomInteraction',

  props: {
    responseIdentifier: {
      required: true,
      type: String
    }
  },

  inheritAttrs: false,

  data() {
    return {
      response: null,
      state: null,
      baseType: null,
      cardinality: null,
      responseDeclaration: null,
      interactionSubType: '',
      isValidResponse: false,
      invalidResponseMessage: 'Input Required',
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
     * @description Compute a template - according to the interactionSubType.
     */
    customInteractionTemplate () {
      return customInteractionAdapter(
          this.interactionSubType, 
          { responseIdentifier: this.responseIdentifier },
          this.$attrs)
    }
  },

  methods: {

    /**
     * Method used by an item controller to get this interaction's response.
     * @return {*} response
     */
    getResponse () {
      return this.response
    },

    /**
     * @description Method used by an item controller to set/restore this interaction's response.
     * @param - response
     */
    setResponse (response) {
      this.response = response
      this.node.setResponse(response)
    },

    /**
     * @description Set response without calling the node's setResponse method.
     * @param response
     */
    updateResponse (response) {
      this.response = response
    },

    /**
     * @description Method used by an item controller to get this 
     * interaction's state.
     * @return {Object} state
     */
    getState () {
      this.state = this.node.getState()
      return this.state
    },

    /**
     * @description Method used by an item controller to set/restore this 
     * interaction's state.
     * @param - state (object)
     */
    setState (state) {
      this.state = state
      this.node.setState(state)
    },

    /**
     * @description - In QTI, response "validity" refers to Has candidate achieved 
     * required answeredness on this interaction
     * @return {Boolean} (true if valid, false if invalid)
     */
    getIsValid () {
      return this.isValidResponse
    },

    setIsValid (isValid) {
      this.isValidResponse = isValid
    },

    getBaseType () {
      return this.baseType
    },

    setBaseType (baseType) {
      this.baseType = baseType
    },

    getCardinality () {
      return this.cardinality
    },

    setCardinality (cardinality) {
      this.cardinality = cardinality
    },

    /**
     * @description The determines an interaction's validity status.
     * @return {Boolean} (true if valid, false if invalid)
     */
    computeIsValid () {
      // A null response is invalid
      if (this.response === null) return false

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
     * @description Get this interaction's invalid response message.
     * @return {String} invalidResponseMessage
     */
    getInvalidResponseMessage () {
      return this.invalidResponseMessage
    },

    /**
     * @description Disable the interaction.
     */
    disable () {
      if (this.node === null) return
      this.node.disable()      
    },

    /**
     * @description Enable the interaction.
     */
    enable () {
      if (this.node === null) return
      this.node.enable()
    },

    /**
     * @description Method to initialize the interaction's response/state/validity.
     * 
     * TODO: If the response variable has a defined <qti-default-value>, use that 
     * value instead of always setting the response to null.
     */
    initializeValue () {
      this.setResponse(null)
      this.setState(null)
      this.setIsValid(false)
    },

    /**
     * @description This method is required on every interaction.  Typically,
     * this is called when generating a new template.
     */
    resetValue () {
      console.log('[ResetValue][identifier]', this.responseIdentifier)
      this.node.resetValue()
    },

    /**
     * @description Restores this interaction's response.  Also
     * restores this interaction's response validity.
     * @param {Object} state
     * When not null, has this schema:
     * {
     *   identifier: [String],
     *   value: [String] or [Object]
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
     * @description attempt to parse the interaction component
     * from the staticClass property of this $vnode.
     * Throws an exception if none found.
     * @param staticClass property of the $vnode.data object
     */
    detectInteractionSubType (staticClass) {
      if ((typeof staticClass === 'undefined') || 
          (staticClass === null) ||
          (staticClass.length == 0)) {
        return null
      }
      return getCustomInteractionSubType(staticClass)
    },

    /**
     * @description Handler for when the downstream component has an update.
     * @param {Object} data
     */
    handleCustomInteractionUpdate (data) {
      this.updateResponse(data.response)
      // Update validity
      this.evaluateValidity()
    },

    /**
     * @description Handler for when the downstream component has loaded and
     * initialized itself.  The component passes itself in the "node" property
     * of the interaction parameter.
     * @param {Object} interaction
     */
    handleCustomInteractionReady (interaction) {
      this.setBaseType(interaction.baseType)
      this.setCardinality(interaction.cardinality)
      // This gives us a handle on the custom interaction's methods
      this.node = interaction.node

      // This is the right time to initialize the response/state of the
      // underlying custom interaction component.
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
     *   value: response identifier basetype and cardinality
     *   state: null or Object
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
        throw new QtiEvaluationException('Custom Interaction Value Invalid.  "value" property not found.')
      }
      if (!('state' in priorState)) {
        throw new QtiEvaluationException('Custom Interaction State Invalid.  "state" property not found.')
      }

      return priorState
    }

  },

  created () {
    try {
      this.responseDeclaration = qtiAttributeValidation.validateResponseIdentifierAttribute(store, this.responseIdentifier)
      this.interactionSubType = this.detectInteractionSubType(this.$vnode.data.staticClass)
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

        // Notify store of our new component
        store.defineInteraction({
            identifier: this.responseIdentifier,
            interactionType: 'CustomInteraction',
            interactionSubType: this.interactionSubType,
            node: this,
            resetValue: this.resetValue,
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
