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
      :priorState="priorState"
      v-on:choiceGroupReady="handleChoiceGroupReady"
      v-on:setChecked="handleSetChecked"
      v-on:setFocusNextChoice="handleSetFocusNextChoice"
      v-on:setFocusPreviousChoice="handleSetFocusPreviousChoice"
      v-on:setActiveDescendant="handleSetActiveDescendant"
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
      isQtiValid: true,
      // If we are restoring, this is where we save the prior variable state
      priorState: null
    }
  },

  methods: {

    /**
     * Method used by an item controller to get this interaction's response.
     * @return response (string or array) - depending on cardinality
     */
    getResponse () {
      console.log('[GetResponseMethod][' + this.responseIdentifier + ']', this.response)
      return this.response
    },

    /**
     * @description Set the interaction's response value
     * @param - response (string or array depending on cardinality) containing selected choice identifier(s).
     */
    setResponse (response) {
      console.log('[SetResponseMethod][' + this.responseIdentifier + ']', response)
      this.response = response
    },

    /**
     * Method used by an item controller to get this interaction's state.
     * @return state (object)
     */
    getState () {
      console.log('[GetState][identifier]', this.responseIdentifier)
      return this.state
    },

    /**
     * Method used by an item controller to set/restore this interaction's state.
     * @param - state (object)
     */
    setState (state) {
      console.log('[SetState][identifier]', this.responseIdentifier, state)
      this.state = state
    },

    /**
     * Has candidate achieved required answeredness on this interaction
     */
    getIsValid () {
      console.log('[GetIsValid][identifier]', this.responseIdentifier, this.isValidResponse)
      return this.isValidResponse
    },

    setIsValid (isValid) {
      console.log('[SetIsValid][identifier]', isValid)
      this.isValidResponse = isValid
    },

    resetValue () {
      console.log('[ResetValue][identifier]', this.responseIdentifier)
      this.choices.forEach((choice) => {
        choice.setChecked(false)
        if (this.isRadio) {
          choice.setTabIndex('-1')
        }
      })
      this.currentChoice = null
      this.setResponse(null)

      // Call the ChoiceGroup component to rebuild the UI
      this.$refs.choicegroup.processGroupUI()
    },

    restoreValue (response) {
      if (response === null) return

      if (this.isRadio) {
        // response is an identifier
        this.handleSetChecked({
            identifier: response,
            checked: "true"
          }, true)
        return
      }

      // response is an array of identifiers
      response.forEach((identifier) => {
        this.handleSetChecked({
            identifier: identifier,
            checked: "true"
          }, true)
      }, this)
    },

    /**
     * Handles computation of this interaction's cardinality.  Side effect: sets the
     * model's cardinality property.
     */
    getCardinality () {
      // single, multiple
      let rv = store.getResponseDeclaration(this.responseIdentifier)
      // Default to single if the response variable is not found
      this.cardinality = (typeof rv !== 'undefined' ? (rv.cardinality !== 'multiple' ? 'single' : 'multiple') : 'single')
      return this.cardinality
    },

    /**
     * Iterate through $slots. Find the first (if any) qti-prompt component.
     */
    getPrompt (slots) {
      let prompt = []

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
        this.response = this.computeResponse()
        // Notify parent of updated response
        this.notifyResponseChange()
        // Focus the choice if we are not restoring.
        this.currentChoice.setFocus()
      }

      this.currentChoice.setTabIndex('0')
    },

    /**
     * @description Find the previous radio choice.  If we are already on the first choice
     * then circle back around to the last choice.
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
     */
    handleSetFocusNextChoice (identifier) {
      if (this.isRadio) {
        this.removeChoiceFromTabOrder(identifier)
      }
      this.setFocusChoice(this.findNextIdentifier(identifier))
    },

    handleSetActiveDescendant (id) {
      this.$refs.choicegroup.setActiveDescendant(id)
    },

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
     * @param identifier string
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
     * @param - config - an object containing all choice components
     * nested within the ChoiceGroup.
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
      this.isValidResponse = false
    },

    /**
     * @description Build a response from the array of choices.
     * Single Cardinality: response is an identifier string
     * Multiple Cardinality: response is an array of identifier strings
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

      return response
    },

    /**
     * @description For a choice interaction, the most important part of state
     * is the order of the choices.  Compute the order and save it in an
     * order property.
     * @return state object
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
     * @description This method should be called prior to setting checked=true on a choice.
     */
    checkMaxChoicesLimit () {
      // max-choices = 0 means no limit.
      // On Radio Groups there should always be at most 1 choice.
      if ((this.isRadio) || (this.maxChoices == 0)) return false

      // Should only get to this code on a multiple cardinality ChoiceGroup.
      // In this case, response should be an array of identifier strings.
      const response = this.getResponse()
      if ((response !== null) && (response.length == this.maxChoices)) {
        this.notifyMaxChoicesLimit()
        return true
      }

      return false
    },

    notifyMaxChoicesLimit () {
      store.NotifyInteractionSelectionsLimit(this.maxSelectionsMessage)
    },

    notifyResponseChange () {
      // TODO: put this in the $store
      //this.$emit('notifyResponseChange', { response: this.response })
    },

    checkIsValidResponse () {
      let oldIsValidResponse = this.isValidResponse
      if (this.minChoices == 0) {
        this.isValidResponse = true
      } else if (this.response === null) {
        this.isValidResponse = false
      } else {
        if (this.cardinality === 'single') {
          this.isValidResponse = true
        } else if ((this.cardinality === 'multiple') && (this.response.length >= this.minChoices)) {
          this.isValidResponse = true
        } else {
          this.isValidResponse = false
        }
      }
      if (oldIsValidResponse != this.isValidResponse) {
        // Only notify store when we have a state change
        store.setInteractionIsValidResponse({
            identifier: this.responseIdentifier,
            isValidResponse: this.isValidResponse
          })
      }
    },

    computeMaxSelectionsMessage () {
      //this.maxSelectionsMessage = (typeof this.dataMaxSelectionsMessage !== 'undefined') ? this.dataMaxSelectionsMessage : this.$tc('interactions.choice.maxSelectionsMessage', this.maxChoices)
      this.maxSelectionsMessage = (typeof this.dataMaxSelectionsMessage !== 'undefined') ? this.dataMaxSelectionsMessage : 'You are permitted a maximum of ' + this.maxChoices + ' choice' + (this.maxChoices > 1 ? 's' : '') + ' for this question.<br/><br/>Please unselect one of your choices before making another choice.'
    },

    computeMinSelectionsMessage () {
      //this.minSelectionsMessage = (typeof this.dataMinSelectionsMessage !== 'undefined') ? this.dataMinSelectionsMessage : this.$tc('interactions.choice.minSelectionsMessage', this.minChoices)
      this.minSelectionsMessage = (typeof this.dataMinSelectionsMessage !== 'undefined') ? this.dataMinSelectionsMessage : 'You must make at least ' + this.minChoices + ' choice' + (this.minChoices > 1 ? 's' : '') + 'for this question.'
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
     * @param identifier - of a response variable
     */
    getPriorState (identifier) {
      const priorState = store.getItemContextStateVariable(identifier)

      // If priorState is null, we are not restoring anything
      if (priorState === null) return

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

      this.priorState = priorState
    }
  },

  created () {
    try {
      this.responseDeclaration = qtiAttributeValidation.validateResponseIdentifierAttribute(store, this.responseIdentifier)

      // Pull any prior interaction state.
      this.getPriorState(this.responseIdentifier)

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
            isValidResponse: this.isValidResponse,
            minSelectionsMessage: this.minSelectionsMessage,
            maxSelectionsMessage: this.maxSelectionsMessage
          })

        //this._checkIsValidResponse()
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
