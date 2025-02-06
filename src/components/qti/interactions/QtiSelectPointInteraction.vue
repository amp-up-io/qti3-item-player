<template>
  <div ref="root" class="qti-select-point-interaction">

    <slot name="prompt" />

    <div ref="selectpointgroup" class="select-point-group">
      <slot></slot>
      <svg ref="overlay" class="select-point-overlay">
      </svg>
    </div>

  </div>
</template>

<script>
/*
 * A select point interaction is a graphic interaction. The candidate's task is to 
 * select one or more points. The associated response may have an areaMapping that 
 * scores the response on the basis of comparing it against predefined areas but 
 * the delivery engine must not indicate these areas of the image. Only the actual 
 * point(s) selected by the candidate shall be indicated. The select point interaction
 * must be bound to a response variable with a base-type of point and single or 
 * multiple cardinality.
 */
import Vue from 'vue'
import { store } from '@/store/store'
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiParseException from '@/components/qti/exceptions/QtiParseException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiPrompt from '@/components/qti/interactions/QtiPrompt'

Vue.component('qti-prompt', QtiPrompt)

const qtiAttributeValidation = new QtiAttributeValidation()

export default {
  name: 'QtiSelectPointInteraction',

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
      default: '0'
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

  data () {
    return {
      response: null,
      state: null,
      isValidResponse: false,
      cardinality: 'single',
      minSelectionsMessage: '',
      maxSelectionsMessage: '',
      responseDeclaration: null,
      pointElements: new Map(),
      backgroundImage: null,
      backgroundImageWidth: '0',
      backgroundImageHeight: '0',
      bgImageProperties: null,
      overlayId: '',
      markerType: 'default',
      isResponsive: false,
      interactionClassAttribute: null,
      pointRadius: 9,
      isSingle: true,
      isDisabled: false,
      isQtiValid: true,
      // If we are restoring, this is where we save the prior variable state
      priorState: null
    }
  },

  methods: {

    /**
     * @description Get this interaction's response.
     * @return {Point or Array} response - depending on cardinality
     */
    getResponse () {
      return this.response
    },

    /**
     * @description Set this interaction's response
     * @param {Point or Array} response - (point or array depending on cardinality)
     *                                     containing point(s).
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
      this.toggleDisablePoints(true)
    },

    enable () {
      this.toggleDisablePoints(false)
    },

    /**
     * @description Utility method to disable/enable this interaction's points.
     * @param {Boolean} isDisabled 
     */
    toggleDisablePoints (isDisabled) {
      this.isDisabled = isDisabled
    },

    /**
     * @description Get this interaction's invalid response message.
     * @return {String} minSelectionsMessage or custom message
     */
    getInvalidResponseMessage () {
      return this.minSelectionsMessage
    },

    /**
     * @description Reset this interaction's response, state, and UI.
     */
    resetValue () {
      console.log('[ResetValue][identifier]', this.responseIdentifier)

      // When a new template, smoke the priorState and clean out the interaction.
      this.priorState = null
      this.setResponse(null)
      this.deleteAllPoints()
      this.setState(this.computeState())
      this.updateValidity(this.computeIsValid())
    },

    /**
     * @description Restores this interaction's response.  Also
     * restores this interaction's response validity.
     * @param {Object} priorState
     */
    restoreValue (priorState) {
      if (priorState === null) return

      // points property was previously checked for consistency
      const points = priorState.state.points

      points.forEach((pointObject) => {
        this.restorePointElement(pointObject)
      })

      this.setState(priorState.state)
      this.setResponse(this.computeResponse())
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
     * @description Build a response
     * Single Cardinality: response is a Point
     * Multiple Cardinality: response is an array of Points
     * @return {String or Array} response
     */
    computeResponse () {
      let response = this.isSingle ? null : []

      for (const pointElement of this.pointElements.values()) {
        // An element's point is located in the data-point attribute.  It is a 
        // string with x and y separated by a space: 'x y'
        const point = `${pointElement.getAttribute('data-point')}`
        if (this.isSingle) {
          response = point
        } else {
          response.push(point)
        }
      }

      // Single Cardinality
      if (this.isSingle) return response

      // Multiple Cardinality
      return (response.length === 0) ? null : response
    },

    /**
     * @description Build a state object
     * @return {Object} state object
     */
    computeState () {
      const points = []

      for (const [id, pointElement] of this.pointElements) {
        points.push({
          id: id,
          marker: pointElement.getAttribute('data-marker-type'),
          point: pointElement.getAttribute('data-point'),
          static: pointElement.getAttribute('class').includes('static')
        })
      }

      return {
        points: points
      }
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
     * @description This method should be called prior to creating a point.
     * @return {Boolean} (true if exceeding max-choices, false if not)
     */
    checkMaxChoicesLimit () {
      // single cardinality and no points -> good
      if (this.isSingle && (this.pointElements.size == 0)) return false

      // multiple card max-choices = 0 means no limit -> good
      if (!this.isSingle && (this.maxChoices == 0)) return false
      if (!this.isSingle && (this.pointElements.size < this.maxChoices)) return false

      store.NotifyInteractionSelectionsLimit(this.maxSelectionsMessage)
      return true
    },

    computeMaxSelectionsMessage () {
      if (typeof this.dataMaxSelectionsMessage !== 'undefined') {
        this.maxSelectionsMessage = this.dataMaxSelectionsMessage
        return
      }
      this.maxSelectionsMessage = (this.maxChoices == 0) ? '' : 'You are permitted a maximum of ' + this.maxChoices + ' point' + (this.maxChoices > 1 ? 's' : '') + ' for this question.<br/><br/>Please remove one of your points before making another point.'
    },

    computeMinSelectionsMessage () {
      if (typeof this.dataMinSelectionsMessage !== 'undefined') {
        this.minSelectionsMessage = this.dataMinSelectionsMessage
        return
      }
      this.minSelectionsMessage = (this.minChoices == 0) ? '' : 'You must make at least ' + this.minChoices + ' point' + (this.minChoices > 1 ? 's' : '') + ' for this question.'
    },

    createId (prefix) {
      return `${prefix}${qtiAttributeValidation.randomString (5, 'a')}`
    },

    processChildren () {
      this.processBackgroundImage()

      // Build a UI
      this.processGroupUI()

      // Restore priorState - if any
      if (this.priorState !== null) {
        this.restoreValue(this.priorState)
      }
    },

    addPointFromClick (point) {
      const id = this.createId('p_')
      const pointElement = this.createPointElement(point, this.markerType, id)
      this.addPointListeners(pointElement)
      this.pointElements.set(id, pointElement)
      this.$refs.overlay.appendChild(pointElement)

      // Update state to reflect the current point(s)
      this.setState(this.computeState())
      // Update the response to reflect the current point(s)
      this.setResponse(this.computeResponse())
      // Update validity
      this.evaluateValidity()
    },

    /**
     * @description Delete all points and remove event handlers.
     */
    deleteAllPoints () {
      for (const [id, pointElement] of this.pointElements.values()) {
        this.deletePoint(id, pointElement)
      }
    },

    /**
     * @description Delete a point.
     * @param {String} id
     * @param {Object} pointElement 
     */
    deletePoint (id, pointElement) {
      this.removePointListeners(pointElement)
      this.pointElements.delete(id)
      pointElement.remove()
    },

    /**
     * @description Create new svg Point Element.  Used when creating a
     * new point from the overlay click handler.
     * @param {Object} point { x: x, y: y } on the overlay
     * @param {String} markerType
     * @param {String} id 
     */
    createPointElement (point, markerType, id) {
      const nativePoint = this.convertPoint(point.x, point.y, false)

      // Create the SVG point element marker
      const pointElement = 
          this.newPointElement(
                id,
                point, // scaled point
                nativePoint, // native point
                markerType,
                true // static
              )

      return pointElement
    },

    /**
     * @description Create new svg Point Element from an Object.  
     * Use when restoring state.
     * @param {Object} pointObject
     * {
     *   id: "<id>",
     *   marker: "<markertype>",
     *   point: "<x y>",
     *   static: <true|false>
     * }
     */
    restorePointElement (pointObject) {
      // Qti Points are strings in the format 'x y' with a space separator
      const coords = pointObject.point.split(' ')
      if (coords.length !== 2) return
      const scaledPoint = this.convertPoint(coords[0], coords[1], true)
      const nativePoint = { x: coords[0], y: coords[1] }

      // Create the SVG point element marker
      const pointElement = 
          this.newPointElement(
                pointObject.id,
                scaledPoint, // scaled point
                nativePoint, // native point
                pointObject.marker,
                pointObject.static)

      this.addPointListeners(pointElement)
      this.pointElements.set(pointObject.id, pointElement)
      this.$refs.overlay.appendChild(pointElement)
    },

    convertPoint (x, y, isRestore) {
      // Compute the Scaling Factor.
      // When responsive, the original image width divided by the current width.
      // When not responsive, the Scaling Factor is 1
      const scalingFactor = this.getScalingFactor()

      let newX, newY
      if (isRestore) {
        newX = Math.round(x / scalingFactor)
        newY = Math.round(y / scalingFactor)
      } else {
        newX = Math.round(x * scalingFactor)
        newY = Math.round(y * scalingFactor)
      }

      // Sanity checking
      if (newX < 0) newX = 0
      if (newX > this.bgImageProperties.w) newX = this.bgImageProperties.w
      if (newY < 0) newY = 0
      if (newY > this.bgImageProperties.h) newY = this.bgImageProperties.h

      return {
        x: newX,
        y: newY
      }
    },

    getScalingFactor () {
      return (this.isResponsive) 
                ? this.bgImageProperties.w / this.backgroundImageWidth
                : 1
    },

    newPointElement (id, point, dataPoint, markerType, isStatic) {
      // default marker type is a circle with radius 9, and a blue theme
      const el = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      el.setAttribute('cx', point.x)
      el.setAttribute('cy', point.y)
      el.setAttribute('r',  this.pointRadius)

      if (markerType === 'default-light') {
        el.setAttribute('fill', `orange`)
        el.setAttribute('fill-opacity', `.5`)
        el.setAttribute('stroke', `orange`)
      } else {
        el.setAttribute('fill', `#0088CC`)
        el.setAttribute('fill-opacity', `.5`)
        el.setAttribute('stroke', `blue`)
      }

      el.setAttribute('opacity', `1`)
      el.setAttribute('stroke-width', `1`)
      el.setAttribute('data-marker-type', markerType)
      el.setAttribute('id', `${id}`)
      el.setAttribute('class', `qti3-player-select-point ${(isStatic) ? 'static' : ''}`)
      el.setAttribute('tabindex', '0')
      el.setAttribute('data-point', `${dataPoint.x} ${dataPoint.y}`)
      return el
    },

    handleOverlayClick (event) {
      event.preventDefault()

      if (!this.checkMaxChoicesLimit()) {
        this.addPointFromClick(this.getMousePosition(event))
      }
    },

    /**
     * @description Handler for a click/touch on a point.  This removes the point.
     * @param event 
     */
    handlePointClick (event) {
      event.preventDefault()
      event.stopPropagation()

      if (this.isDisabled) return

      const pointElement = event.target
      const id = pointElement.getAttribute('id')

      // Remove the pointElement
      this.deletePoint(id, pointElement)

      // Update state to reflect the current point(s)
      this.setState(this.computeState())
      // Update the response to reflect the current point(s)
      this.setResponse(this.computeResponse())
      // Update validity
      this.evaluateValidity()
    },

    getMousePosition (event) {
      const CTM = this.$refs.overlay.getScreenCTM()
      if (event.touches) { event = event.touches[0] }
      const mouseX = (event.clientX - CTM.e) / CTM.a
      const mouseY = (event.clientY - CTM.f) / CTM.d
      return {
        x: mouseX,
        y: mouseY
      }
    },

    processGroupUI () {
      this.setResponse(null)
      this.setState(this.computeState())
      this.setIsValid(this.computeIsValid())
    },

    processBackgroundImage () {
      this.bgImageProperties = this.computeBackgroundImageProperties()

      if (this.bgImageProperties === null) {
        throw new QtiValidationException('Select Point interaction must have exactly one <img>, <object>, or <picture> node')
      }
      
      if (this.isResponsive) {
        this.backgroundImageWidth = `${this.bgImageProperties.element.offsetWidth}`
        this.backgroundImageHeight = `${this.bgImageProperties.element.offsetHeight}`
      } else {
        this.backgroundImageWidth = `${this.bgImageProperties.w}`
        this.backgroundImageHeight = `${this.bgImageProperties.h}`
        // When not responsive, container has static width/height
        this.$refs.selectpointgroup.setAttribute('style', `width:${this.backgroundImageWidth};height:${this.backgroundImageHeight}`)
      }
      
      this.overlayId = this.createId('spi_')
      this.$refs.overlay.setAttribute('id', this.overlayId)
      this.$refs.overlay.setAttribute('width', `${this.backgroundImageWidth}`)
      this.$refs.overlay.setAttribute('height', `${this.backgroundImageHeight}`)
      this.$refs.overlay.setAttribute('viewBox', `0 0 ${this.backgroundImageWidth} ${this.backgroundImageHeight}`)
      this.$refs.overlay.setAttribute('tabindex', '-1')
      this.$refs.overlay.setAttribute('role', 'application')
      this.$refs.overlay.setAttribute('focusable','false')

      this.createSvgImage(this.bgImageProperties, this.backgroundImageWidth, this.backgroundImageHeight)

      // Click handler and Resizer (if responsive)
      this.addOverlayListeners()
    },

    /**
     * @description Intended as a window resize handler.  
     * NOT USED 1/27/2025
     */
    handleResize () {
      // Get the new dimensions of the container
      this.backgroundImageWidth = this.$refs.overlay.parentNode.offsetWidth
      this.backgroundImageHeight = this.$refs.overlay.parentNode.offsetHeight

      // Update the SVG's width and height
      this.$refs.overlay.setAttribute('width', `${this.backgroundImageWidth}`)
      this.$refs.overlay.setAttribute('height', `${this.backgroundImageHeight}`)
    },

    /**
     * @description Find the image nested inside this QtiSelectPointInteraction.
     * Then attempt to compute the image's "native" width and height.  Width and 
     * height are gathered from the width and height attributes.
     * <object> and <img> elements are supported.
     * @TODO <picture> element
     */
    computeBackgroundImageProperties () {
      let bgElement = this.$refs.selectpointgroup.getElementsByTagName('img')
      if (bgElement.length === 1) {
        const w = bgElement[0].getAttribute('width')
        const h = bgElement[0].getAttribute('height')
        return this.createImageProperties(
            bgElement[0],
            bgElement[0].src,
            'img',
            w,
            h)
      }

      bgElement = this.$refs.selectpointgroup.getElementsByTagName('object')
      if (bgElement.length === 1) {
        const w = bgElement[0].getAttribute('width')
        const h = bgElement[0].getAttribute('height')
        return this.createImageProperties(
            bgElement[0],
            bgElement[0].data,
            'object',
            w,
            h)
      }

      return null

      /*
      @TODO: Figure out a way to deal with Picture
      */
    },

    createImageProperties (element, src, tag, width, height) {
      let ar = ((width === null) || (height === null)) ? 1.0 : (width / height)
      return {
        element: element,
        src: src,
        tag: tag,
        w: width,
        h: height,
        ar: ar
      }
    },

    /**
     * @description Build an SVG <image> element, add it to the overlay SVG,
     * then remove the original <object>, <img>, <picture> (future) element.
     * @param imageProperties 
     * @param width 
     * @param height 
     */
    createSvgImage(imageProperties, width, height) {
      // Create the SVG <image> element
      let image = document.createElementNS('http://www.w3.org/2000/svg', 'image')
      image.setAttribute('href', imageProperties.src)
      image.setAttribute('width', width)
      image.setAttribute('height', height)
      image.setAttribute('draggable', false)
      // Insert into overlay
      this.$refs.overlay.appendChild(image)
      // Remove the original <img> <object> <picture> element
      imageProperties.element.remove()
    },

    addOverlayListeners () {
      this.$refs.overlay.addEventListener('click', this.handleOverlayClick.bind(this))
    },

    removeOverlayListeners () {
      this.$refs.overlay.removeEventListener('click', this.handleOverlayClick)
    },

    addPointListeners (element) {
      element.addEventListener('click', this.handlePointClick.bind(this))
    },
    
    removePointListeners (element) {
      element.removeEventListener('click', this.handlePointClick)
    },

    /**
     * @description Sniff the class attribute (if any) for certain vocabulary.
     * @param classList staticClass property of the $vnode.data object
     */
    processClassAttribute (classList) {
      if ((typeof classList === 'undefined') || (classList === null) || (classList.length == 0)) {
        return
      }

      const clazzTokens = classList.split(' ')
      for (let index = 0; index < clazzTokens.length; index++) {
        switch (clazzTokens[index]) {
          case 'responsive':
            this.isResponsive = true
            break
          case 'marker-crosshair':
            this.markerType = 'crosshair'
            break
          case 'marker-default':
            this.markerType = 'default'
            break
          case 'marker-default-light':
            this.markerType = 'default-light'
            break
          default:
        }
      }
    },

    /**
     * @description Retrieve this interaction's prior state.
     * When not null, has this schema:
     * {
     *   identifier: [String],
     *   value: [String or Array]
     *   state: {
     *     points: [Array of Point Objects]
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
        throw new QtiEvaluationException('Select Point Interaction State Invalid.  "value" property not found.')
      }
      if (!('state' in priorState)) {
        throw new QtiEvaluationException('Select Point Interaction State Invalid.  "state" property not found.')
      }
      if (!('points' in priorState.state)) {
        throw new QtiEvaluationException('Select Point Interaction State Invalid.  "points" property not found in State.')
      }

      return priorState
    }
  },

  created () {
    try {
      this.responseDeclaration = qtiAttributeValidation.validateResponseIdentifierAttribute(store, this.responseIdentifier)
      
      // Sniff the class attribute to detect responsive or marker overrides
      this.processClassAttribute(this.$vnode.data.staticClass)

      // Pull any prior interaction state.
      this.priorState = this.getPriorState(this.responseIdentifier)

      qtiAttributeValidation.validateMaxMinChoices(this.maxChoices, this.minChoices)
      this.isSingle = (this.getCardinality() !== 'multiple')

      if (this.isSingle && (this.maxChoices != 1)) {
        throw new QtiValidationException('Invalid qti-select-point-interaction.  cardinality: "single", max-choices attribute: "' + this.maxChoices + '"')
      }

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
        this.processChildren()

        // Notify store of our new interaction
        store.defineInteraction({
            identifier: this.responseIdentifier,
            interactionType: 'SelectPoint',
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

  beforeUnmount () {
    this.removeOverlayListeners()
    for (const pointElement of this.pointElements.values()) {
      this.removePointListeners(pointElement)
    }
  }
}
</script>

<style>
.qti-select-point-interaction {
  margin: 0.5rem 0;
  display: block;
  width: 100%;
}

.qti-select-point-interaction .select-point-group {
  position: relative;
  display: inline-block;
  border: 1px solid transparent;
}

.qti-select-point-interaction.qti-bordered .select-point-group {
  border: 1px solid transparent;
}

.qti-select-point-interaction.responsive .select-point-group {
  width: 100%;
  height: auto;
}

.qti-select-point-interaction .select-point-group svg.select-point-overlay {
  outline: none;
  user-select: none;
  cursor: pointer;
}

.qti-select-point-interaction.responsive .select-point-group svg.select-point-overlay {
  display: block;
  width: 100%;
  height: auto;
}

.qti3-player-select-point {
  outline: none;
}
</style>
