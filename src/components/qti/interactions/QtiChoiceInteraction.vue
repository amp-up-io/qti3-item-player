<template>
  <div ref="root" class="qti-choice-interaction">

    <slot name="prompt" />

    <ChoiceGroup
      ref="choicegroup"
      :cardinality="cardinality"
      :shuffle="shuffle"
      :responseIdentifier="responseIdentifier"
      :maxChoices="maxChoices"
      :minChoices="minChoices"
      @choiceGroupReady="handleChoiceGroupReady"
      @setChecked="handleSetChecked"
      @setFocusNextChoice="handleSetFocusNextChoice"
      @setFocusPreviousChoice="handleSetFocusPreviousChoice"
      @setActiveDescendant="handleSetActiveDescendant"
      v-bind="$attrs">
      <slot name="default" />
    </ChoiceGroup>

  </div>
</template>

<script>
import Vue from 'vue'
import { store } from '@/store/store'
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiParseException from '@/components/qti/exceptions/QtiParseException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiPrompt from '@/components/qti/interactions/QtiPrompt'
import QtiSimpleChoice from '@/components/qti/interactions/QtiSimpleChoice'
import ChoiceGroup from '@/components/qti/interactions/ChoiceGroup'

Vue.component('qti-prompt', QtiPrompt)
Vue.component('qti-simple-choice', QtiSimpleChoice)
Vue.component('ChoiceGroup', ChoiceGroup)

const qtiAttributeValidation = new QtiAttributeValidation()

export default {
  name: 'QtiChoiceInteraction',

  props: {
    responseIdentifier: {
      required: true,
      type: String
    },
    minChoices: {
      required: false,
      type: String,
      default: '0'
    },
    maxChoices: {
      required: false,
      type: String,
      default: '1'
    },
    /*
     * If the shuffle characteristic is true then the delivery engine must randomize the order in which
     * the choices are initially presented, subject to the value of the fixed attribute of each choice.
     */
    shuffle: {
      required: false,
      type: String,
      default: 'false'
    },
    orientation: {
      required: false,
      type: String
    },
    dataMaxSelectionsMessage: {
      required: false,
      type: String
    },
    dataMinSelectionsMessage: {
      required: false,
      type: String
    }
  },

  inheritAttrs: false,

  data () {
    return {
      response: null,
      state: null,
      isValidResponse: false,
      cardinality: 'single',
      minSelectionsMessage: '',
      maxSelectionsMessage: '',
      responseDeclaration: null,
      choices: [],
      firstChoice: null,
      lastChoice: null,
      currentChoice: null,
      isRadio: true,
      isShuffle: false,
      isDisabled: false,
      isQtiValid: true,
      // If we are restoring, this is where we save the prior variable state
      priorState: null
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

    disable () {
      this.toggleDisableChoices (true)
    },

    enable () {
      this.toggleDisableChoices (false)
    },

    /**
     * @description Utility method to disable/enable this interaction's choices.
     * @param {Boolean} isDisabled 
     */
    toggleDisableChoices (isDisabled) {
      this.isDisabled = isDisabled
      this.choices.forEach((choice) => {
        choice.setIsDisabled(isDisabled)
      })
    },

    /**
     * @description Get this interaction's invalid response message.
     * @return {String} minSelectionsMessage or custom message
     */
    getInvalidResponseMessage () {
      return this.minSelectionsMessage
    },

    /**
     * @description Reset this interaction's response and UI.
     */
    resetValue () {
      console.log('[ResetValue][identifier]', this.responseIdentifier)

      // Uncheck all choices
      this.choices.forEach((choice) => {
        choice.setChecked(false)
        if (this.isRadio) {
          choice.setTabIndex('-1')
        }
      })

      this.currentChoice = null

      // When a new template, smoke the priorState
      this.priorState = null

      // Call the ChoiceGroup component to rebuild the UI.
      // Upon completion, ChoiceGroup will trigger the choiceGroupReady event.
      this.$refs.choicegroup.resetGroupUI()
    },

    /**
     * @description Restores this interaction's response.  Also
     * restores this interaction's response validity.
     * @param {String or Array} response
     */
    restoreValue (response) {
      if (response === null) return

      if (this.isRadio) {
        // response is an identifier
        this.handleSetChecked({
            identifier: response,
            checked: "true"
          }, true)
      } else {
        // response is an array of identifiers
        response.forEach((identifier) => {
          this.handleSetChecked({
              identifier: identifier,
              checked: "true"
            }, true)
          }, this)
      }

      // When restoring, manually update validity
      this.updateValidity(this.computeIsValid())
    },

    /**
     * @description Computes this interaction's cardinality (single, multiple).
     * Side effect: sets the model's cardinality property.
     * @return {String} - cardinality 'single' or 'multiple'
     */
    getCardinality () {
      let rv = store.getResponseDeclaration(this.responseIdentifier)
      // Default to single if the response variable is not found
      this.cardinality = (typeof rv !== 'undefined' ? (rv.cardinality !== 'multiple' ? 'single' : 'multiple') : 'single')
      return this.cardinality
    },

    /**
     * @description Iterate through $slots. Finds the first (if any) qti-prompt component.
     * @param {Array} slots
     * @return {Array} prompt component(s)
     */
    getPrompt (slots) {
      let prompt = []

      if (!('default' in slots)) return prompt

      slots.default.forEach((vnode, index, defaultSlots) => {
        // Only check for qti-prompt, skipping text nodes.
        if (typeof vnode.componentOptions !== 'undefined') {
          if (vnode.componentOptions.tag === 'qti-prompt') {
            prompt.push(vnode)
            defaultSlots.splice(index, 1)
            return // bail out of loop
          }
        }
      })

      return prompt
    },

    /**
     * @description Implements checked behavior on radio button and checkbox groups.
     * @param {Component} choice - the choice that is being checked/unchecked.
     * @param {Boolean} restoring - boolean set to true when restoring
     */
    handleSetChecked (choice, restoring=false) {
      this.choices.forEach((simpleChoice) => {
        // Single cardinality: turn off all radio buttons
        if (this.isRadio) {
          simpleChoice.setChecked(false)
          simpleChoice.setTabIndex('-1')
        }
        // Set currentItem to our choice to be checked (or unchecked)
        if (simpleChoice.identifier === choice.identifier) {
          this.currentChoice = simpleChoice
        }
      })
      if (choice.checked === 'true') {

        // Only permit checking if we have not exceeded maxChoices
        if (!this.checkMaxChoicesLimit()) {
          this.currentChoice.setChecked(true)
        } else {
          this.currentChoice.setChecked(false)
        }

      } else {
        this.currentChoice.setChecked(false)
      }

      if (!restoring) {
        // Update the response to reflect the current checked state of the choices
        this.setResponse(this.computeResponse())
        // Focus the choice if we are not restoring.
        this.currentChoice.setFocus()
        // Update validity
        this.evaluateValidity()
      }

      this.currentChoice.setTabIndex('0')
    },

    /**
     * @description Find the previous radio choice.  If we are already on the first choice
     * then circle back around to the last choice.
     * @param {String} identifier - the identifier of the choice that currently has the focus
     */
    handleSetFocusPreviousChoice (identifier) {
      if (this.isRadio) {
        this.removeChoiceFromTabOrder(identifier)
      }
      this.setFocusChoice(this.findPreviousIdentifier(identifier))
    },

    /**
     * @description Find the next radio choice.  If we are already on the last choice
     * then circle back around to the first choice.
     * @param {String} identifier - the identifier of the choice that currently has the focus.
     */
    handleSetFocusNextChoice (identifier) {
      if (this.isRadio) {
        this.removeChoiceFromTabOrder(identifier)
      }
      this.setFocusChoice(this.findNextIdentifier(identifier))
    },

    /**
     * @description For accessibility, set the choice group's activedescendant.
     * @param {String} id - the id of the active descendant.
     */
    handleSetActiveDescendant (id) {
      this.$refs.choicegroup.setActiveDescendant(id)
    },

    /**
     * @description Focus a choice identified by the identifier parameter.
     * Also includes the focused choice in the tab order.
     * @param {String} identifier
     */
    setFocusChoice (identifier) {
      for (let index = 0; index < this.choices.length; index++) {
        if (this.choices[index].identifier === identifier) {
          this.currentChoice = this.choices[index]
        }
      }
      this.currentChoice.setTabIndex('0')
      this.currentChoice.setFocus()
    },

    /**
     * @description Take the choice specified by the
     * identifier param out of the tab order.
     * @param {String} identifier
     */
    removeChoiceFromTabOrder (identifier) {
      for (let index = 0; index < this.choices.length; index++) {
        if (this.choices[index].identifier === identifier) {
          this.choices[index].setTabIndex(-1)
          break
        }
      }
    },

    /**
     * @description Utility method to find the previous choice's identifier.
     * @param {String} identifier
     */
    findPreviousIdentifier (identifier) {
      if (identifier === this.firstChoice.identifier) {
        return this.lastChoice.identifier
      }
      for (let index = 0; index < this.choices.length; index++) {
        if (this.choices[index].identifier === identifier) {
          return this.choices[index - 1].identifier
        }
      }
      return null
    },

    /**
     * @description Utility method to find the next choice's identifier.
     * @param {String} identifier
     */
    findNextIdentifier (identifier) {
      if (identifier === this.lastChoice.identifier) {
        return this.firstChoice.identifier
      }
      for (let index = 0; index < this.choices.length; index++) {
        if (this.choices[index].identifier === identifier) {
          return this.choices[index + 1].identifier
        }
      }
      return null
    },

    /**
     * @description Handler called by ChoiceGroup component.
     * @param {Object} config - an object containing all choice components
     *                          nested within the ChoiceGroup.
     */
    handleChoiceGroupReady (config) {
      this.choices = config.choices
      this.firstChoice = config.firstChoice
      this.lastChoice = config.lastChoice

      if (this.isRadio) {
        this.firstChoice.setTabIndex('0')
      }

      if (this.priorState !== null) {
        this.restoreValue(this.priorState.value)
      }

      this.setResponse(this.computeResponse())
      this.setState(this.computeState())
      this.setIsValid(this.computeIsValid())
    },

    /**
     * @description Build a response from the array of choices.
     * Single Cardinality: response is an identifier string
     * Multiple Cardinality: response is an array of identifier strings
     * @return {String or Array} response
     */
    computeResponse () {
      let response = this.isRadio ? null : []

      this.choices.forEach((simpleChoice) => {
        if (simpleChoice.isChecked()) {
          if (this.isRadio) {
            response = simpleChoice.identifier
          } else {
            response.push(simpleChoice.identifier)
          }
        }
      })

      // Single Cardinality
      if (this.isRadio) return response

      // Multiple Cardinality
      return (response.length === 0) ? null : response
    },

    /**
     * @description For a choice interaction, the most important part of state
     * is the order of the choices.  Compute the order and save it in an
     * order property.
     * @return {Object} state object
     */
    computeState () {
      const state = {}

      let order = []
      this.choices.forEach((choice) => {
        order.push(choice.identifier)
      })
      state.order = order

      return state
    },

    /**
     * @description The determines an interaction's validity status based
     * on the min-choices attribute.
     * @return {Boolean} (true if valid, false if invalid)
     */
    computeIsValid () {
      // If minChoices is 0, there are no constraints
      if ((this.minChoices*1) === 0) return true

      // MinChoices is > 0.  There are constraints.

      // A null response is invalid
      if (this.response === null) return false

      // A single cardinality interaction with a non-null response is valid
      if (this.cardinality === 'single') return true

      // A multiple cardinality interaction that is non-null must have at least
      // minChoices selections in order to be valid
      if ((this.cardinality === 'multiple') && (this.response.length >= (this.minChoices*1))) return true

      // Must be invalid
      return false
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
      store.setInteractionIsValidResponse({
          identifier: this.responseIdentifier,
          isValidResponse: isValid
        })
    },

    /**
     * @description This method should be called prior to setting checked=true on a choice.
     * @return {Boolean} (true if exceeding max-choices, false if not)
     */
    checkMaxChoicesLimit () {
      // max-choices = 0 means no limit.
      // On Radio Groups there should always be at most 1 choice.
      if ((this.isRadio) || (this.maxChoices == 0)) return false

      // Should only get to this code on a multiple cardinality ChoiceGroup.
      // In this case, response should be an array of identifier strings.
      const response = this.getResponse()
      if ((response !== null) && (response.length == this.maxChoices)) {
        store.NotifyInteractionSelectionsLimit(this.maxSelectionsMessage)
        return true
      }

      return false
    },

    computeMaxSelectionsMessage () {
      if (typeof this.dataMaxSelectionsMessage !== 'undefined') {
        this.maxSelectionsMessage = this.dataMaxSelectionsMessage
        return
      }
      this.maxSelectionsMessage = (this.maxChoices == 0) ? '' : 'You are permitted a maximum of ' + this.maxChoices + ' choice' + (this.maxChoices > 1 ? 's' : '') + ' for this question.<br/><br/>Please unselect one of your choices before making another choice.'
    },

    computeMinSelectionsMessage () {
      if (typeof this.dataMinSelectionsMessage !== 'undefined') {
        this.minSelectionsMessage = this.dataMinSelectionsMessage
        return
      }
      this.minSelectionsMessage = (this.minChoices == 0) ? '' : 'You must make at least ' + this.minChoices + ' choice' + (this.minChoices > 1 ? 's' : '') + ' for this question.'
    },

    /**
     * @description Retrieve this interaction's prior state.
     * When not null, has this schema:
     * {
     *   identifier: [String],
     *   value: [String or Array]
     *   state: {
     *     order: [Array of Strings]
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
        throw new QtiEvaluationException('Choice Interaction State Invalid.  "value" property not found.')
      }
      if (!('state' in priorState)) {
        throw new QtiEvaluationException('Choice Interaction State Invalid.  "state" property not found.')
      }
      if (!('order' in priorState.state)) {
        throw new QtiEvaluationException('Choice Interaction State Invalid.  "order" property not found.')
      }

      return priorState
    },

    showSolution (correctResponse) {
      // Bail if there is no correct response
      if (correctResponse === null) return
      
      if (this.isRadio) {
        this.choices.forEach((choice) => {
          this.setChoiceSolution(choice, correctResponse)
        }, this)
        return
      }

      // Checkboxes
      this.choices.forEach((choice) => {
          const identifier = 
            this.findIdentifierInCorrectResponse(choice.identifier, correctResponse)
          this.setChoiceSolution(choice, identifier)
        }, this)
    },

    setChoiceSolution (choice, identifier) {
      if (choice.isChecked()) {
        if (choice.identifier === identifier)
          choice.setCorrectSolution()
        else
          choice.setIncorrectSolution()
      } else {
        if (choice.identifier === identifier)
          choice.setExpectedSolution()
        else
          choice.setIgnoreSolution()            
      }
    },

    /**
     * @description Examine the correctResponse array.  Return the matching
     * identifier or null if not found.
     * @param {String} identifier 
     * @param {Array} correctResponse 
     * @return {String} identifier or null
     */
    findIdentifierInCorrectResponse (identifier, correctResponse) {
      for (let i=0; i<correctResponse.length; i++) {
        if (identifier === correctResponse[i]) return identifier
      }
      return null
    }
  },

  created () {
    try {
      this.responseDeclaration = qtiAttributeValidation.validateResponseIdentifierAttribute(store, this.responseIdentifier)

      // Pull any prior interaction state.
      this.priorState = this.getPriorState(this.responseIdentifier)

      qtiAttributeValidation.validateMaxMinChoices(this.maxChoices, this.minChoices)
      this.cardinality = this.getCardinality()
      this.isRadio = (this.cardinality !== 'multiple')
      this.isShuffle = (this.shuffle === 'true' ? true : false)
      this.$slots.prompt = this.getPrompt(this.$slots)
      this.computeMinSelectionsMessage()
      this.computeMaxSelectionsMessage()
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

        // Notify store of our new interaction
        store.defineInteraction({
            identifier: this.responseIdentifier,
            interactionType: 'Choice',
            node: this,
            resetValue: this.resetValue,
            isValidResponse: this.getIsValid(),
            invalidResponseMessage: this.getInvalidResponseMessage(),
            maxSelectionsMessage: this.maxSelectionsMessage
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
