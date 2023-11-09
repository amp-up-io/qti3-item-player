import Sortable from 'sortablejs'

class OrderInteractionWidget {

  constructor (container, options) {

    // container should be the overall wrapper of our Order interaction
    this.wrapper = container
    // Get a handle on the element that wraps the qti-simple-choices
    this.sourcewrapper = this.wrapper.querySelector('.qti-order-source-wrapper')
    // Init sortable
    this.sortable = null
    // Init disabled state
    this.isDisabled = false

    // options is an object containing the interactionSubType and
    // an update callback function.
    this.processOptions(options)

    // Create references to the event handlers
    this.handleDragStart = this.handleDragStart.bind(this)
    this.handleDragMove = this.handleDragMove.bind(this)
    this.handleDragEnd = this.handleDragEnd.bind(this)
    this.handleTouchStart = this.handleTouchStart.bind(this)
    this.handleTouchMove = this.handleTouchMove.bind(this)
    this.handleTouchEnd = this.handleTouchEnd.bind(this)
    this.notifyUpdate = this.notifyUpdate.bind(this)

    if (this.options.interactionSubType === 'default') {

      // Initialize the Sortable.js lib which is used to manage default
      // Order interactions.
      this.sortable = new Sortable(this.sourcewrapper, {
        animation: 400,
        onEnd: this.notifyUpdate
      })

      // NOTE: No need to restore a response for 'default' order
      // interactions because the source qti-simple-choice Elements
      // are already in their proper order.

    } else  if (this.options.interactionSubType === 'ordermatch') {

      // Initialize variables used to track state ONLY WHEN
      // the interactionSubType is 'ordermatch'.
      // These are not used when the interactionSubType is 'default'.
      this.itemTarget = null
      this.itemStart = null
      this.isItemStartSource = true
      this.initialX = 0
      this.initialY = 0
      this.offsetX = 0
      this.offsetY = 0
      this.startingX = 0
      this.startingY = 0
      this.currentTargetCount = 0

      // Initialize currentDragger state
      this.currentDragger = null

      this.initializeSources(this.sourcewrapper)
      this.targetwrapper = this.wrapper.querySelector('.qti-order-target-wrapper')
      this.initializeTargets(this.targetwrapper)

      // Move the source qti-simple-choices into targets
      this.restoreResponse()
    }

    this.notifyReady()
    return this
  }

  options = {
    interactionSubType: 'default',
    maxChoices: 0,
    response: null,
    onReady: null,
    onUpdate: null,
    onSelectionsLimit: null
  }

  /**
   * @description Examine the options parameter and move certain properties
   * over to the options variable.
   * @param {Object} options
   */
  processOptions (options) {
    if ('interactionSubType' in options) this.options.interactionSubType = options.interactionSubType
    if ('response' in options) this.options.response = options.response
    if ('maxChoices' in options) this.options.maxChoices = options.maxChoices
    if ('onReady' in options) this.options.onReady = options.onReady
    if ('onUpdate' in options) this.options.onUpdate = options.onUpdate
    if ('onSelectionsLimit' in options) this.options.onSelectionsLimit = options.onSelectionsLimit
  }

  notifyReady () {
    // onReady refers to a callback function that should be passed into this
    // widget by whatever loaded the widget
    if (this.options.onReady === null) return

    this.options.onReady({
        response: this.getResponse()
      })
  }

  notifyUpdate (param) {
    // onUpdate refers to a callback function that should be passed into this
    // widget by whatever loaded the widget
    if (this.options.onUpdate === null) return

    this.options.onUpdate({
        response: this.computeResponse(param)
      })
  }

  notifySelectionsLimit () {
    if (this.options.onSelectionsLimit === null) return

    this.options.onSelectionsLimit()
  }

  toggleDisable (isDisabled) {
    this.isDisabled = isDisabled

    if ((this.options.interactionSubType === 'default') && (this.sortable !== null)) {
      // Disable sortable
      this.sortable.option('disabled', isDisabled)

      // Update the class of all draggers
      const draggers = this.sourcewrapper.querySelectorAll('.draggable')
      this.enableDisableDraggers(draggers, isDisabled)
      return
    }
    
    // Subtype is presumed 'ordermatch'
    this.enableDisableDraggers(this.draggers, isDisabled)
  }

  handleDragStart (event) {
    event.preventDefault()
    if (this.isDisabled) return
    if (event.button != 0) return
    this.interactionStart(event.target, event.clientX, event.clientY, false)
    return false
  }

  handleTouchStart (event) {
    event.preventDefault()
    if (this.isDisabled) return
    if (event.targetTouches.length != 1) return false
    this.interactionStart(event.target, event.touches[0].pageX, event.touches[0].pageY, true)
    return false
  }

  interactionStart (dragElement, coordX, coordY, isTouch) {
    // Get a handle on the draggable container of the dragElement
    const dragger = this.getClosestElement(dragElement, 'draggable')

    // Get a handle on our starting container of the dragger
    this.itemStart = dragger.parentNode

    this.isItemStartSource = this.itemStart.classList.contains('source')

    // Look for targets
    this.identifyTargets(true)

    // Clear out any prior located target
    this.itemTarget = null

    // Save our starting coordinates
    const draggerRect = dragger.getBoundingClientRect()
    this.initialX = coordX
    this.initialY = coordY
    this.startingX = draggerRect.left
    this.startingY = draggerRect.top
    this.offsetX = coordX - this.startingX
    this.offsetY = coordY - this.startingY

    dragger.style.userSelect = 'none'
    dragger.style.width = draggerRect.width + 'px'
    dragger.style.height = draggerRect.height + 'px'
    dragger.style.transform = `translateX(${draggerRect.left}px) translateY(${draggerRect.top}px) translateZ(0)`

    // Remove any existing placeholder
    this.removePlaceholder(dragger)

    // Create a new placeholder
    this.addPlaceholder(dragger)

    // Add dragging class
    if (!dragger.classList.contains('dragging')) {
      dragger.classList.add('dragging')
    }

    // Important! set current selected dragger
    this.setCurrentDragger(dragger)

    // Bind the appropriate handlers
    this.addListeners(dragger, isTouch)
  }

  handleDragMove (event) {
    event.preventDefault()
    if (this.isDisabled) return
    this.interactionMove(event.clientX, event.clientY)
  }

  handleTouchMove (event) {
    event.preventDefault()
    if (this.isDisabled) return
    if (event.targetTouches.length != 1) return
    this.interactionMove(event.touches[0].clientX, event.touches[0].clientY)
  }

  interactionMove (coordX, coordY) {
    const dragger = this.currentDragger

    this.offsetX = coordX - this.initialX
    this.offsetY = coordY - this.initialY

    // Enforce wrapper boundaries on offsetX and offsetY
    this.constrainDraggerToWrapper(dragger)

    dragger.style.transform = `translateX(${this.startingX + this.offsetX}px) translateY(${this.startingY + this.offsetY}px) translateZ(0) scale(1)`

    // Refresh dragger bounding rectangle following transform
    const draggerRect = dragger.getBoundingClientRect()

    // Inspect the targets
    this.findDraggerTarget(dragger, draggerRect, this.targets)

    // Inspect the sources if we did not start in a source
    if (!this.isItemStartSource) {
      this.findSourceDraggerTarget(dragger, draggerRect, this.sources)
    }
  }

  constrainDraggerToWrapper (dragger) {
    const draggerRect = dragger.getBoundingClientRect()
    const wrapperRect = this.wrapper.getBoundingClientRect()

    const lowerX = this.startingX + this.offsetX - wrapperRect.x
    const lowerY = this.startingY + this.offsetY - wrapperRect.y
    const upperX = this.startingX + draggerRect.width + this.offsetX - (wrapperRect.x + wrapperRect.width)
    const upperY = this.startingY + draggerRect.height + this.offsetY - (wrapperRect.y + wrapperRect.height)

    if (lowerX < 0) {
      this.offsetX = this.offsetX - lowerX
    }
    if (upperX > 0) {
      this.offsetX = this.offsetX - upperX
    }
    if (lowerY < 0) {
      this.offsetY = this.offsetY - lowerY
    }
    if (upperY > 0) {
      this.offsetY = this.offsetY - upperY
    }
  }

  handleDragEnd (event) {
    if (this.isDisabled) return
    this.interactionEnd(event.clientX, event.clientY, false)
  }

  handleTouchEnd (event) {
    if (this.isDisabled) return
    this.interactionEnd(event.changedTouches[0].clientX, event.changedTouches[0].clientY, true)
  }

  interactionEnd (coordX, coordY, isTouch) {
    const dragger = this.currentDragger

    if (this.itemTarget === null) {
      // No target.  Send it back to its origin
      dragger.style.transform = `translateX(${this.startingX}px) translateY(${this.startingY}px) translateZ(0)`
    } else {
      // Move it into the target
      dragger.style.transform = `translateX(${this.startingX + this.offsetX}px) translateY(${this.startingY + this.offsetY}px) translateZ(0)`
    }

    // Clean out any hanging style (such as the transform, width, and height)
    dragger.removeAttribute('style')

    this.removePlaceholder(dragger)

    // Removes dragging class
    if (dragger.classList.contains('dragging')) {
      dragger.classList.remove('dragging')
    }

    this.clearTargetHighlights()

    if (this.itemTarget === null) {
      // No target.  Dock the dragger to its pre-drag host.
      this.resetDraggerToItemStart(this.itemStart, dragger)
      // Reset currentDragger
      this.setCurrentDragger(null)
      // Always remove listeners
      this.removeListeners(dragger, isTouch)
      return
    }

    if (this.itemTarget.classList.contains('active')) {
      this.itemTarget.classList.remove('active')

      // We have an active target. Before we dock, check if we are up
      // against maxChoices limit.
      if (this.isExceedingMaxChoices(this.itemStart, this.itemTarget, dragger)) {
        // Dock the dragger to its pre-drag host.
        this.resetDraggerToItemStart(this.itemStart, dragger)
        // Trigger max selections message event
        this.notifySelectionsLimit()
        // Reset currentDragger
        this.setCurrentDragger(null)
        // Always remove listeners
        this.removeListeners(dragger, isTouch)
        return
      }

      // Everything ok, dock the dragger.
      this.itemStart.classList.remove('full')
      // Dock the dragger to the target
      this.setDraggerToItemTarget(this.itemTarget, dragger)

      // If we are docked to the sourcewrapper container, put the
      // dragger in its original order in the sourcewrapper.
      if (this.itemTarget.classList.contains('source')) {
        this.decrementTargetCount()
        this.sortContainerElements(this.sourcewrapper)
      }

      if (!this.itemStart.classList.contains('target')) {
        this.incrementTargetCount()
      }

      // Important: callback when we have an update.
      this.notifyUpdate()
    }

    // Reset currentDragger
    this.setCurrentDragger(null)
    // Always remove listeners
    this.removeListeners(dragger, isTouch)
  }

  setCurrentDragger (dragger) {
    this.currentDragger = dragger
  }

  resetDraggerToItemStart (itemStart, dragger) {
    itemStart.append(dragger)
    itemStart.classList.add('full')
    // Set the dragger's width to 100% of its container li
    dragger.setAttribute('style', 'width:100%')
  }

  setDraggerToItemTarget (itemTarget, dragger) {
    itemTarget.append(dragger)
    itemTarget.classList.add('full')
    // Set the dragger's width to 100% of its container li
    dragger.setAttribute('style', 'width:100%')
  }

  findDraggerTarget (dragger, draggerRect, items) {
    items.forEach((item) => {
      const itemRect = item.getBoundingClientRect()

      if (draggerRect.top + dragger.offsetHeight / 2 < itemRect.bottom &&
          draggerRect.right - dragger.offsetWidth / 2 > itemRect.left &&
          draggerRect.bottom - dragger.offsetHeight / 2 > itemRect.top &&
          draggerRect.left + dragger.offsetWidth / 2 < itemRect.right) {

        // Source items may not be placed in Source lists
        if (this.isItemStartSource && item.classList.contains('source')) return

        // Full items are not active
        if (item.classList.contains('full')) return

        item.classList.add('active')
        this.itemTarget = item

      } else {
        item.classList.remove('active')
      }
    }, this)
  }

  findSourceDraggerTarget (dragger, draggerRect) {
    const sourceWrapperRect = this.sourcewrapper.getBoundingClientRect()

    if (draggerRect.top + dragger.offsetHeight / 2 < sourceWrapperRect.bottom &&
        draggerRect.right - dragger.offsetWidth / 2 > sourceWrapperRect.left &&
        draggerRect.bottom - dragger.offsetHeight / 2 > sourceWrapperRect.top &&
        draggerRect.left + dragger.offsetWidth / 2 < sourceWrapperRect.right) {

      // Find the first empty source item
      for (let i=0; i<this.sources.length; i++) {
        if (!this.sources[i].classList.contains('full')) {
          this.sources[i].classList.add('active')
          this.itemTarget = this.sources[i]
          break
        }
      }

    } else {
      // Find the first active source item
      for (let i=0; i<this.sources.length; i++) {
        if (this.sources[i].classList.contains('active')) {
          this.sources[i].classList.remove('active')
        }
      }
    }
  }

  addPlaceholder (draggableItem) {
    const draggableItemRect = draggableItem.getBoundingClientRect()

    // Create the element
    const spacerElement = document.createElement('div')
    spacerElement.classList.add('dragger-placeholder')
    spacerElement.style.width = `${draggableItemRect.width}px`
    spacerElement.style.height = `${draggableItemRect.height}px`

    // Append the element before the active draggable item
    draggableItem.parentNode.insertBefore(spacerElement, draggableItem)
  }

  removePlaceholder (draggableItem) {
    const placeholderElement = draggableItem.parentNode.querySelector('.dragger-placeholder')

    if (placeholderElement === null) return

    draggableItem.parentNode.removeChild(placeholderElement)
  }

  enableDisableDraggers (draggers, isDisabled) {
    draggers.forEach((dragger) => {
      if (isDisabled)
        dragger.classList.add('disabled')
      else
        dragger.classList.remove('disabled')
    })
  }

  initializeSources (sourcewrapper) {
    this.sources = sourcewrapper.querySelectorAll('.source')

    // Assume all sources are initialized with a dragger
    this.sources.forEach((source) => {
        source.classList.add('full')
      }, this)

    this.draggers = sourcewrapper.querySelectorAll('.draggable')

    this.draggers.forEach((dragger, index) => {
        const sourceIdentifier = dragger.parentNode.getAttribute('data-identifier')
        dragger.setAttribute('data-identifier', sourceIdentifier)
        dragger.setAttribute('data-order', index)
        dragger.setAttribute('tabindex', 0)
        dragger.addEventListener('mousedown', this.handleDragStart)
        dragger.addEventListener('touchstart', this.handleTouchStart)
      }, this)
  }

  initializeTargets (targetwrapper) {
    this.targets = targetwrapper.querySelectorAll('.target')
    this.targets.forEach((target) => {
      target.setAttribute('tabindex', 0)
    })
  }

  identifyTargets (highlight) {
    for (let i=0; i<this.targets.length; i++) {
      if (highlight && !this.targets[i].classList.contains('full')) {
        this.targets[i].classList.add('target-active')
      }
    }

    if (highlight && !this.isItemStartSource) {
      this.sourcewrapper.classList.add('target-active')
    }
  }

  addListeners (dragger, isTouch) {
    if (isTouch) {
      this.removeListeners(dragger, isTouch)
      dragger.addEventListener('touchmove', this.handleTouchMove)
      dragger.addEventListener('touchend', this.handleTouchEnd)
    } else {
      this.removeListeners(dragger, isTouch)
      // Add event listeners to the *document* to deal with 
      //the lost dragger issue.
      document.addEventListener('mousemove', this.handleDragMove)
      document.addEventListener('mouseup', this.handleDragEnd)
    }
  }

  removeListeners (dragger, isTouch) {
    if (isTouch) {
      dragger.removeEventListener('touchmove', this.handleTouchMove)
      dragger.removeEventListener('touchend', this.handleTouchEnd)
    } else {
      document.removeEventListener('mousemove', this.handleDragMove)
      document.removeEventListener('mouseup', this.handleDragEnd)
    }
  }

  clearTargetHighlights () {
    this.targets.forEach((target) => {
        target.classList.remove('target-active')
      }, this)

    this.sourcewrapper.classList.remove('target-active')
  }

  getClosestElement (element, classToSearch) {
    if (!element) return false

    if (element && element.classList.contains(classToSearch)) return element

    return this.getClosestElement(element.parentElement, classToSearch)
  }

  /**
   * @description In-place sorting of container elements.  The sort order
   * is dependent on the data-order attribute of each element.
   * @param {DomElement} container of elements to be sorted.
   */
  sortContainerElements (container) {
    let sortArray = []
    let elements = container.children

    // Walk through the elements.  Inspect the data-order
    // attribute of each element.  Build the sortArray.
    for (let i=0; i<elements.length; i++) {
      const dragger = elements[i].querySelector('div.draggable')
      if (dragger) {
        const order = dragger.getAttribute('data-order')
        sortArray.push([1*order, elements[i]])
      }
    }

    // Sort the sortArray.  Elements with the lowest order will be first.
    sortArray.sort(function(x, y) {
      return x[0] - y[0]
    })

    // Append the sorted elements again.  The old element will be
    // moved to the new position.
    for (let i=0; i<sortArray.length; i++) {
      container.appendChild(sortArray[i][1])
    }
  }

  getResponse () {
    if (this.options.interactionSubType === 'default') {
      return this.computeResponse({ target: this.sourcewrapper })
    }

    return this.computeResponse()
  }

  computeResponse (event) {
    let data = []

    switch (this.options.interactionSubType) {
      case 'default':
        // For default Order interactions, the event is a Sortable.js event
        // which has a 'target' property containing a reference to the
        // sourcewrapper element.  The sourcewrapper element contains
        // the current order of the qti-simple-choices.
        event.target.querySelectorAll('.qti-simple-choice').forEach((choice) => {
          data.push(choice.getAttribute('data-identifier'))
        })

        break
      case 'ordermatch':
        // For ordermatch Order interactions, we ignore the event.  The
        // order of the targets represents the potential order of the sources.
        // Iterate through the targets and pluck the data-identifiers of any
        // draggers that have been placed in a target.
        this.targets.forEach((target) => {
          if (target.classList.contains('full')) {
            // When a target is full, push the data-identifier of the dragger
            const dragger = target.querySelector('.draggable')
            if (dragger !== null) {
              data.push(dragger.getAttribute('data-identifier'))
              return
            }
          }

          // When a target is not full, or if we somehow do not have an inner
          // dragger on a full target, push a null
          data.push(null)
        })

        break
    }

    return data
  }

  restoreResponse () {
    if (this.options.response === null) return

    this.options.response.forEach((response, index) => {
      if (response !== null) {
        // 1. find source dragger
        const dragger = this.findSourceDraggerByIdentifier(response)
        // 2. empty dragger parent
        this.emptyDraggerParent(dragger)
        // 3. add dragger to target
        this.addSourceDraggerToTargetAtIndex(index, dragger)
      }
    }, this)
  }

  findSourceDraggerByIdentifier (identifier) {
    for (let i=0; i<this.draggers.length; i++) {
      if (identifier === this.draggers[i].getAttribute('data-identifier')) {
        return this.draggers[i]
      }
    }
    return null
  }

  addSourceDraggerToTargetAtIndex (index, dragger) {
    const target = this.targets[index]
    target.append(dragger)
    target.classList.add('full')
  }

  addTargetDraggerToSourceAtIndex (index, dragger) {
    const source = this.sources[index]
    source.append(dragger)
    source.classList.add('full')
  }

  emptyDraggerParent (dragger) {
    dragger.parentNode.classList.remove('full')
  }

  findSourceByIdentifier (identifier) {
    for (let i=0; i<this.sources.length; i++) {
      if (identifier === this.sources[i].getAttribute('data-identifier')) {
        return this.sources[i]
      }
    }
    return null
  }

  isExceedingMaxChoices(startItem, target) {
    // If maxChoices is 0, then we can never exceed maxChoices
    if (this.options.maxChoices === 0) return false

    // If returning a dragger to a source bay, then we cannot be
    // exceeding maxChoices
    if (target.classList.contains('source')) return false

    // If moving a dragger from one target to another, then we cannot be
    // exceeding maxChoices
    if (startItem.classList.contains('target')) return false

    // If current full targets are less than maxChoices then we
    // have room to grow.
    if (this.currentTargetCount < this.options.maxChoices) return false

    // currentTargetCount is >= maxChoices, so no room to grow.
    return true
  }

  initializeCurrentTargetCount () {
    this.currentTargetCount = 0
  }

  incrementTargetCount () {
    this.currentTargetCount += 1
  }

  decrementTargetCount () {
    if (this.currentTargetCount === 0) return
    this.currentTargetCount -= 1
  }

  reset () {
    if (this.options.interactionSubType === 'ordermatch') {
      this.resetDraggersToSources()
      this.initializeCurrentTargetCount()
    }

    this.destroy()
  }

  resetDraggersToSources () {
    this.targets.forEach((target) => {
      if (target.classList.contains('full')) {
        // Get the dragger inside the full target
        const dragger = target.querySelector('.draggable')

        // Find the source that has the same data-identifier as the dragger
        const source = this.findSourceByIdentifier(dragger.getAttribute('data-identifier'))

        // The source should not be full, but check anyway
        if (source.classList.contains('full')) return

        // 1) empty the target
        this.emptyDraggerParent(dragger)
        // 2) append dragger to the source
        source.append(dragger)
        source.classList.add('full')
      }
    }, this)
  }

  destroy () {
    if (this.options.interactionSubType === 'ordermatch') {

      if (this.currentDragger !== null) {
        document.removeEventListener('mousemove', this.handleDragMove)
        document.removeEventListener('mouseup', this.handleDragEnd)
      }

      // Remove all dragger event listeners
      this.draggers.forEach((dragger) => {
          dragger.removeEventListener('touchstart', this.handleTouchStart)
          dragger.removeEventListener('touchmove', this.handleTouchMove)
          dragger.removeEventListener('touchend', this.handleTouchEnd)
          dragger.removeEventListener('mousedown', this.handleDragStart)
        }, this)

      // Remove the target wrapper
      this.targetwrapper.remove()
    }
  }

}

export default OrderInteractionWidget
