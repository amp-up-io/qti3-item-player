class MatchInteractionTabularWidget {

  constructor (container, options) {

    // Container should be the overall wrapper of our Match interaction
    this.wrapper = container
    // Get a handle on the table element injected by the presentation factory
    this.table = this.wrapper.querySelector('table.matchtabular')
    // Get a handle on the element that wraps the source qti-simple-associable-choices
    this.sourcewrapper = this.wrapper.querySelector('.qti-match-source-wrapper')
    // Get a handle on the element that wraps the target qti-simple-associable-choices
    this.targetwrapper = this.wrapper.querySelector('.qti-match-target-wrapper')
    // Init associations
    this.currentAssociationsCount = 0
    // Init disabled flag
    this.isDisabled = false

    // options is an object containing the interactionSubType, matchsets, and
    // an update callback function.
    this.processOptions(options)

    // Create references to the event handlers
    this.handleClick = this.handleClick.bind(this)
    this.handleKeydown = this.handleKeydown.bind(this)
    this.handleFocus = this.handleFocus.bind(this)
    this.handleBlur = this.handleBlur.bind(this)

    this.state = new Map()

    // Build the table ui
    this.initializeTable(this.sourcewrapper, this.targetwrapper)

    this.restoreResponse()

    this.notifyReady()
    return this
  }

  options = {
    interactionSubType: 'matchtabular',
    isHeaderHidden: false,
    isRowCentric: false,
    firstColumnHeader: null,
    cardinality: 'single',
    maxAssociations: 0,
    response: null,
    onReady: null,
    onUpdate: null,
    onSelectionsLimit: null,
  }

  keyCodes = {
    'Enter'     : 13,
    'Space'     : 32,
    'End'       : 35,
    'Home'      : 36,
    'ArrowLeft' : 37,
    'ArrowUp'   : 38,
    'ArrowRight': 39,
    'ArrowDown' : 40
  }

  /**
   * @description Examine the options parameter and move certain properties
   * over to the options variable.
   * @param {Object} options
   */
  processOptions (options) {
    if ('interactionSubType' in options) this.options.interactionSubType = options.interactionSubType
    if ('isHeaderHidden' in options) this.options.isHeaderHidden = options.isHeaderHidden
    if ('isRowCentric' in options) this.options.isRowCentric = options.isRowCentric
    if ('firstColumnHeader' in options) this.options.firstColumnHeader = options.firstColumnHeader
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

  toggleDisable (isDisabled) {
    this.isDisabled = isDisabled

    this.controls.forEach((control) => {
      if (isDisabled)
        control.classList.add('disabled')
      else
        control.classList.remove('disabled')
    })
  }

  handleClick (event) {
    if (this.isDisabled) return

    if (this.isRadio(event.target)) {
      // For radio buttons, we always set check state to true on a click.
      this.setControlChecked(event.target)
      return
    }
    
    // It's a checkbox.  Toggle check state.
    this.toggleControl(event.target)
  }

  handleKeydown (event) {
    let flag = false

    switch (event.code) {
      case 'Space':
      case 'Enter':
        if (!this.isDisabled) {
          // Toggle check state - even if it's a radio button
          this.toggleControl(event.target)
        }
        flag = true
        break

      case 'ArrowUp':
      case 'ArrowLeft':
        // Handle these keys if this is a radio button
        //if (this.isRadio) {
        //  //this.$parent.$emit('setFocusPreviousChoice', this.identifier)
        flag = true
        break

      case 'ArrowDown':
      case 'ArrowRight':
        // Handle these keys if this is a radio button.
        //if (this.isRadio) {
        //  this.$parent.$emit('setFocusNextChoice', this.identifier)
        flag = true
        break

      default:
        break
    }

    if (flag) {
      event.stopPropagation()
      event.preventDefault()
    }
  }

  handleFocus () {
    // NOOP

  }

  handleBlur () {
    // NOOP
  }

  toggleControl (control) {
    if (!this.isChecked(control)) {
      if (this.isExceedingMaxAssociations()) {
        this.notifyAssociationsLimit()
        return
      }

      if (this.isExceedingMatchMax(control.dataset.pair, control.dataset.sourceMax*1, true)) {
        // TODO - some kind of notification?
        return
      }
      if (this.isExceedingMatchMax(control.dataset.pair, control.dataset.targetMax*1, false)) {
        // TODO - some kind of notification?
        return
      }
      
      this.updateState(control.dataset.pair, this.toggleChecked(control))
      this.notifyUpdate()
      return
    }

    this.updateState(control.dataset.pair, this.toggleChecked(control))
    this.notifyUpdate()
  }

  setControlChecked (control) {
    if (!this.isChecked(control)) {
      if (this.isExceedingMaxAssociations()) {
        this.notifyAssociationsLimit()
        return
      }

      if (this.isExceedingMatchMax(control.dataset.pair, control.dataset.sourceMax*1, true)) {
        // TODO - some kind of notification?
        return
      }
      if (this.isExceedingMatchMax(control.dataset.pair, control.dataset.targetMax*1, false)) {
        // TODO - some kind of notification?
        return
      }

      this.updateState(control.dataset.pair, this.setChecked(control, true))
      this.notifyUpdate()
      return
    }

    this.updateState(control.dataset.pair, this.setChecked(control, true))
    this.notifyUpdate()
  }

  setChecked (element, checked) {
    const ariaChecked = checked ? 'true' : 'false'
    element.setAttribute('aria-checked', ariaChecked)
    return ariaChecked
  }

  toggleChecked (element) {
    const ariaChecked = element.getAttribute('aria-checked')
    const toggle = ariaChecked === 'true' ? 'false' : 'true'
    element.setAttribute('aria-checked', toggle)
    return toggle
  }

  isRadio (element) {
    if (element === null) return false
    const role = element.getAttribute('role')
    return (role === 'radio')
  }

  isChecked (element) {
    if (element === null) return false
    const ariaChecked = element.getAttribute('aria-checked')
    return (ariaChecked === 'true')
  }

  setTabIndex (tabIndex) {
    this.tabIndex = tabIndex
  }

  setFocus () {
    // NOOP
  }

  setBlur () {
    // NOOP
  }

  updateState (identifier, controlState) {
    this.state.set(identifier, controlState)

    this.currentAssociationsCount = 0

    for (let checked of this.state.values()) {
      if (checked === 'true') this.currentAssociationsCount += 1
    }
  }

  initializeTable (sourcewrapper, targetwrapper) {
    this.sources = this.getChoices(sourcewrapper)
    this.targets = this.getChoices(targetwrapper)

    const columnWidthStyle = `width:${this.getColumnWidthPercentage(this.targets.length)}%`

    this.table.innerHTML = `${this.getHeader(columnWidthStyle)}${this.getBody(columnWidthStyle)}`

    this.controls = this.table.querySelectorAll('.control-cell')

    this.controls.forEach((control) => {
        const controlIdentifier = control.getAttribute('data-pair')
        this.updateState(controlIdentifier, 'false')
        control.addEventListener('click', this.handleClick)
        control.addEventListener('keydown', this.handleKeydown)
        control.addEventListener('focus', this.handleFocus)
        control.addEventListener('blur', this.handleBlur)
      }, this)
  }

  getHeader (columnWidthStyle) {
    if (this.options.isHeaderHidden) return ''

    let result = `<th scope="col" class="header-cell">${this.options.firstColumnHeader == null ? '' : this.options.firstColumnHeader}</th>`

    // When row-centric, the sources become the column headers
    if (this.options.isRowCentric) {
      result += this.getSourceHeader(columnWidthStyle)
      return `<thead>${result}</thead>`
    }

    // When not row-centric (default), the targets become the column headers
    result += this.getTargetHeader(columnWidthStyle)
    return `<thead>${result}</thead>`
  }

  getTargetHeader (columnWidthStyle) {
    let result = ''

    this.targets.forEach((target) => {
      result += `<th scope="col" class="header-cell" style="${columnWidthStyle}">${target.innerHTML}</th>`
    })

    return result
  }

  getSourceHeader (columnWidthStyle) {
    let result = ''
    
    this.sources.forEach((source) => {
      result += `<th scope="col" class="header-cell" style="${columnWidthStyle}">${source.innerHTML}</th>`
    })

    return result
  }

  getBody (columnWidthStyle) {
    let result = ''

    if (this.options.isRowCentric) {
      this.targets.forEach((target) => {
        result += `<tr><th scope="row" class="row-header-cell">${target.innerHTML}</th>`
  
        const targetMatchMax = target.getAttribute('data-match-max')
  
        this.sources.forEach((source) => {
          const sourceMatchMax = source.getAttribute('data-match-max')
          const sourceIdentifier = source.getAttribute('data-identifier')
          const targetIdentifier = target.getAttribute('data-identifier')
          const pair = `${sourceIdentifier} ${targetIdentifier}`
          result += `<td class="table-cell" style="${columnWidthStyle}">
            <div class="control-cell"  aria-checked="false" tabindex="0" role="checkbox"
              data-source-max="${sourceMatchMax}" data-target-max="${targetMatchMax}" data-pair="${pair}"></div>
            </td>`
        })
  
        result += `</tr>`
      })
      return `<tbody>${result}</tbody>`
    }

    // When not row-centric (default), the targets become the columns
    this.sources.forEach((source) => {

      result += `<tr><th scope="row" class="row-header-cell">${source.innerHTML}</th>`

      const sourceMatchMax = source.getAttribute('data-match-max')

      this.targets.forEach((target) => {
        const targetMatchMax = target.getAttribute('data-match-max')
        const sourceIdentifier = source.getAttribute('data-identifier')
        const targetIdentifier = target.getAttribute('data-identifier')
        const pair = `${sourceIdentifier} ${targetIdentifier}`
        result += `<td class="table-cell" style="${columnWidthStyle}">
          <div class="control-cell"  aria-checked="false" tabindex="0" role="checkbox"
            data-source-max="${sourceMatchMax}" data-target-max="${targetMatchMax}" data-pair="${pair}"></div>
          </td>`
      })

      result += `</tr>`
    })

    return `<tbody>${result}</tbody>`
  }

  getColumnWidthPercentage (columns) {
    return Math.trunc(1 / (columns+1) * 100)
  }

  getRoleFromMatchMax (matchMax) {
    if ((matchMax === null) ||  (matchMax*1 === 1)) return "radio"
    return "checkbox"
  }

  getChoices (wrapper) {
    return wrapper.querySelectorAll('.qti-simple-associable-choice')
  }

  getResponse () {
    return this.computeResponse()
  }

  computeResponse () {
    let data = []

    for (let [identifier, checked] of this.state) {
      if (checked === 'true') data.push(identifier)
    }

    if (data.length === 0) return null

    if (this.options.cardinality === 'single') return data[0]

    return data
  }

  restoreResponse () {
    if (this.options.response === null) return
    
    if (this.options.cardinality === 'single') {
      const directedPair = this.options.response
      if (directedPair === null) return

      // 1. find source dragger
      const controlElement = this.findControlByIdentifier(directedPair)
      
      // Sanity check
      if (controlElement == null) return

      // 2. updateState
      this.updateState(directedPair, 'true')

      // 3. Set Checked
      this.setChecked(controlElement, true)
      return
    }

    this.options.response.forEach((directedPair) => {
      if (directedPair === null) return

      // 1. find source dragger
      const controlElement = this.findControlByIdentifier(directedPair)
      
      // Sanity check
      if (controlElement == null) return

      // 2. updateState
      this.updateState(directedPair, 'true')

      // 3. Set Checked
      this.setChecked(controlElement, true)
    }, this)
  }

  findControlByIdentifier (identifier) {
    for (let i=0; i < this.controls.length; i++) {
      if (identifier === this.controls[i].getAttribute('data-pair')) {
        return this.controls[i]
      }
    }
    return null
  }

  isExceedingMaxAssociations () {
    // If maxAssociations is 0, then we can never exceed maxAssociations
    if (this.options.maxAssociations === 0) return false

    // If current full targets are less than maxAssociations then we
    // have room to grow.
    if (this.currentAssociationsCount < this.options.maxAssociations) return false

    // currentAssociationCount is >= maxAssociations, so no room to grow.
    return true
  }

  isExceedingMatchMax (directedPair, matchMax, isSource) {
    // If matchMax is 0 then we can never exceed
    if (matchMax === 0) return false

    const pair = this.getPair(directedPair)
    
    const matchCount = 
      isSource 
        ? this.countIdentifiersInState(pair.source, true)
        : this.countIdentifiersInState(pair.target, false)

    // If matches are less than matchMax then we
    // have room to grow.
    if (matchCount < matchMax) return false

    // matchCount is >= matchMax, so no room to grow.
    return true
  }

  countIdentifiersInState (identifier, isSource) {
    let identifierCount = 0

    for (let [directedPair, checked] of this.state) {
      if (checked === 'true') {
        const pair = this.getPair(directedPair)

        // Should never happen, but check anyway.
        if (pair == null) continue
        
        if (isSource && (pair.source === identifier)) {
          identifierCount += 1
        } else if (!isSource && (pair.target === identifier)) {
          identifierCount += 1
        }
      }
    }

    return identifierCount
  }

  getPair (directedPair) {
    if (directedPair === null) return null

    const splitPair = directedPair.split(' ')

    // Return null in case this is somehow malformed
    if (splitPair.length != 2) return null

    return { source: splitPair[0], target: splitPair[1] }
  }

  reset () {
    this.initializeAssociationsCount()
    this.destroy()
  }


  destroy () {
    if (this.controls == null) return

    this.controls.forEach((control) => {
        control.removeEventListener('click', this.handleClick)
        control.removeEventListener('keydown', this.handleKeydown)
        control.removeEventListener('focus', this.handleFocus)
        control.removeEventListener('blur', this.handleBlur)
      }, this)    
  }

}

export default MatchInteractionTabularWidget
