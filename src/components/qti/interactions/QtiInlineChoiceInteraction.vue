<template>
  <div ref="root" class="qti-inline-choice-interaction">
    <div class="inline-choice-wrapper">
      <div ref="label" 
        class="inline-choice-select-label select-element-hidden">
        {{dataPrompt}}
      </div>
      <button ref="button"
        aria-haspopup="listbox"
        :aria-labelledby="buttonAriaLabelledbyId"
        :id="buttonId"
        class="inline-choice-select"
        @click="handleButtonClick"
        @keyup="handleButtonKeyup">
        <div ref="prompt" class="inline-choice-select-prompt">{{dataPrompt}}</div>
      </button>
      <ul ref="listbox"
        tabindex="-1"
        role="listbox"
        :aria-labelledby="labelId"
        class="inline-choice-select-listbox inline-choice-select-listbox-hidden"
        @blur="handleBlur"
        @focus="setupFocus"
        @keydown="checkKeyPress">
        <qti-inline-choice identifier="" fixed="true">{{dataPrompt}}</qti-inline-choice>
        <slot></slot>
      </ul>
    </div>
  </div>
</template>

<script>
/**
 * 	A qti-inline-choice-interaction is an inline interaction that presents the user with a set of choices, each
 * of which is a simple piece of text (which may be MathML). The candidate's task is to select one of the choices.
 * Unlike the qti-choice-interaction, the delivery engine must allow the candidate to review their choice within the
 * context of the surrounding text. The qti-inline-choice-interaction must be bound to a response variable with a
 * baseType of identifier and single cardinality only.
 */
import Vue from 'vue'
import { store } from '@/store/store'
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiParseException from '@/components/qti/exceptions/QtiParseException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import InlineChoicePresentationFactory from '@/components/qti/interactions/presentation/InlineChoiceInteractionPresentationFactory'
import QtiInlineChoice from '@/components/qti/interactions/QtiInlineChoice'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'

Vue.component('qti-inline-choice', QtiInlineChoice)

const qtiAttributeValidation = new QtiAttributeValidation()
const qtiProcessing = new QtiProcessing()

export default {
  name: 'QtiInlineChoiceInteraction',

  props: {
    responseIdentifier: {
      required: true,
      type: String
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
    /*
     * If 'true' then a choice must be selected by the candidate in order to form a valid response
     * to the interaction.
     */
    required: {
      required: false,
      type: String
    },
    /*
     * Custom text to be rendered by the delivery platform when the selection element is in an
     * unselected state.
     */
    dataPrompt: {
      required: false,
      type: String,
      default: 'Choose...'
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
    dataMinSelectionsMessage: {
      required: false,
      type: String
    }
  },

  computed: {
    labelId () {
      return 'inlinechoice_label_' + this.responseIdentifier
    },
    buttonId () {
      return 'inlinechoice_button_' + this.responseIdentifier
    },
    buttonAriaLabelledbyId () {
      return 'inlinechoice_label_' + this.responseIdentifier + ' inlinechoice_button_' + this.responseIdentifier
    },
    listboxId () {
      return 'inlinechoice_listbox_' + this.responseIdentifier
    },
    listboxAriaLabelledbyId () {
      return 'inlinechoice_label_' + this.responseIdentifier
    }
  },

  data() {
    return {
      response: null,
      state: null,
      isValidResponse: false,
      cardinality: 'single',
      minSelectionsMessage: '',
      choices: [],
      activeDescendant: null,
      keysSoFar: '',
      searchIndex: null,
      isShuffle: null,
      isDisabled: false,
      isQtiValid: true,
      presentationFactory: null,
      isOrientationVertical: false,
      // If we are restoring, this is where we save the prior variable state
      priorState: null
    }
  },

  inheritAttrs: false,

  methods: {

    /**
     * @description Get this interaction's response.
     * @return {String} response
     */
    getResponse () {
      return this.response
    },

    /**
     * @description Set this interaction's response
     * @param {String} response - string containing selected choice identifier.
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
     * @return {String} minSelectionsMessage or custom message
     */
    getInvalidResponseMessage () {
      return this.minSelectionsMessage
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

      if (isDisabled) {
        this.$refs.label.classList.remove('select-element-hidden')
        this.$refs.label.setAttribute('tabIndex', 0)
        this.$refs.button.classList.add('select-element-hidden')
        this.$refs.listbox.classList.add('inline-choice-select-listbox-hidden')
      } else {
        this.$refs.label.classList.add('select-element-hidden')
        this.$refs.label.setAttribute('tabIndex', -1)
        this.$refs.button.classList.remove('select-element-hidden')      
      }
    },

    /**
     * @description Reset this interaction's response and UI.
     */
    resetValue () {
      console.log('[ResetValue][identifier]', this.responseIdentifier)
      // Clear out any current UI state
      let options = this.$refs.listbox.querySelectorAll('[role="option"]')
      options.forEach((option) => {
          this.defocusOption(option)
        }, this)

      // Rebuild the UI
      this.processGroupUI()
    },

    /**
     * @description Restores this interaction's response.  Also
     * restores this interaction's response validity.
     * @param {String or Array} response
     */
    restoreValue (response) {
      if (response === null) return

      const option = this.findChoiceByIdentifier(response, this.choices)
      this.focusOption(option.$el, true)

      this.setResponse(this.computeResponse(response))
      this.updateValidity(this.computeIsValid())
    },

    /**
     * @description Computes this interaction's cardinality - which MUST be 'single'
     * Side effect: sets the model's cardinality property.
     * @return {String} - cardinality 'single'
     */
    getCardinality () {
      let rv = store.getResponseDeclaration(this.responseIdentifier)
      // Default to single if the response variable is not found
      if (typeof rv === 'undefined') this.cardinality = 'single'

      if (rv.cardinality !== 'single') {
        throw new QtiValidationException('Invalid qti-inline-choice-interaction Response Variable cardinality: "' + this.cardinality + '"')
      }

      this.cardinality = 'single'
      return this.cardinality
    },

    /**
     * @description Build a response from the array of choices.
     * Single Cardinality: response is an identifier string
     * @param {String} identifier - may be null, or empty string, or an identifier
     * @return {String} response
     */
    computeResponse (identifier) {
      if (identifier === null) return null
      if (identifier.length === 0) return null
      return identifier
    },

    /**
     * @description For an inline-choice interaction, the most important part of state
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
      store.setInteractionIsValidResponse({
          identifier: this.responseIdentifier,
          isValidResponse: isValid
        })
    },

    computeMinSelectionsMessage () {
      if (typeof this.dataMinSelectionsMessage !== 'undefined') {
        this.minSelectionsMessage = this.dataMinSelectionsMessage
        return
      }
      // If minChoices is 0 then there are no validity constraints.
      if ((this.minChoices*1) === 0) return
      // There are validity constraints.
      this.minSelectionsMessage = 'You must make at least 1 choice for this question.'
    },

    handleButtonClick () {
      if (this.isDisabled) return
      this.showListbox()
    },

    handleButtonKeyup (event) {
      switch (event.code) {
        case 'ArrowUp':
        case 'ArrowDown':
          event.preventDefault()
          if (this.isDisabled) return
          this.showListbox()
          break

        default:
          break
      }
    },

    /**
     * @description This binds a listener for an optionClicked event.
     * This event is actually a mousedown event in the inline choice component.
     */
    bindOptionMousedownHandler () {
      this.$on('optionMousedown', event => {
        this.handleOptionMousedown(event)
      }, this)
    },

    /**
     * @description Check if an option is mousedown'ed. If so, focus and select it.
     * @param event The mousedown event object
     */
    handleOptionMousedown (event) {
      let element = event.element
      // There should never be a case where role is not 'option', but check
      // it anyway.
      if (element.getAttribute('role') === 'option') {
        this.focusOption(element)
        this.hideListbox()
        this.$refs.button.focus()
      }
    },

    handleBlur () {
      this.hideListbox()
    },

    handleFocusChange (focusedOption) {
      this.$refs.prompt.innerHTML = focusedOption.innerHTML
      this.$refs.label.innerHTML = focusedOption.innerHTML
    },

    showListbox () {
      this.$refs.listbox.classList.remove('inline-choice-select-listbox-hidden')
      this.$refs.button.setAttribute('aria-expanded', 'true')
      // IMPORTANT: This fires the listbox focus handler: setupFocus
      this.$refs.listbox.focus()
    },

    hideListbox () {
      this.$refs.listbox.classList.add('inline-choice-select-listbox-hidden')
      this.$refs.button.removeAttribute('aria-expanded')
    },

    /**
     * @description If there is no activeDescendant, focus on the first option.
     */
    setupFocus () {
      if (this.activeDescendant) {
        return
      }
      this.focusFirstOption()
    },

    /**
     * @description Focus the first option
     */
    focusFirstOption () {
      let firstOption = this.$refs.listbox.querySelector('[role="option"]')

      if (firstOption) {
        this.focusOption(firstOption)
      }
    },

    /**
     * @description Focus the last option
     */
    focusLastOption () {
      let options = this.$refs.listbox.querySelectorAll('[role="option"]')

      if (options.length) {
        this.focusOption(options[options.length - 1])
      }
    },

    /**
     * @description Focus the specified option.  This sets the interaction's response as well.
     * @param {dom} option The option to focus
     */
    focusOption (option, restoring=false) {
      if (!restoring) {
        this.defocusOption(document.getElementById(this.activeDescendant))
      }

      option.setAttribute('aria-selected', 'true')
      option.classList.add('focused')
      this.setActiveDescendant(option.id)

      if (!restoring) {
        // Set response to this option's data-identifier.
        // Empty string identifier is null
        this.setResponse(this.computeResponse(option.getAttribute('data-identifier')))
        // Update validity
        this.evaluateValidity()

        // Scroll the listbox so the focused option is in view
        if (this.$refs.listbox.scrollHeight > this.$refs.listbox.clientHeight) {
          const scrollBottom = this.$refs.listbox.clientHeight + this.$refs.listbox.scrollTop
          const optionBottom = option.offsetTop + option.offsetHeight
          if (optionBottom > scrollBottom) {
            this.$refs.listbox.scrollTop = optionBottom - this.$refs.listbox.clientHeight
          } else if (option.offsetTop < this.$refs.listbox.scrollTop) {
            this.$refs.listbox.scrollTop = option.offsetTop
          }
        }
      }

      this.handleFocusChange(option)
    },

    /**
     * @description Defocus the specified option
     * @param option The option to defocus
     */
    defocusOption (option) {
      if (!option) {
        return
      }
      option.removeAttribute('aria-selected')
      option.classList.remove('focused')
    },

    /**
     * @description
     * Handle various keyboard controls;
     * ArrowUp/ArrowDown will shift focus.
     * Space selects an option.
     * Enter and Escape close the options panel and focuses the button.
     * @param event The keydown event object
     */
    checkKeyPress (event) {
      if ((event.code == 'Enter') || (event.code == 'Escape')) {
          event.preventDefault()
          // Hide options, focus button, bail
          this.hideListbox()
          this.$refs.button.focus()
          return
      }

      let nextOption = document.getElementById(this.activeDescendant)

      if (!nextOption) {
        return
      }

      switch (event.code) {
        case 'ArrowUp':
        case 'ArrowDown':
          event.preventDefault()

          if (event.code == 'ArrowUp') {
            nextOption = nextOption.previousElementSibling
          } else {
            nextOption = nextOption.nextElementSibling
          }

          if (nextOption) {
            this.focusOption(nextOption)
          }
          break

        case 'Home':
          event.preventDefault()
          this.focusFirstOption()
          break

        case 'End':
          event.preventDefault()
          this.focusLastOption()
          break

        default:
          // TODO: implement searching
          //let optionToFocus
          //optionToFocus = this.findOptionToFocus(event.key)
          //if (optionToFocus) {
          //  this.focusOption(optionToFocus)
          //}
          break
      }
    },

    /**
     * @description Search through the innerText of the options to find a match
     * for characters typed within a 500ms period.
     * @param character The latest character
     */
    findOptionToFocus (character) {
      let itemList = this.$refs.listbox.querySelectorAll('[role="option"]')
      if (!this.keysSoFar) {
        for (let i = 0; i < itemList.length; i++) {
          if (itemList[i].getAttribute('id') == this.activeDescendant) {
            this.searchIndex = i
          }
        }
      }
      //Augment buffer
      this.keysSoFar += character
      this.clearKeysSoFarAfterDelay()

      let nextMatch = this.findMatchInRange(
        itemList,
        this.searchIndex + 1,
        itemList.length
      )

      if (!nextMatch) {
        nextMatch = this.findMatchInRange(
          itemList,
          0,
          this.searchIndex
        )
      }
      return nextMatch
    },

    clearKeysSoFarAfterDelay () {
      if (this.keyClear) {
        clearTimeout(this.keyClear)
        this.keyClear = null
      }

      let that = this
      this.keyClear = setTimeout((function () {
        that.keysSoFar = ''
        that.keyClear = null
      }).bind(this), 500)
    },

    findMatchInRange (list, startIndex, endIndex) {
      // Find the first item starting with the keysSoFar substring, searching in
      // the specified range of items
      for (let n = startIndex; n < endIndex; n++) {
        let label = list[n].innerText;
        if (label && label.toUpperCase().indexOf(this.keysSoFar) === 0) {
          return list[n]
        }
      }
      return null
    },

    validateChildren () {
      this.$slots.default.forEach((slot) => {
        if (qtiAttributeValidation.isValidSlot(slot)) {
          // Detect an expression
          if (slot.componentOptions.tag !== 'qti-inline-choice') {
            throw new QtiValidationException('Node is not a qti-inline-choice: "' + slot.componentOptions.tag + '"')
          }
        }
      })

      // All good.  Save off our children.
      this.processChildren()

      // Build a UI
      this.processGroupUI()

      // Restore priorState - if any
      if (this.priorState !== null) {
        this.restoreValue(this.priorState.value)
      }

      // Bind a handler for a mousedown event coming from an option in the listbox
      this.bindOptionMousedownHandler()
    },

    processChildren () {
      this.$children.forEach((node) => {
        this.choices.push(node)
      })
    },

    processGroupUI () {
      // Handle shuffling - disable this on a response restore.
      if (this.isShuffle) {
        // If this is a new rendering, shuffle the choices.
        // If this is a restore, rebuild the old shuffled order from state.
        this.processShuffle()
      }

      this.setResponse(null)
      this.setState(this.computeState())
      this.setIsValid(this.computeIsValid())

      // Initialize aria-active-descendant
      this.setActiveDescendant('')
    },

    /**
     * @description This builds a new dom and choices
     * array from the choices array
     */
    processShuffle () {
      // Load all nodes into a container to be shuffled.
      let container = this.createShuffleContainer(this.choices, this.priorState)

      // Clean out the dom and the original choices array
      this.choices.splice(0, this.choices.length)
      this.$refs.listbox.innerHTML = ''

      // Rebuild the dom and the choices array
      container.forEach((choice) => {
        this.$refs.listbox.appendChild(choice.node.$el)
        this.choices.push(choice.node)
      }, this)
    },

    /**
     * @description When shuffle is true, this builds an ordered array of choice nodes from
     * a prior state (if one exists) or from the shuffleArrayFixed method in the qtiProcessing
     * library.
     * @param {Array} - choices - Array of choice components
     * @param {Object} - priorState - Object containing a state
     * @return {Array} Array of choices in the proper order.
     */
    createShuffleContainer (choices, priorState) {
      let container = []

      // If priorState is null, we create a container of Choices
      // in their QTI order.  Then shuffle that container in place.
      if (priorState === null) {
        choices.forEach((choice) => {
          container.push({
            fixed: (choice.fixed === 'true'),
            node: choice
          })
        })
        // Shuffle the container
        qtiProcessing.shuffleArrayFixed(container)
        return container
      }

      // priorState is not null...so...
      // The order property is in priorState.state.order
      // Build the container according to the order property.
      priorState.state.order.forEach((identifier) => {
        container.push({
          node: this.findChoiceByIdentifier(identifier, choices)
        })
      }, this)
      return container
    },

    /**
     * @description Utility method for selecting a choice by identifier
     * @param {String} identifier - the identifier of the choice
     * @param {Array} choices - array of qti-inline-choice nodes
     * @return {Component} choice or an exception if not found
     */
    findChoiceByIdentifier (identifier, choices) {
      for (let i = 0; i < choices.length; i++) {
        if (choices[i].$el.getAttribute('data-identifier') === identifier) {
          return choices[i]
        }
      }

      throw new QtiEvaluationException('Inline Choice Interaction State Invalid.  Inline Choice identifier "' + identifier + '" not found.')
    },

    /**
     * @description For screen readers, set the choice group's aria-activedescendant
     * @param {String} id - the dom id of the currently focused choice
     */
    setActiveDescendant (id) {
      this.activeDescendant = id
      this.$refs.listbox.setAttribute('aria-activedescendant', id)
    },

    /**
     * @description Retrieve this interaction's prior state.
     * When not null, has this schema:
     * {
     *   identifier: [String],
     *   value: [String]
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
    }
  },

  created () {
    try {
      this.responseDeclaration = qtiAttributeValidation.validateResponseIdentifierAttribute(store, this.responseIdentifier)

      // Set up a presentation factory
      this.presentationFactory = new InlineChoicePresentationFactory(this.$vnode.data.staticClass)
      this.isOrientationVertical = this.presentationFactory.isOrientationVertical()

      // Pull any prior interaction state.
      this.priorState = this.getPriorState(this.responseIdentifier)

      qtiAttributeValidation.validateMaxMinChoices(this.maxChoices, this.minChoices)
      if (this.minChoices > 1) {
        throw new QtiValidationException('Invalid qti-inline-choice-interaction min-choices attribute: "' + this.minChoices + '"')
      }

      this.cardinality = this.getCardinality()
      this.isShuffle = (this.shuffle === 'true' ? true : false)
      this.computeMinSelectionsMessage()
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
        this.validateChildren()

        // Notify store of our new component
        store.defineInteraction({
            identifier: this.responseIdentifier,
            interactionType: 'InlineChoice',
            node: this,
            resetValue: this.resetValue,
            isValidResponse: this.isValidResponse,
            invalidResponseMessage: this.getInvalidResponseMessage(),
            maxSelectionsMessage: null
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
div.qti-inline-choice-interaction,
div.inline-choice-wrapper {
  display: inline-block;
  position: relative;
  vertical-align: middle;
  min-height: calc(1.6rem + .35rem);
  line-height: 1.6rem;
  margin-top: -1px;
}

div.qti-inline-choice-interaction.qti-orientation-vertical {
  margin-top: .2rem;
  margin-bottom: .2rem;
  margin-right: -0.1rem;
  /* very important to get these lined up vertically */
  vertical-align: top;
  padding-right: 0.05rem;
}

div.qti-inline-choice-interaction.qti-orientation-vertical div.inline-choice-wrapper {
  margin: 0;
}

.inline-choice-select {
  display: inline-block;
  position: relative;
  text-align: left;
  overflow: hidden;
  white-space: nowrap;
  margin: 0 0.15rem;
  min-height: calc(1.6rem + .35rem);
  padding: 0 1.5rem 0 .3rem;
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.6rem;
  color: var(--foreground);
  width: 9rem;
  vertical-align: inherit;
  background: var(--background) url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='4' height='5'%3e%3cpath fill='%23fff' d='M2 0L0 2h4zm0 5L0 3h4z'/%3E%3C/svg%3e") no-repeat right .4rem center/8px 10px;
  border-width: 1px;
  border-color: var(--choice-control-focus-border);
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  border-radius: .25rem;
  transition: background-color .15s ease-in-out,border-color .15s ease-in-out,box-shadow .15s ease-in-out;
  cursor: pointer;
}

.inline-choice-select-label {
  display: inline-block;
  position: relative;
  text-align: left;
  overflow: hidden;
  white-space: nowrap;
  margin: 0 0.15rem;
  min-height: calc(1.6rem + .35rem);
  padding: .15rem .3rem 0 .3rem;
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.6rem;
  color: var(--foreground);
  width: 9rem;
  vertical-align: inherit;
  border: 1px solid var(--choice-control-focus-border);
  border-radius: .25rem;
  transition: background-color .15s ease-in-out,border-color .15s ease-in-out,box-shadow .15s ease-in-out;
  cursor: default;
}

.qti-orientation-vertical .inline-choice-select {
  text-align: left;
  vertical-align: middle;
  padding: .25rem .15rem 0 0;
  margin-left: 0;
  margin-right: -0.05rem;
  height: 9.75rem;
  width: 1.95rem;
  background: var(--background) url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='5' height='4'%3e%3cpath fill='%23fff' transform='rotate(90 2.5 2.5)' d='M2 0L0 2h4zm0 5L0 3h4z'/%3E%3C/svg%3e") no-repeat bottom .3rem center/10px 8px;
}

.qti-orientation-vertical .inline-choice-select-label {
  display: inline-block;
  position: relative;
  text-align: left;
  overflow: hidden;
  white-space: nowrap;
  padding: .25rem .15rem 0 0;
  margin-left: 0;
  margin-right: -0.05rem;
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.6rem;
  color: var(--foreground);
  height: 9.75rem;
  width: 1.95rem;
  vertical-align: middle;
  border: 1px solid var(--choice-control-focus-border);
  border-radius: .25rem;
  transition: background-color .15s ease-in-out,border-color .15s ease-in-out,box-shadow .15s ease-in-out;
  cursor: default;
}

.qti3-player-color-default .inline-choice-select,
.qti3-player-color-blackwhite .inline-choice-select,
.qti3-player-color-blackrose .inline-choice-select,
.qti3-player-color-blackcyan .inline-choice-select,
.qti3-player-color-blackcream .inline-choice-select {
  background: var(--background) url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='4' height='5'%3e%3cpath fill='%23212529' d='M2 0L0 2h4zm0 5L0 3h4z'/%3E%3C/svg%3e") no-repeat right .4rem center/8px 10px;
}

.qti3-player-color-default .qti-orientation-vertical .inline-choice-select,
.qti3-player-color-blackwhite .qti-orientation-vertical .inline-choice-select,
.qti3-player-color-blackrose .qti-orientation-vertical .inline-choice-select,
.qti3-player-color-blackcyan .qti-orientation-vertical .inline-choice-select,
.qti3-player-color-blackcream .qti-orientation-vertical .inline-choice-select {
  background: var(--background) url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='5' height='4'%3e%3cpath fill='%23212529' transform='rotate(90 2.5 2.5)' d='M2 0L0 2h4zm0 5L0 3h4z'/%3E%3C/svg%3e") no-repeat bottom .3rem center/10px 8px;
}

.qti3-player-color-defaultreverse .inline-choice-select {
  background: var(--background) url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='4' height='5'%3e%3cpath fill='%23fff' d='M2 0L0 2h4zm0 5L0 3h4z'/%3E%3C/svg%3e") no-repeat right .4rem center/8px 10px;
}

.qti3-player-color-defaultreverse .qti-orientation-vertical .inline-choice-select {
  background: var(--background) url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='5' height='4'%3e%3cpath fill='%23fff' transform='rotate(90 2.5 2.5)' d='M2 0L0 2h4zm0 5L0 3h4z'/%3E%3C/svg%3e") no-repeat bottom .3rem center/10px 8px;
}

.qti3-player-color-yellowblue .inline-choice-select {
  background: var(--background) url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='4' height='5'%3e%3cpath fill='%23ffcc00' d='M2 0L0 2h4zm0 5L0 3h4z'/%3E%3C/svg%3e") no-repeat right .4rem center/8px 10px;
}

.qti3-player-color-yellowblue .qti-orientation-vertical .inline-choice-select {
  background: var(--background) url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='5' height='4'%3e%3cpath fill='%23ffcc00' transform='rotate(90 2.5 2.5)' d='M2 0L0 2h4zm0 5L0 3h4z'/%3E%3C/svg%3e") no-repeat bottom .3rem center/10px 8px;
}

.qti3-player-color-blueyellow .inline-choice-select {
  background: var(--background) url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='4' height='5'%3e%3cpath fill='%23003398' d='M2 0L0 2h4zm0 5L0 3h4z'/%3E%3C/svg%3e") no-repeat right .4rem center/8px 10px;
}

.qti3-player-color-blueyellow .qti-orientation-vertical .inline-choice-select {
  background: var(--background) url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='5' height='4'%3e%3cpath fill='%23003398' transform='rotate(90 2.5 2.5)' d='M2 0L0 2h4zm0 5L0 3h4z'/%3E%3C/svg%3e") no-repeat bottom .3rem center/10px 8px;
}

.qti3-player-color-dgraymgray .inline-choice-select {
  background: var(--background) url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='4' height='5'%3e%3cpath fill='%23666' d='M2 0L0 2h4zm0 5L0 3h4z'/%3E%3C/svg%3e") no-repeat right .4rem center/8px 10px;
}

.qti3-player-color-dgraymgray .qti-orientation-vertical .inline-choice-select {
  background: var(--background) url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='5' height='4'%3e%3cpath fill='%23666' transform='rotate(90 2.5 2.5)' d='M2 0L0 2h4zm0 5L0 3h4z'/%3E%3C/svg%3e") no-repeat bottom .3rem center/10px 8px;
}

.qti3-player-color-roseblack .inline-choice-select {
  background: var(--background) url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='4' height='5'%3e%3cpath fill='%23ffd0ff' d='M2 0L0 2h4zm0 5L0 3h4z'/%3E%3C/svg%3e") no-repeat right .4rem center/8px 10px;
}

.qti3-player-color-roseblack .qti-orientation-vertical .inline-choice-select {
  background: var(--background) url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='5' height='4'%3e%3cpath fill='%23ffd0ff' transform='rotate(90 2.5 2.5)' d='M2 0L0 2h4zm0 5L0 3h4z'/%3E%3C/svg%3e") no-repeat bottom .3rem center/10px 8px;
}

.qti3-player-color-cyanblack .inline-choice-select {
  background: var(--background) url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='4' height='5'%3e%3cpath fill='%23add8e6' d='M2 0L0 2h4zm0 5L0 3h4z'/%3E%3C/svg%3e") no-repeat right .4rem center/8px 10px;
}

.qti3-player-color-cyanblack .qti-orientation-vertical .inline-choice-select {
  background: var(--background) url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='5' height='4'%3e%3cpath fill='%23add8e6' transform='rotate(90 2.5 2.5)' d='M2 0L0 2h4zm0 5L0 3h4z'/%3E%3C/svg%3e") no-repeat bottom .3rem center/10px 8px;
}

.qti3-player-color-creamblack .inline-choice-select {
  background: var(--background) url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='4' height='5'%3e%3cpath fill='%23fffacd' d='M2 0L0 2h4zm0 5L0 3h4z'/%3E%3C/svg%3e") no-repeat right .4rem center/8px 10px;
}

.qti3-player-color-creamblack .qti-orientation-vertical .inline-choice-select {
  background: var(--background) url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='5' height='4'%3e%3cpath fill='%23fffacd' transform='rotate(90 2.5 2.5)' d='M2 0L0 2h4zm0 5L0 3h4z'/%3E%3C/svg%3e") no-repeat bottom .3rem center/10px 8px;
}

.inline-choice-select-prompt {
  display: inline-block;
  position: relative;
  margin: 0;
  padding: 0;
  width: 7.5rem;
  vertical-align: inherit;
  overflow: hidden !important;
}

.qti-orientation-vertical .inline-choice-select-prompt {
  writing-mode: vertical-rl;
  height: 8.9rem;
  width: 1.68rem;
}

.inline-choice-select:focus,
.inline-choice-select[aria-expanded="true"],
.inline-choice-select-label:focus {
  color: var(--foreground);
  background-color: var(--background);
  border-color: var(--choice-control-focus-border);
  outline: 0;
  box-shadow: var(--choice-control-focus-shadow);
}

ul.inline-choice-select-listbox {
  max-height: 10em;
  overflow-y: auto;
  position: absolute;
  margin: 0 2px;
  padding: 0;
  background: var(--background);
  border: 2px solid var(--foreground);
  border-radius: .25em;
  z-index: 9;
}

/* Force listbox height */
.qti3-player-listbox-height-8 ul.inline-choice-select-listbox {
  height: 2rem;
}

.qti3-player-listbox-height-12 ul.inline-choice-select-listbox {
  height: 3rem;
}

.qti3-player-listbox-height-16 ul.inline-choice-select-listbox {
  height: 4rem;
}

.qti3-player-listbox-height-20 ul.inline-choice-select-listbox {
  height: 5rem;
}

.qti3-player-listbox-height-24 ul.inline-choice-select-listbox {
  height: 6rem;
}

.qti3-player-listbox-height-28 ul.inline-choice-select-listbox {
  height: 7rem;
}

.qti3-player-listbox-height-32 ul.inline-choice-select-listbox {
  height: 8rem;
}

.qti3-player-listbox-height-36 ul.inline-choice-select-listbox {
  height: 9rem;
}

.qti3-player-listbox-height-40 ul.inline-choice-select-listbox {
  height: 10rem;
}

[role="option"] {
  display: block;
  padding: 0 1em 0 1.5em;
  position: relative;
  line-height: 1.6em;
  cursor: pointer;
}

.qti-orientation-vertical [role="option"] {
  padding: 1.5em .25em 0 .25em;
}

[role="option"]:last-child {
  padding-bottom: 2px;
}

[role="option"].focused {
  color: var(--ic-focus-fc);
  background: var(--ic-focus-bc);
}

[role="option"][aria-selected="true"]::before {
  content: '✓';
  position: absolute;
  left: 0.5em;
}

.qti-orientation-vertical [role="option"][aria-selected="true"]::before {
  content: '✓';
  position: absolute;
  top: 0.25em;
  right: 0.2em;
}

[role="option"]:hover {
  color: var(--ic-focus-fc);
  background: var(--ic-focus-bc);
}

.inline-choice-select-listbox-hidden,
.select-element-hidden,
.qti-orientation-vertical .select-element-hidden {
  display: none;
}

.qti-input-width-1 .inline-choice-select {
  width: 2.5rem;
}

.qti-input-width-1 .inline-choice-select-label {
  width: 1.55rem;
}

.qti-input-width-1 .inline-choice-select-prompt {
  width: 1.0rem;
}

.qti-orientation-vertical.qti-input-width-1 .inline-choice-select {
  height: 2.75rem;
  width: 1.95rem;
}

.qti-orientation-vertical.qti-input-width-1 .inline-choice-select-label {
  height: 1.0rem;
  width: 1.95rem;
}

.qti-orientation-vertical.qti-input-width-1 .inline-choice-select-prompt {
  height: 1.9rem;
  width: 1.68rem;
}

.qti-input-width-2 .inline-choice-select {
  width: 3.5rem;
}

.qti-input-width-2 .inline-choice-select-label {
  width: 2.4rem;
}

.qti-input-width-2 .inline-choice-select-prompt {
  width: 2.0rem;
}

.qti-orientation-vertical.qti-input-width-2 .inline-choice-select {
  height: 3.75rem;
  width: 1.95rem;
}

.qti-orientation-vertical.qti-input-width-2 .inline-choice-select-label {
  height: 2.7rem;
  width: 1.95rem;
}

.qti-orientation-vertical.qti-input-width-2 .inline-choice-select-prompt {
  height: 2.9rem;
  width: 1.68rem;
}

.qti-input-width-3 .inline-choice-select {
  width: 4.8rem;
}

.qti-input-width-3 .inline-choice-select-label {
  width: 3.3rem;
}

.qti-input-width-3 .inline-choice-select-prompt {
  width: 3.0rem;
}

.qti-orientation-vertical.qti-input-width-3 .inline-choice-select {
  height: 4.75rem;
  width: 1.95rem;
}

.qti-orientation-vertical.qti-input-width-3 .inline-choice-select-label {
  height: 3.7rem;
  width: 1.95rem;
}

.qti-orientation-vertical.qti-input-width-3 .inline-choice-select-prompt {
  height: 3.9rem;
  width: 1.68rem;
}

.qti-input-width-4 .inline-choice-select {
  width: 5.5rem;
}

.qti-input-width-4 .inline-choice-select-label {
  width: 4.1rem;
}

.qti-input-width-4 .inline-choice-select-prompt {
  width: 4.0rem;
}

.qti-orientation-vertical.qti-input-width-4 .inline-choice-select {
  height: 5.75rem;
  width: 1.95rem;
}

.qti-orientation-vertical.qti-input-width-4 .inline-choice-select-label {
  height: 4.7rem;
  width: 1.95rem;
}

.qti-orientation-vertical.qti-input-width-4 .inline-choice-select-prompt {
  height: 4.9rem;
  width: 1.68rem;
}

.qti-input-width-5 .inline-choice-select {
  width: 6.5rem;
}

.qti-input-width-5 .inline-choice-select-label {
  width: 4.9rem;
}

.qti-input-width-5 .inline-choice-select-prompt {
  width: 5.0rem;
}

.qti-orientation-vertical.qti-input-width-5 .inline-choice-select {
  height: 6.75rem;
  width: 1.95rem;
}

.qti-orientation-vertical.qti-input-width-5 .inline-choice-select-label {
  height: 5.7rem;
  width: 1.95rem;
}

.qti-orientation-vertical.qti-input-width-5 .inline-choice-select-prompt {
  height: 5.9rem;
  width: 1.68rem;
}

.qti-input-width-6 .inline-choice-select {
  width: 7.5rem;
}

.qti-input-width-6 .inline-choice-select-label {
  width: 5.8rem;
}

.qti-input-width-6 .inline-choice-select-prompt {
  width: 6.0rem;
}

.qti-orientation-vertical.qti-input-width-6 .inline-choice-select {
  height: 7.75rem;
  width: 1.95rem;
}

.qti-orientation-vertical.qti-input-width-6 .inline-choice-select-label {
  height: 6.7rem;
  width: 1.95rem;
}

.qti-orientation-vertical.qti-input-width-6 .inline-choice-select-prompt {
  height: 6.9rem;
  width: 1.68rem;
}

.qti-input-width-10 .inline-choice-select{
  width: 11.5rem;
}

.qti-input-width-10 .inline-choice-select-label {
  width: 9.1rem;
}

.qti-input-width-10 .inline-choice-select-prompt {
  width: 9.5rem;
}

.qti-orientation-vertical.qti-input-width-10 .inline-choice-select {
  height: 11.75rem;
  width: 1.95rem;
}

.qti-orientation-vertical.qti-input-width-10 .inline-choice-select-label {
  height: 10.7rem;
  width: 1.95rem;
}

.qti-orientation-vertical.qti-input-width-10 .inline-choice-select-prompt {
  height: 10.9rem;
  width: 1.68rem;
}

.qti-input-width-15 .inline-choice-select {
  width: 16.0rem;
}

.qti-input-width-15 .inline-choice-select-label {
  width: 13.3rem;
}

.qti-input-width-15 .inline-choice-select-prompt {
  width: 14.5rem;
}

.qti-orientation-vertical.qti-input-width-15 .inline-choice-select {
  height: 16.75rem;
  width: 1.95rem;
}

.qti-orientation-vertical.qti-input-width-15 .inline-choice-select-label {
  height: 15.7rem;
  width: 1.95rem;
}

.qti-orientation-vertical.qti-input-width-15 .inline-choice-select-prompt {
  height: 15.9rem;
  width: 1.68rem;
}

.qti-input-width-20 .inline-choice-select {
  width: 20.5rem;
}

.qti-input-width-20 .inline-choice-select-label {
  width: 17.4rem;
}

.qti-input-width-20 .inline-choice-select-prompt {
  width: 19.0rem;
}

.qti-orientation-vertical.qti-input-width-20 .inline-choice-select {
  height: 21.75rem;
  width: 1.95rem;
}

.qti-orientation-vertical.qti-input-width-20 .inline-choice-select-label {
  height: 20.7rem;
  width: 1.95rem;
}

.qti-orientation-vertical.qti-input-width-20 .inline-choice-select-prompt {
  height: 20.9rem;
  width: 1.68rem;
}

.qti-input-width-25 .inline-choice-select {
  width: 25.0rem;
}

.qti-input-width-25 .inline-choice-select-label {
  width: 21.55rem;
}

.qti-input-width-25 .inline-choice-select-prompt {
  width: 23.5rem;
}

.qti-orientation-vertical.qti-input-width-25 .inline-choice-select {
  height: 26.75rem;
  width: 1.95rem;
}

.qti-orientation-vertical.qti-input-width-25 .inline-choice-select-label {
  height: 25.7rem;
  width: 1.95rem;
}

.qti-orientation-vertical.qti-input-width-25 .inline-choice-select-prompt {
  height: 25.9rem;
  width: 1.68rem;
}

.qti-input-width-30 .inline-choice-select {
  width: 29.5rem;
}

.qti-input-width-30 .inline-choice-select-label {
  width: 25.7rem;
}

.qti-input-width-30 .inline-choice-select-prompt {
  width: 28.0rem;
}

.qti-input-width-35 .inline-choice-select {
  width: 34.0rem;
}

.qti-input-width-35 .inline-choice-select-label {
  width: 30.0rem;
}

.qti-input-width-35 .inline-choice-select-prompt {
  width: 32.5rem;
}

.qti-input-width-40 .inline-choice-select {
  width: 38.5rem;
}

.qti-input-width-40 .inline-choice-select-label {
  width: 34.1rem;
}

.qti-input-width-40 .inline-choice-select-prompt {
  width: 37.0rem;
}

.qti-input-width-45 .inline-choice-select {
  width: 43.0rem;
}

.qti-input-width-45 .inline-choice-select-label {
  width: 38.3rem;
}

.qti-input-width-45 .inline-choice-select-prompt {
  width: 41.5rem;
}

.qti-input-width-50 .inline-choice-select {
  width: 47.5rem;
}

.qti-input-width-50 .inline-choice-select-label {
  width: 42.4rem;
}

.qti-input-width-50 .inline-choice-select-prompt {
  width: 46.0rem;
}

div.qti-inline-choice-interaction.qti-input-width-72,
.qti-input-width-72 div.inline-choice-wrapper,
.qti-input-width-72 .inline-choice-select,
.qti-input-width-72 .inline-choice-select-label {
  width: calc(100% - 0.1rem);
}

.qti-input-width-72 .inline-choice-select-label {
  width: calc(100% - 0.3rem);
}

.qti-input-width-72 .inline-choice-select-prompt {
  width: 96%;
}
</style>
