import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'

class GapMatchInteractionWidget {

  constructor (container, options) {

    this.qtiAttributeValidation = new QtiAttributeValidation()

    // container should be the overall wrapper of our Match interaction
    this.wrapper = container
    // Get a handle on the element that wraps the source qti-gap-text's or qti-gap-img's
    this.sourcewrapper = this.wrapper.querySelector('.qti-gap-match-source-wrapper')
    // Get a handle on the element that wraps the target qti-gaps
    this.targetwrapper = this.wrapper.querySelector('.qti-gap-match-target-wrapper')

    // options is an object containing the interactionSubType, matchsets, and
    // an update callback function.
    this.processOptions(options)

    // Create references to the event handlers
    this.handleDragStart = this.handleDragStart.bind(this)
    this.handleDragMove = this.handleDragMove.bind(this)
    this.handleDragEnd = this.handleDragEnd.bind(this)
    this.handleTouchStart = this.handleTouchStart.bind(this)
    this.handleTouchMove = this.handleTouchMove.bind(this)
    this.handleTouchEnd = this.handleTouchEnd.bind(this)

    // Initialize variables used to track state
    this.itemTarget = null
    this.itemStart = null
    this.isItemStartSource = true
    this.initialX = 0
    this.initialY = 0
    this.offsetX = 0
    this.offsetY = 0
    this.startingX = 0
    this.startingY = 0
    this.currentAssociationsCount = 0

    // Initialize currentDragger state
    this.currentDragger = null

    this.initializeSources(this.sourcewrapper)
    this.initializeTargets(this.targetwrapper)
    this.restoreResponse(this.options.response)
    this.notifyReady()
    return this
  }

  options = {
    interactionSubType: 'default',
    cardinality: 'single',
    maxAssociations: 0,
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
    if ('cardinality' in options) this.options.cardinality = options.cardinality
    if ('response' in options) this.options.response = options.response
    if ('maxAssociations' in options) this.options.maxAssociations = options.maxAssociations
    if ('onReady' in options) this.options.onReady = options.onReady
    if ('onUpdate' in options) this.options.onUpdate = options.onUpdate
    if ('onAssociationsLimit' in options) this.options.onAssociationsLimit = options.onAssociationsLimit
  }

  notifyReady () {
    // onReady refers to a callback function that should be passed into this
    // widget by whatever loaded the widget
    if (this.options.onReady === null) return

    this.options.onReady({
        response: this.getResponse()
      })
  }

  notifyUpdate () {
    // onUpdate refers to a callback function that should be passed into this
    // widget by whatever loaded the widget
    if (this.options.onUpdate === null) return

    this.options.onUpdate({
        response: this.computeResponse()
      })
  }

  notifyAssociationsLimit () {
    if (this.options.onAssociationsLimit === null) return

    this.options.onAssociationsLimit()
  }

  handleDragStart (event) {
    event.preventDefault()
    if (event.button != 0) return
    this.interactionStart(event.target, event.clientX, event.clientY, false)
    return false
  }

  handleTouchStart (event) {
    event.preventDefault()
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
    this.identifyTargets(this.itemStart, true)

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

    // Create a new placeholder
    this.addPlaceholder(dragger)

    dragger.style.userSelect = 'none'
    dragger.style.width = draggerRect.width + 'px'
    dragger.style.height = draggerRect.height + 'px'
    dragger.style.transform = `translateX(${draggerRect.left}px) translateY(${draggerRect.top}px) translateZ(0)`

    // Add dragging class
    dragger.classList.add('dragging')

    // Important! set current selected dragger
    this.setCurrentDragger(dragger)

    // Bind the appropriate handlers
    this.addListeners(dragger, isTouch)
  }

  handleDragMove (event) {
    event.preventDefault()
    this.interactionMove(event.clientX, event.clientY)
  }

  handleTouchMove (event) {
    event.preventDefault()
    if (event.targetTouches.length != 1) return
    this.interactionMove(event.touches[0].clientX, event.touches[0].clientY)
  }

  interactionMove (coordX, coordY) {
    const dragger = this.currentDragger

    this.offsetX = coordX - this.initialX
    this.offsetY = coordY - this.initialY

    // Enforce wrapper boundaries on this.offsetX and this.offsetY
    this.constrainDraggerToWrapper(dragger, this.wrapper)

    dragger.style.transform = `translateX(${this.startingX + this.offsetX}px) translateY(${this.startingY + this.offsetY}px) translateZ(0) scale(1)`

    // Refresh dragger bounding rectangle following transform
    const draggerRect = dragger.getBoundingClientRect()

    // Inspect the targets
    this.findDraggerItemTarget(dragger, draggerRect, this.targets)

    // Inspect the sources if we did not start in a source
    if (!this.isItemStartSource) {
      this.findSourceDraggerTarget(dragger, draggerRect)
    }
  }

  /**
   * @description Constrain the given dragger to the bounding dimensions of the given wrapper.
   * This is accomplished by limiting this.offsetX and this.offsetY.
   * @param DomElement dragger - the dragger to constrain
   * @param DomElement wrapper - interaction wrapper constraining the dragger
   */
  constrainDraggerToWrapper (dragger, wrapper) {
    const draggerRect = dragger.getBoundingClientRect()
    const wrapperRect = wrapper.getBoundingClientRect()

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
    this.interactionEnd(event.clientX, event.clientY, false)
  }

  handleTouchEnd (event) {
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

    // Remove dragging class
    dragger.classList.remove('dragging')

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
      // against maxAssociations limit.
      if (this.isExceedingMaxAssociations(this.itemStart, this.itemTarget, dragger)) {
        // Dock the dragger to its pre-drag host.
        this.resetDraggerToItemStart(this.itemStart, dragger)
        // Trigger max associations message event
        this.notifyAssociationsLimit()
        // Reset currentDragger
        this.setCurrentDragger(null)
        // Always remove listeners
        this.removeListeners(dragger, isTouch)
        return
      }

      // Bail if we are setting the dragger into the same target where we started
      if (this.itemStart.getAttribute('data-identifier') === this.itemTarget.getAttribute('data-identifier')) {
        this.resetDraggerToItemStart(this.itemStart, dragger)
        // Reset currentDragger
        this.setCurrentDragger(null)
        // Always remove listeners
        this.removeListeners(dragger, isTouch)
        return
      }

      this.removePlaceholder(dragger)

      // Dock the dragger to the target
      this.setDraggerToItemTarget(this.itemTarget, dragger)

      // If we are docked to the sourcewrapper container, put the
      // dragger in its original order in the sourcewrapper.
      if (this.itemTarget.classList.contains('source')) {
        this.itemTarget.classList.add('full')
        if (this.itemTarget.dataset.matchMax*1 > 0) {
          this.incrementRemaining(this.itemTarget)
        }
        this.decrementAssociationsCount()
        this.sortContainerElements(this.sourcewrapper)
      }

      if (this.itemStart.classList.contains('source')) {
        if (this.itemStart.dataset.matchMax*1 > 0) {
          const remaining = this.decrementRemaining(this.itemStart)
          if (remaining === 0) {
            this.itemStart.classList.remove('full')
          }
        }

        this.incrementAssociationsCount()
      }

      if (this.itemStart.classList.contains('target')) {
        if (this.isTargetFull(this.itemStart)) {
          this.itemStart.classList.add('full')
        } else {
          this.itemStart.classList.remove('full')
        }
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
    this.replacePlaceholder(dragger)

    if (!itemStart.classList.contains('source')) {
      // Set the dragger's width to 100% of its container li
      dragger.setAttribute('style', 'width:100%')
    }
  }

  setDraggerToItemTarget (itemTarget, dragger) {
    if (itemTarget.classList.contains('source')) {
      if (itemTarget.classList.contains('full')) {
        // replace child
        // current source
        const childElement = itemTarget.querySelector('.draggable')
        if (childElement != null) {
          itemTarget.replaceChild(dragger, childElement)
        }
        return
      }

      itemTarget.append(dragger)
      return
    }

    // We are adding to a target, not a source
    itemTarget.append(dragger)

    // Set the dragger's width to 100% of its container li
    dragger.setAttribute('style', 'width:100%')

    if (this.isTargetFull(itemTarget))
      itemTarget.classList.add('full')
    else
      itemTarget.classList.remove('full')
  }

  findDraggerItemTarget (dragger, draggerRect, items) {
    this.itemTarget = null

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

        // Non-matching match-group's are not active
        if (!this.hasMatchingMatchGroup(dragger.parentNode, item)) return

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

      for (let i=0; i < this.sources.length; i++) {
        if (this.sources[i].dataset.identifier === dragger.dataset.identifier) {
          this.sources[i].classList.add('active')
          this.itemTarget = this.sources[i]
          break
        }
      }

    } else {
      // Find the first active source item
      for (let i=0; i < this.sources.length; i++) {
        if (this.sources[i].classList.contains('active')) {
          this.sources[i].classList.remove('active')
        }
      }
    }
  }

  addPlaceholder (draggableItem) {
    // If we are NOT coming from a source, use a generic placeholder
    if (!draggableItem.parentNode.classList.contains('source')) {
      this.addPlaceholderElement(draggableItem, false)
      return
    }
    
    //
    // Coming from a source.
    //
    const draggerMatchMax = draggableItem.parentNode.dataset.matchMax*1

    // If matchMax = 1, use a generic placeholder
    if (draggerMatchMax === 1) {
      this.addPlaceholderElement(draggableItem, false)
      return
    }

    // If matchMax = 0, use a clone placeholder
    if (draggerMatchMax === 0) {
      this.addPlaceholderElement(draggableItem, true)
      return
    }

    // matchMax must be >= 1, examine remaining matches
    const remaining = this.getRemaining(draggableItem.parentNode)

    if (remaining === 1) {
      // This is the last one.  Use a generic placeholder
      this.addPlaceholderElement(draggableItem, false)
      return
    }

    // Remaining >= 1, use a clone placeholder
    this.addPlaceholderElement(draggableItem, true)
  }

  addPlaceholderElement (draggableItem, isClone) {
    const placeholderElement = draggableItem.cloneNode(true)
    this.deepCloneId(placeholderElement)
    if (isClone) {
      placeholderElement.classList.add('clone')
      // Make clones draggable
      placeholderElement.addEventListener('mousedown', this.handleDragStart)
      placeholderElement.addEventListener('touchstart', this.handleTouchStart)
    } else {
      placeholderElement.classList.add('gm-dragger-placeholder')
    }
    // Fade the placeholder
    placeholderElement.classList.add('placeholder-fade')
    
    draggableItem.parentNode.insertBefore(placeholderElement, draggableItem)
  }

  removePlaceholder (draggableItem) {
    if (draggableItem.parentNode.classList.contains('target')) {

      const placeholderElement = draggableItem.parentNode.querySelector('.gm-dragger-placeholder')

      if (placeholderElement === null) return

      draggableItem.parentNode.removeChild(placeholderElement)
      return
    }
    
    // Must be coming from a source.
    const draggerMatchMax = draggableItem.parentNode.dataset.matchMax*1

    const placeholderElement = draggableItem.parentNode.querySelector('.gm-dragger-placeholder')

    if (placeholderElement === null) {
      const placeholderClone = draggableItem.parentNode.querySelector('.clone')
      if (placeholderClone === null) return
      // Restore full opacity
      placeholderClone.classList.remove('placeholder-fade')
      return
    }

    // Never remove the placeholder on sources with matchMax = 0
    if (draggerMatchMax === 0) return

    draggableItem.parentNode.removeChild(placeholderElement)
  }

  replacePlaceholder (draggableItem) {
    const parentNode = draggableItem.parentNode

    let placeholderElement = parentNode.querySelector('.gm-dragger-placeholder')

    if (parentNode.classList.contains('source')) {
      // Inside source list, a placeholder may be a draggable or a placeholder
      // If the placeholderElement is null thus far, try to find a draggable to replace.
      if (placeholderElement == null) {
        placeholderElement = parentNode.querySelector('.draggable')
      }

      if (placeholderElement === null) return

      parentNode.replaceChild(draggableItem, placeholderElement)
      return
    }

    // Must be inside a target
    if (placeholderElement === null) return

    parentNode.replaceChild(draggableItem, placeholderElement)
  }

  addClonePlaceholder (draggableItem) {
    const cloneElement = draggableItem.cloneNode(true)
    this.deepCloneId(cloneElement)
    cloneElement.classList.add('clone')
    draggableItem.parentNode.insertBefore(cloneElement, draggableItem)
    cloneElement.addEventListener('mousedown', this.handleDragStart)
    cloneElement.addEventListener('touchstart', this.handleTouchStart)
  }

  initializeSources (sourcewrapper) {
    this.sources = sourcewrapper.querySelectorAll('.source')

    // Assume all sources are initialized with a dragger
    this.sources.forEach((source) => {
        source.classList.add('full')
        const matchMax = source.dataset.matchMax*1
        this.setRemaining(source, (matchMax === 0 ? 1000 : matchMax))
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

  identifyTargets (itemStart, highlight) {
    this.targets.forEach((target) => {
      if (highlight 
        && !target.classList.contains('full')
        && this.hasMatchingMatchGroup(itemStart, target)) {
        target.classList.add('target-active')
      }
    }, this)

    // Only highlight sourcewrapper if we did not start in the sourcewrapper.
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
          sortArray.push([1*dragger.dataset.order, elements[i]])
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
    return this.computeResponse()
  }

  computeResponse () {
    let data = []

    // Iterate through the targets and get the data-identifiers of any
    // draggers that have been placed in a target.
    this.targets.forEach((target) => {
        target.querySelectorAll('.draggable').forEach((dragger) => {
            data.push(`${dragger.dataset.identifier} ${target.dataset.identifier}`)
          })
    })

    if (data.length === 0) return null

    if (this.options.cardinality === 'single') return data[0]

    return data
  }

  /**
   * @description Main method to restore the UI with a response
   * @param {*} response - can be null, a directedPair string, or an array of directedPair strings
   * @returns 
   */
  restoreResponse (response) {
    if (response === null) return

    if (this.options.cardinality === 'single') {
      this.restoreResponsePair(response)
    } else {
      response.forEach((response) => {
        this.restoreResponsePair(response)
      }, this)
    }
  }

  restoreResponsePair (response) {
    const directedPair = this.getPair(response)
    if (directedPair === null) return

    // 1. find source
    const source = this.findSourceByIdentifier(directedPair.source)
    // 2. find target
    const target = this.findTargetByIdentifier(directedPair.target)

    // Bail if either is not found (should never happen)
    if ((source === null) || (target === null)) return

    // 3. find source dragger
    const dragger = source.querySelector('.draggable')
    if (dragger === null) return

    // 4. Clone or empty source dragger - depending on maxChoices and remaining
    this.cloneOrEmptySourceDragger(source, dragger)

    // 5. Add dragger to target
    this.addSourceDraggerToTarget(target, dragger)
  }

  /**
   * @description Clone or empty a given source parent of a given dragger
   * @param {*} source parent of the dragger
   * @param {*} dragger 
   * @returns Updated source parent as empty or containing a dragger clone
   */
  cloneOrEmptySourceDragger (source, dragger) {
    const draggerMatchMax = source.dataset.matchMax*1

    // If matchMax = 1, empty the parent
    if (draggerMatchMax === 1) {
      source.classList.remove('full')
      this.decrementRemaining(source)
      return
    }

    // If matchMax = 0, use a clone placeholder
    if (draggerMatchMax === 0) {
      this.addClonePlaceholder(dragger)
      return
    }

    // matchMax must be > 1
    const remaining = this.getRemaining(source)

    if (remaining === 1) {
      // This is the last one.
      source.classList.remove('full')
      this.decrementRemaining(source)
      return
    }

    this.decrementRemaining(source)
    // Remaining > 1, use a clone placeholder
    this.addClonePlaceholder(dragger)
  }

  /**
   * Retrieve a source element with the given identifier.
   * @param {*} identifier - identifier of source element
   * @returns source element or null
   */
  findSourceByIdentifier (identifier) {
    for (let i=0; i < this.sources.length; i++) {
      if (identifier === this.sources[i].dataset.identifier) {
        return this.sources[i]
      }
    }
    return null
  }

  /**
   * Retrieve a target element with the given identifier.
   * @param {*} identifier - identifier of source element
   * @returns target element or null
   */
  findTargetByIdentifier (identifier) {
    for (let i=0; i < this.targets.length; i++) {
      if (identifier === this.targets[i].dataset.identifier) {
        return this.targets[i]
      }
    }
    return null
  }

  /**
   * @description Given a directedPair string, split the pair and return an object with 
   * source and target properties.
   * Example:  "a b" --> { source: "a", target: "b" }
   * @param {*} directedPair 
   * @returns Object - { source: "a", target: "b" }
   */
  getPair (directedPair) {
    if (directedPair === null) return null

    const splitPair = directedPair.split(' ')

    // Return null in case this is somehow malformed
    if (splitPair.length != 2) return null

    return { source: splitPair[0], target: splitPair[1] }
  }

  /**
   * @description Utility method to append a dragger to a target.
   * @param {*} target - target to which the dragger is appended.
   * @param {*} dragger - dragger to append to the target
   * @returns 
   */
  addSourceDraggerToTarget (target, dragger) {
    if ((target === null) || (dragger === null)) return

    target.append(dragger)

    // Set the dragger's width to 100% of its container li
    dragger.setAttribute('style', 'width:100%')

    if (this.isTargetFull(target)) {
      target.classList.add('full')
    }
  }

  hasMatchingMatchGroup (itemStart, target) {
    if (itemStart === null || target === null) return false
    return (itemStart.dataset.matchGroup === target.dataset.matchGroup)
  }

  isTargetFull (target) {
    if (target == null) return false

    const draggers = target.querySelectorAll('.draggable')
    const matchMax = target.dataset.matchMax*1
    return (matchMax === 0) ? false : (draggers.length >= matchMax)
  }

  isExceedingMaxAssociations(startItem, target) {
    // If maxAssociations is 0, then we can never exceed maxAssociations
    if (this.options.maxAssociations === 0) return false

    // If returning a dragger to a source bay, then we cannot be
    // exceeding maxAssociations
    if (target.classList.contains('source')) return false

    // If moving a dragger from one target to another, then we cannot be
    // exceeding maxAssociations
    if (startItem.classList.contains('target')) return false

    // If current full targets are less than maxAssociations then we
    // have room to grow.
    if (this.currentAssociationsCount < this.options.maxAssociations) return false

    // currentAssociationCount is >= maxAssociations, so no room to grow.
    return true
  }

  /**
   * @description Utility method to set currentAssociationsCount to 0
   */
  initializeAssociationsCount () {
    this.currentAssociationsCount = 0
  }

  /**
   * @description Utility method to increment currentAssociationsCount
   */
  incrementAssociationsCount () {
    this.currentAssociationsCount += 1
  }

  /**
   * @description Utility method to decrement currentAssociationsCount
   */
  decrementAssociationsCount () {
    if (this.currentAssociationsCount === 0) return
    this.currentAssociationsCount -= 1
  }

  getRemaining (element) {
    return element.dataset.remaining*1
  }

  setRemaining (element, remaining) {
    element.setAttribute('data-remaining', remaining)
  }

  incrementRemaining (element) {
    const remaining = element.dataset.remaining*1 + 1
    element.setAttribute('data-remaining', remaining)
    return remaining
  }

  decrementRemaining (element) {
    let remaining = element.dataset.remaining*1 - 1
    remaining = remaining >= 0 ? remaining : 0
    element.setAttribute('data-remaining', remaining)
    return remaining
  }

  /**
   * @description Method to generate new id's on elements that are cloned.
   * @param DomElement element 
   */
  deepCloneId (element) {
    if (element.id) {
      element.id = `clone_${this.qtiAttributeValidation.randomString (5, 'a')}`
    }

    // Clone any id's in any children of this element
    for (let i=0; i < element.children.length; i++) {
      this.deepCloneId(element.children[i])
    }
  }

  reset () {
    this.resetDraggersToSources()
    this.initializeAssociationsCount()
    this.destroy()
    // TODO: bind sources
  }

  resetDraggersToSources () {
    this.targets.forEach((target) => {
      // Get the draggers inside the target
      const draggers = target.querySelectorAll('.draggable')

      draggers.forEach((dragger) => {
        // Find the source that has the same data-identifier as the dragger
        const source = this.findSourceByIdentifier(dragger.getAttribute('data-identifier'))
        
        if (source.classList.contains('full')) return

        // 1) Empty the target
        target.classList.remove('full')

        // 2) Attach dragger to source, or delete it from the target.
        if (!source.classList.contains('full')) {
          source.append(dragger)
          source.classList.add('full')
        } else {
          target.removeChild(dragger)
        }

      }, this)
    }, this)
  }

  destroy () {
    if (this.currentDragger !== null) {
      document.removeEventListener('mousemove', this.handleDragMove)
      document.removeEventListener('mouseup', this.handleDragEnd)
    }

    const draggers = this.wrapper.querySelectorAll('.draggable')

    // Remove all dragger event listeners
    draggers.forEach((dragger) => {
        dragger.removeEventListener('touchstart', this.handleTouchStart)
        dragger.removeEventListener('touchmove', this.handleTouchMove)
        dragger.removeEventListener('touchend', this.handleTouchEnd)
        dragger.removeEventListener('mousedown', this.handleDragStart)
      }, this)
  }

}

export default GapMatchInteractionWidget
