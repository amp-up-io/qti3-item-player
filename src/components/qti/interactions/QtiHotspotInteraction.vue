<template>
  <div ref="root" class="qti-hotspot-interaction">

    <slot name="prompt" />

    <div ref="hotspotgroup" 
      @setChecked="handleSetChecked"
      class="qti3-player-hotspot-group">
      <slot name="default"></slot>
      <svg ref="overlay" class="qti3-player-hotspot-overlay">
      </svg>
    </div>

  </div>
</template>

<script>
/*
 * A hotspot interaction is a graphical interaction with a corresponding set of choices that 
 * are defined as areas of the graphic image. The candidate's task is to select one or more 
 * of the areas (hotspots). The hotspot interaction should only be used when the spacial 
 * relationship of the choices with respect to each other (as represented by the graphic image) 
 * is important to the needs of the item. The delivery engine must clearly indicate the selected 
 * area(s) of the image and may also indicate the unselected areas as well. The hotspot interaction 
 * must be bound to a response variable with a base-type of identifier and single or multiple 
 * cardinality.
 */
import Vue from 'vue'
import { store } from '@/store/store'
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiParseException from '@/components/qti/exceptions/QtiParseException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import HotspotPresentationFactory from '@/components/qti/interactions/presentation/HotspotInteractionPresentationFactory'
import QtiPrompt from '@/components/qti/interactions/QtiPrompt'
import QtiHotspotChoice from '@/components/qti/interactions/QtiHotspotChoice'

Vue.component('qti-prompt', QtiPrompt)
Vue.component('qti-hotspot-choice', QtiHotspotChoice)

const qtiAttributeValidation = new QtiAttributeValidation()

export default {
  name: 'QtiHotspotInteraction',

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
    dataMaxSelectionsMessage: {
      required: false,
      type: String
    },
    dataMinSelectionsMessage: {
      required: false,
      type: String
    }
  },

  inheritAttrs: true,

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
      currentChoice: null,
      shapeElements: [],
      currentElement: null,
      backgroundImage: null,
      backgroundImageWidth: '0',
      backgroundImageHeight: '0',
      isRadio: true,
      isDisabled: false,
      isQtiValid: true,
      presentationFactory: null,
      shapeColorProperties: null,
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
      for (let i=0; i<this.choices.length; i++) {
        this.setChoiceUnChecked(this.choices[i], this.shapeElements[i])
      }

      this.currentChoice = null
      this.currentElement = null

      // When a new template, smoke the priorState
      this.priorState = null
      this.setResponse(null)
      this.setState(this.computeState())
      this.updateValidity(this.computeIsValid())
    },

    /**
     * @description Restores this interaction's response.  Also
     * restores this interaction's response validity.
     * @param {String or Array} response
     */
    restoreValue (response) {
      if (response === null) return

      if (this.isRadio) {
        // response is an identifier string
        this.handleSetChecked(new CustomEvent('setChecked', {
            bubbles: false,
            detail: { 'identifier': response, 'checked': 'true' }
          }), true)
      } else {
        // response is an array of identifier strings
        response.forEach((identifier) => {
          this.handleSetChecked(new CustomEvent('setChecked', {
              bubbles: false,
              detail: { 'identifier': identifier, 'checked': 'true' }
            }), true)
          }, this)
      }

      this.setResponse(this.computeResponse())
      this.setState(this.computeState())
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
     * @description Implements checked behavior on hotspot radio button and checkbox groups.
     * @param {CustomEvent} event - CustomEvent 'setChecked'
     * @param {Boolean} restoring - boolean set to true when restoring
     */
    handleSetChecked (event, restoring=false) {

      /*
       * event.detail is an object with the following properties:
       *
       * { 
       *  'identifier': identifier {String} identifier of the qti-hotspot-choice element being checked
       *  'checked': checked {String} 'true' | 'false'
       * }
       * 
       */
      const choice = event.detail

      for (let i=0; i<this.choices.length; i++) {

        // Single cardinality: turn off all radio buttons
        if (this.isRadio) {
          this.setChoiceUnChecked(this.choices[i], this.shapeElements[i])
        }

        // Set currentChoice and currentElement to our choice to be checked (or unchecked)
        if (this.choices[i].identifier === choice.identifier) {
          this.currentChoice = this.choices[i]
          this.currentElement = this.shapeElements[i]
        }
      }

      if (choice.checked === 'true') {

        // Only permit checking if we have not exceeded maxChoices
        if (!this.checkMaxChoicesLimit()) {
          this.setChoiceChecked(this.currentChoice, this.currentElement)
        } else {
          this.setChoiceUnChecked(this.currentChoice, this.currentElement)
        }

      } else {
        this.setChoiceUnChecked(this.currentChoice, this.currentElement)
      }

      if (!restoring) {
        // Update the response to reflect the current checked state of the choices
        this.setResponse(this.computeResponse())
        // Focus the choice element if we are not restoring.
        this.currentElement.focus()
        // Update validity
        this.evaluateValidity()
      }
    },

    /**
     * @description Build a response from the array of choices.
     * Single Cardinality: response is an identifier string
     * Multiple Cardinality: response is an array of identifier strings
     * @return {String or Array} response
     */
    computeResponse () {
      let response = this.isRadio ? null : []

      this.choices.forEach((hotspotChoice) => {
        if (hotspotChoice.isChecked()) {
          if (this.isRadio) {
            response = hotspotChoice.identifier
          } else {
            response.push(hotspotChoice.identifier)
          }
        }
      })

      return response
    },

    /**
     * @description Return an empty object as we do not track any other 
     * state properties as of 1/5/1023.
     * @return {Object} state object
     */
     computeState () {
      const state = {}
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
      this.maxSelectionsMessage = (this.maxChoices == 0) ? '' : 'You are permitted a maximum of ' + this.maxChoices + ' selection' + (this.maxChoices > 1 ? 's' : '') + ' for this question.<br/><br/>Please unselect one of your selections before making another selection.'
    },

    computeMinSelectionsMessage () {
      if (typeof this.dataMinSelectionsMessage !== 'undefined') {
        this.minSelectionsMessage = this.dataMinSelectionsMessage
        return
      }
      this.minSelectionsMessage = (this.minChoices == 0) ? '' : 'You must make at least ' + this.minChoices + ' selection' + (this.minChoices > 1 ? 's' : '') + ' for this question.'
    },

    validateChildren () {
      this.processBackgroundImage()

      // No validation.  Save off our children.
      this.processChildren()

      // Build a UI
      this.processGroupUI()

      // Restore priorState - if any
      if (this.priorState !== null) {
        this.restoreValue(this.priorState.value)
      }
    },

    processChildren () {
      this.$children.forEach((node) => {
        if (node.$vnode.componentOptions.tag === 'qti-hotspot-choice') {
          this.choices.push(node)

          // Build a shape that corresponds to the hotspotChoice component
          // and add it to the DOM.
          const shapeElement = node.getShapeElement()
          if (shapeElement !== null) {
            this.addHotspotListeners(shapeElement)
            this.shapeElements.push(shapeElement)
            this.$refs.overlay.appendChild(shapeElement)
          }
        }
      })
    },

    addHotspotListeners (element) {
      element.addEventListener('click', this.handleHotspotClick)
      element.addEventListener('keydown', this.handleHotspotKeydown)
    },
    
    removeHotspotListeners (element) {
      element.removeEventListener('click', this.handleHotspotClick)
      element.removeEventListener('keydown', this.handleHotspotKeydown)
    },

    handleHotspotClick (event) {
      event.preventDefault()

      if (this.isDisabled) return

      const identifier = event.target.getAttribute('data-identifier')
      const hotspotChoice = this.findChoiceByIdentifier(identifier)

      if (this.isRadio) {
        this.triggerChecked(event.target.getAttribute('data-identifier'), 'true')
      } else {
        this.toggleChecked(hotspotChoice, event.target)
        this.triggerChecked(identifier, hotspotChoice.getChecked())
      }
    },

    handleHotspotKeydown (event) {

      const identifier = event.target.getAttribute('data-identifier')
      const hotspotChoice = this.findChoiceByIdentifier(identifier)

      switch (event.code) {

        // Enable toggle with Space and Enter keys
        case 'Space':
        case 'Enter':

          event.stopPropagation()
          event.preventDefault()

          if (this.isDisabled) return

          // Should never happen
          if (hotspotChoice == null) return

          this.toggleChecked(hotspotChoice, event.target)
          this.triggerChecked(identifier, hotspotChoice.getChecked())
          break

        default:
          break
      }
    },

    findChoiceByIdentifier (identifier) {
      for (let i=0; i < this.choices.length; i++) {
        if (this.choices[i].identifier === identifier)
          return this.choices[i]
      }
      return null
    },

    toggleChecked (hotspotChoice, hotspotElement) {
      hotspotChoice.toggleChecked()

      if (hotspotElement === null) return

      const checked = hotspotElement.getAttribute('aria-checked')
      hotspotElement.setAttribute('aria-checked', checked === 'true' ? 'false' : 'true')
    },

    triggerChecked (identifier, checked) {
      const eventSetChecked = new CustomEvent('setChecked', {
          bubbles: true,
          cancelable: true,
          detail: { 'identifier': identifier, 'checked': checked }
        })

      this.$refs.hotspotgroup.dispatchEvent(eventSetChecked)
    },

    setChoiceUnChecked (hotspotChoice, hotspotElement) {
      // Set the component's checked value
      hotspotChoice.setChecked(false)

      // Set the visual state of the element to unchecked
      hotspotElement.setAttribute('aria-checked', 'false')
      const shapeColorProperties = hotspotChoice.getShapeColorProperties()
      hotspotElement.setAttribute('fill', `${shapeColorProperties.fillColor}`)
      hotspotElement.setAttribute('fill-opacity', `${shapeColorProperties.fillOpacity}`)
      hotspotElement.setAttribute('opacity', `${shapeColorProperties.unselectedOpacity}`)
      hotspotElement.setAttribute('stroke', `${shapeColorProperties.strokeColor}`)
      hotspotElement.setAttribute('stroke-width', `${shapeColorProperties.strokeWidth}`)
    },

    setChoiceChecked (hotspotChoice, hotspotElement) {
      // Set the component's checked value
      hotspotChoice.setChecked(true)

      // Set the visual state of the element to unchecked
      hotspotElement.setAttribute('aria-checked', 'true')
      const shapeColorProperties = hotspotChoice.getShapeColorProperties()
      hotspotElement.setAttribute('fill', `${shapeColorProperties.fillColor}`)
      hotspotElement.setAttribute('fill-opacity', `${shapeColorProperties.fillOpacity}`)
      hotspotElement.setAttribute('opacity', `${shapeColorProperties.selectedOpacity}`)
      hotspotElement.setAttribute('stroke', `${shapeColorProperties.strokeColor}`)
      hotspotElement.setAttribute('stroke-width', `${shapeColorProperties.selectedStrokeWidth}`)
    },

    processGroupUI () {
      this.setResponse(null)
      this.setState(this.computeState())
      this.setIsValid(this.computeIsValid())
    },

    processBackgroundImage () {
      let bgElement = this.$refs.hotspotgroup.getElementsByTagName('object')

      if (bgElement.length === 0) {
        bgElement = this.$refs.hotspotgroup.getElementsByTagName('img')
      }

      if (bgElement.length === 0) {
        bgElement = this.$refs.hotspotgroup.getElementsByTagName('picture')
      }

      if (bgElement.length !== 1) {
        throw new QtiValidationException('Hotspot interaction must have exactly one <img>, <object>, or <picture> node')
      }

      // Set the dimensions and other attributes of the overlay
      this.backgroundImage = bgElement[0]
      this.backgroundImage.setAttribute('draggable','false')
      this.backgroundImageWidth = `${bgElement[0].clientWidth}`
      this.backgroundImageHeight = `${bgElement[0].clientHeight}`
      this.$refs.overlay.setAttribute('viewBox', `0 0 ${this.backgroundImageWidth} ${this.backgroundImageHeight}`)
      this.$refs.overlay.setAttribute('tabindex', '-1')
      this.$refs.overlay.setAttribute('role', 'application')
      this.$refs.overlay.setAttribute('focusable','false')

      // Set the dimensions of the group container div
      this.$refs.hotspotgroup.setAttribute('style', `width:${bgElement[0].clientWidth};height:${bgElement[0].clientHeight}`)
    },

    getShapeColorProperties () {
      return this.shapeColorProperties
    },

    setShapeColorProperties (shapeColorProperties) {
      this.shapeColorProperties = shapeColorProperties
    },

    disable () {
      this.isDisabled = true
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
        throw new QtiEvaluationException('Hottext Interaction State Invalid.  "value" property not found.')
      }
      if (!('state' in priorState)) {
        throw new QtiEvaluationException('Hottext Interaction State Invalid.  "state" property not found.')
      }

      return priorState
    }
  },

  created () {
    try {
      this.responseDeclaration = qtiAttributeValidation.validateResponseIdentifierAttribute(store, this.responseIdentifier)

      // Set up a presentation factory
      this.presentationFactory = new HotspotPresentationFactory(this.$vnode.data.staticClass)
      this.setShapeColorProperties(this.presentationFactory.getThemeColors())

      // Pull any prior interaction state.
      this.priorState = this.getPriorState(this.responseIdentifier)

      qtiAttributeValidation.validateMaxMinChoices(this.maxChoices, this.minChoices)
      this.isRadio = (this.getCardinality() !== 'multiple')
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
        this.validateChildren()

        // Notify store of our new interaction
        store.defineInteraction({
            identifier: this.responseIdentifier,
            interactionType: 'Hotspot',
            node: this,
            resetValue: this.resetValue,
            disable: this.disable,
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
  },

  beforeDestroy () {
    this.shapeElements.forEach((shapeElement) => {
      this.removeHotspotListeners(shapeElement)
    })
  }
}
</script>

<style>
.qti3-player-hotspot-group {
  position: relative;
  /* <= shrinks container to image size */
  display: inline-block;
}

.qti3-player-hotspot-group svg.qti3-player-hotspot-overlay {
  position: absolute;
  top: 0;
  left: 0;
  outline: none;
  user-select: none;
  cursor: pointer;
}

.qti3-player-hotspot-choice {
  outline: none;
  cursor: pointer;
}

.qti3-player-hotspot-choice[aria-checked="false"]:focus {
  stroke-width: 3;
  stroke-dasharray: 1;
}

.qti3-player-hotspot-choice[aria-checked="true"]:focus {
  stroke-width: 4;
  stroke-dasharray: 0;
}
</style>
