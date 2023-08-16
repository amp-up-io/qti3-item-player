class MatchInteractionWidget {

  constructor (container, options) {

    // container should be the overall wrapper of our Match interaction
    this.wrapper = container
    // Get a handle on the element that wraps the source qti-simple-associable-choices
    this.sourcewrapper = this.wrapper.querySelector('.qti-match-source-wrapper')
    // Get a handle on the element that wraps the target qti-simple-associable-choices
    this.targetwrapper = this.wrapper.querySelector('.qti-match-target-wrapper')

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

    // Move the source qti-simple-associable-choices into targets
    this.restoreResponse()

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

    // Enforce wrapper boundaries on offsetX and offsetY
    this.constrainDraggerToWrapper(dragger)

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
        this.decrementAssociationsCount()
        this.sortContainerElements(this.sourcewrapper)
      }

      if (this.itemStart.classList.contains('source')) {
        this.itemStart.classList.remove('full')
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
    itemTarget.append(dragger)

    if (itemTarget.classList.contains('target')) {
      // Set the dragger's width to 100% of its container li
      dragger.setAttribute('style', 'width:100%')

      if (this.isTargetFull(itemTarget)) {
        itemTarget.classList.add('full')
      }
    }
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

  replacePlaceholder (draggableItem) {
    const parentNode = draggableItem.parentNode
    const placeholderElement = parentNode.querySelector('.dragger-placeholder')

    if (placeholderElement === null) return

    parentNode.replaceChild(draggableItem, placeholderElement)
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
    return this.computeResponse()
  }

  computeResponse () {
    let data = []

    switch (this.options.interactionSubType) {
      case 'default':
        // Iterate through the targets and pluck the data-identifiers of any
        // draggers that have been placed in a target.
        this.targets.forEach((target) => {
            const draggers = target.querySelectorAll('.draggable')
            draggers.forEach((dragger) => {
              const draggerIdentifier = dragger.getAttribute('data-identifier')
              const targetIdentifier = target.getAttribute('data-identifier')
              data.push(`${draggerIdentifier} ${targetIdentifier}`)
            })
        })

        break

      default:
    }

    if (data.length === 0) return null

    if (this.options.cardinality === 'single') return data[0]

    return data
  }

  restoreResponse () {
    if (this.options.response === null) return

    if (this.options.cardinality === 'single') {
      const directedPair = this.getPair(this.options.response)
      if (directedPair === null) return

      // 1. find source dragger
      const dragger = this.findSourceDraggerByIdentifier(directedPair.source)
      // 2. empty dragger parent
      this.emptyDraggerParent(dragger)
      // 3. find target
      const target = this.findTargetByIdentifier(directedPair.target)
      // 4. add dragger to target
      this.addSourceDraggerToTarget(target, dragger)
      return
    }

    this.options.response.forEach((response) => {
      const directedPair = this.getPair(response)
      if (directedPair === null) return

      // 1. find source dragger
      const dragger = this.findSourceDraggerByIdentifier(directedPair.source)
      // 2. empty dragger parent
      this.emptyDraggerParent(dragger)
      // 3. find target
      const target = this.findTargetByIdentifier(directedPair.target)
      // 4. add dragger to target
      this.addSourceDraggerToTarget(target, dragger)
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

  findTargetByIdentifier (identifier) {
    for (let i=0; i<this.targets.length; i++) {
      if (identifier === this.targets[i].getAttribute('data-identifier')) {
        return this.targets[i]
      }
    }
    return null
  }

  getPair (directedPair) {
    if (directedPair === null) return null

    const splitPair = directedPair.split(' ')

    // Return null in case this is somehow malformed
    if (splitPair.length != 2) return null

    return { source: splitPair[0], target: splitPair[1] }
  }

  addSourceDraggerToTargetAtIndex (index, dragger) {
    const target = this.targets[index]
    target.append(dragger)
    if (this.isTargetFull(target)) {
      target.classList.add('full')
    }
  }

  addTargetDraggerToSourceAtIndex (index, dragger) {
    const source = this.sources[index]
    source.append(dragger)
    source.classList.add('full')
  }

  addSourceDraggerToTarget (target, dragger) {
    if ((target === null) || (dragger === null)) return
    target.append(dragger)

    if (this.isTargetFull(target)) {
      target.classList.add('full')
    }
  }

  isTargetFull (target) {
    if (target == null) return false
    const draggers = target.querySelectorAll('.draggable')
    const matchMax = target.getAttribute('data-match-max') * 1
    return ((matchMax > 0) && (matchMax == draggers.length)) ? true : false
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

  initializeAssociationsCount () {
    this.currentAssociationsCount = 0
  }

  incrementAssociationsCount () {
    this.currentAssociationsCount += 1
  }

  decrementAssociationsCount () {
    if (this.currentAssociationsCount === 0) return
    this.currentAssociationsCount -= 1
  }

  reset () {
    if (this.options.interactionSubType === 'default') {
      this.resetDraggersToSources()
      this.initializeAssociationsCount()
    }

    this.destroy()
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
    if (this.options.interactionSubType === 'default') {

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

    }
  }

}

export default MatchInteractionWidget
