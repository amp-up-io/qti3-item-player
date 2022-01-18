<template>
  <div ref="root" class="qti-inline-choice-interaction">
    <div class="inline-choice-wrapper">
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
      isQtiValid: true,
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

    resetValue () {
      console.log('[ResetValue][identifier]', this.responseIdentifier)

      // Clear out any current UI state
      let options = this.$refs.listbox.querySelectorAll('[role="option"]')
      options.forEach((option) => {
          this.defocusOption(option)
        }, this)

      this.setResponse(null)
      this.setIsValid(false)

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
     * @return {String} response
     */
    computeResponse (identifier) {
      if ((identifier !== null) && (identifier.length > 0)) {
        return identifier
      }
      return null
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
      this.minSelectionsMessage = (this.minChoices == 0) ? '' : 'You must make at least 1 choice for this question.'
    },

    handleButtonClick () {
      this.showListbox()
    },

    handleButtonKeyup (event) {
      switch (event.code) {
        case 'ArrowUp':
        case 'ArrowDown':
          event.preventDefault()
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

      // Save our choices in state.
      this.setState(this.computeState())

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
            minSelectionsMessage: this.minSelectionsMessage,
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

.inline-choice-select {
  display: inline-block;
  position: relative;
  text-align: left;
  overflow: hidden;
  white-space: nowrap;
  margin: 0 0.15em;
  min-height: calc(1.6rem + .35rem);
  padding: 0 1.5rem 0 .3rem;
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.6rem;
  color: var(--foreground);
  width: 9rem;
  vertical-align: inherit;
  background: var(--background) url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='5'%3E%3Cpath fill='%23343a40' d='M2 0L0 2h4zm0 5L0 3h4z'/%3E%3C/svg%3E") no-repeat right .4rem center/8px 10px;
  border-width: 1px;
  border-color: hsl(216, 94%, 73%);
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  border-radius: .25rem;
  transition: background-color .15s ease-in-out,border-color .15s ease-in-out,box-shadow .15s ease-in-out;
  cursor: pointer;
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

.inline-choice-select:focus,
.inline-choice-select[aria-expanded="true"] {
  color: #212529;
  background-color: var(--background);
  border-color: var(--choice-control-focus-border);
  outline: 0;
  /*
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
  */
  box-shadow: var(--choice-control-focus-shadow);
}

ul.inline-choice-select-listbox {
  max-height: 10em;
  overflow-y: auto;
  position: absolute;
  margin: 0 2px;
  padding: 0;
  background: var(--background);
  border: 2px solid black;
  border-radius: .25em;
  z-index: 9;
}

[role="option"] {
  display: block;
  padding: 0 1em 0 1.5em;
  position: relative;
  line-height: 1.6em;
  cursor: pointer;
}

[role="option"]:last-child {
  padding-bottom: 2px;
}

[role="option"].focused {
  background: #bde4ff;
}

[role="option"][aria-selected="true"]::before {
  content: '✓';
  position: absolute;
  left: 0.5em;
}

.inline-choice-select-listbox-hidden {
  display: none;
}

.qti-input-width-1 .inline-choice-select{
  width: 2.5rem;
}

.qti-input-width-1 .inline-choice-select-prompt{
  width: 1.0rem;
}

.qti-input-width-2 .inline-choice-select{
  width: 3.5rem;
}

.qti-input-width-2 .inline-choice-select-prompt{
  width: 2.0rem;
}

.qti-input-width-3 .inline-choice-select{
  width: 4.8rem;
}

.qti-input-width-3 .inline-choice-select-prompt{width:3.0rem;}
.qti-input-width-4 .inline-choice-select{width:5.5rem;}
.qti-input-width-4 .inline-choice-select-prompt{width:4.0rem;}
.qti-input-width-5 .inline-choice-select{width:6.5rem;}
.qti-input-width-5 .inline-choice-select-prompt{width:5.0rem;}
.qti-input-width-6 .inline-choice-select{width:7.5rem;}
.qti-input-width-6 .inline-choice-select-prompt{width:6.0rem;}
.qti-input-width-10 .inline-choice-select{width:11.5rem;}
.qti-input-width-10 .inline-choice-select-prompt{width:9.5rem;}
.qti-input-width-15 .inline-choice-select{width:16.0rem;}
.qti-input-width-15 .inline-choice-select-prompt{width:14.5rem;}
.qti-input-width-20 .inline-choice-select{width:20.5rem;}
.qti-input-width-20 .inline-choice-select-prompt{width:19.0rem;}
.qti-input-width-25 .inline-choice-select{width:25.0rem;}
.qti-input-width-25 .inline-choice-select-prompt{width:23.5rem;}
.qti-input-width-30 .inline-choice-select{width:29.5rem;}
.qti-input-width-30 .inline-choice-select-prompt{width:28.0rem;}
.qti-input-width-35 .inline-choice-select{width:34.0rem;}
.qti-input-width-35 .inline-choice-select-prompt{width:32.5rem;}
.qti-input-width-40 .inline-choice-select{width:38.5rem;}
.qti-input-width-40 .inline-choice-select-prompt{width:37.0rem;}
.qti-input-width-45 .inline-choice-select{width:43.0rem;}
.qti-input-width-45 .inline-choice-select-prompt{width:41.5rem;}
.qti-input-width-50 .inline-choice-select{width:47.5rem;}
.qti-input-width-50 .inline-choice-select-prompt{width:46.0rem;}

div.qti-inline-choice-interaction.qti-input-width-72,
.qti-input-width-72 div.inline-choice-wrapper,
.qti-input-width-72 .inline-choice-select{
  width: 100%;
}

.qti-input-width-72 .inline-choice-select-prompt{
  width: 96%;
}
</style>
