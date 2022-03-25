export class CatalogDialogTabs {

  constructor (element) {
    this.element = element
    this.idList = this.createIds()
    this.tabElements = []
    this.tabPanelElements = []
    return this
  }

  constants = {
    labels: {
      GLOSSARY: 'Glossary',
      KEYWORD_TRANSLATION: 'Translation',
      GLOSSARY_ILLUSTRATION: 'Illustration'
    },
    cards: {
      GLOSSARY: 'glossary',
      KEYWORD_TRANSLATION: 'keywordTranslation',
      GLOSSARY_ILLUSTRATION: 'glossaryIllustration'
    },
    keys: {
      ENTER: 13,
      SPACE: 32,
      END:   35,
      HOME:  36,
      LEFT:  37,
      UP:    38,
      RIGHT: 39,
      DOWN:  40
    },
    direction: {
      37: -1,
      38: -1,
      39:  1,
      40:  1
    }
  }

  /**
   * @description Create the tab structure.
   * @param {Object} content
   */
  create (content) {
    // Just in case there are any listeners...
    this.unbindTabListEvents()

    const hasGlossary = (this.constants.cards.GLOSSARY in content)
    const hasKeyword = (this.constants.cards.KEYWORD_TRANSLATION in content)
    const hasIllustration = (this.constants.cards.GLOSSARY_ILLUSTRATION in content)

    // Build the tab array list
    const tabList = this.tabList(hasGlossary, hasKeyword, hasIllustration)

    // No content.
    if (tabList.length == 0) {
      this.element.innerHTML = ''
      return
    }

    let firstTabButton = ''
    let firstTabPanel = ''
    let secondTabButton = ''
    let secondTabPanel = ''
    let thirdTabButton = ''
    let thirdTabPanel = ''

    for (let i=0; i<tabList.length; i++) {

      if (i == 0) {
        // First tab is aria-selected and panel is in the tab order
        firstTabButton = this.createTabButton (this.idList.tabIds[i], this.idList.tabPanelIds[i], tabList[i], true)
        firstTabPanel = this.tabPanel (tabList[i], i, content, 0)
      }

      if (i == 1) {
        secondTabButton = this.createTabButton (this.idList.tabIds[i], this.idList.tabPanelIds[i], tabList[i], false)
        secondTabPanel = this.tabPanel (tabList[i], i, content, -1)
      }

      if (i == 2) {
        thirdTabButton = this.createTabButton (this.idList.tabIds[i], this.idList.tabPanelIds[i], tabList[i], false)
        thirdTabPanel = this.tabPanel (tabList[i], i, content, -1)
      }
    }

    const result = `<div id="${this.idList.tabWrapperId}" class="qti3-player-cat-tabs">
        <div role="tablist" aria-orientation="horizontal" aria-label="Glossary Tab List">
          ${firstTabButton}
          ${secondTabButton}
          ${thirdTabButton}
        </div>
        ${firstTabPanel}
        ${secondTabPanel}
        ${thirdTabPanel}
      </div>`

    this.element.innerHTML = result

    // Make the tabs come alive
    this.bindTabListEvents()
  }

  tabPanel (tabLabel, index, tabContent, tabIndex=-1) {
    switch (tabLabel) {
      case this.constants.labels.GLOSSARY:
        return this.createTabPanel (this.idList.tabIds[index], this.idList.tabPanelIds[index], tabContent[this.constants.cards.GLOSSARY].content, tabIndex)
      case this.constants.labels.KEYWORD_TRANSLATION:
        return this.createTabPanel (this.idList.tabIds[index], this.idList.tabPanelIds[index], tabContent[this.constants.cards.KEYWORD_TRANSLATION].content, tabIndex)
      case this.constants.labels.GLOSSARY_ILLUSTRATION:
        return this.createTabPanel (this.idList.tabIds[index], this.idList.tabPanelIds[index], tabContent[this.constants.cards.GLOSSARY_ILLUSTRATION].content, tabIndex)
      default:
        return ''
    }
  }

  createTabButton (tabId, tabPanelId, tabLabel, isSelected=false) {
    return `<button type="button"
                role="tab"
                aria-selected="${isSelected}"
                aria-controls="${tabPanelId}"
                id="${tabId}">${tabLabel}</button>`
  }

  createTabPanel (tabId, tabPanelId, tabContent, tabIndex=-1) {
    // Hide the panel when it is not in the tab order
    const hidden = (tabIndex === -1) ? 'hidden' : ''

    return `<div tabindex="${tabIndex}"
                role="tabpanel"
                class="${hidden}"
                id="${tabPanelId}"
                aria-labelledby="${tabId}">${tabContent}</div>`
  }

  createIds () {
    const obj = {
      tabWrapperId: '',
      tabIds: [],
      tabPanelIds: []
    }

    // Create an id for the overall tab wrapper div
    obj.tabWrapperId = 'catalog-tabwrapper-' + this.randomString (5, 'a')

    for (let i=0; i<3; i++) {
      const idString = this.randomString (5, 'a')
      obj.tabIds.push('catalog-' + i + '-tab-' + idString)
      obj.tabPanelIds.push('catalog-' + i + '-tabpanel-' + idString)
    }

    return obj
  }

  tabList (hasGlossary, hasKeyword, hasIllustration) {
    let tabs = []

    if (hasGlossary) tabs.push(this.constants.labels.GLOSSARY)
    if (hasKeyword) tabs.push(this.constants.labels.KEYWORD_TRANSLATION)
    if (hasIllustration) tabs.push(this.constants.labels.GLOSSARY_ILLUSTRATION)

    return tabs
  }

  bindTabListEvents () {
    // get the tablist element
    const tabWrapperElement = document.getElementById(this.idList.tabWrapperId)
    if (tabWrapperElement === null) return

    this.tabElements = tabWrapperElement.querySelectorAll('[role="tab"]')
    this.tabPanelElements = tabWrapperElement.querySelectorAll('[role="tabpanel"]')
    // Bail if we somehow get a misalignment
    if (this.tabElements.length != this.tabPanelElements.length) return

    // Bind listeners
    for (let index=0; index < this.tabElements.length; ++index) {
      this.addListeners(this.tabElements[index], this.tabPanelElements[index], index)
    }
  }

  unbindTabListEvents () {
    this.removeListeners()
  }

  addListeners (tabElement, tabPanelElement, index) {
    tabElement.addEventListener('click',   this.onTabClick.bind(this))
    tabElement.addEventListener('keydown', this.onKeyDown.bind(this))
    tabElement.addEventListener('keyup',   this.onKeyUp.bind(this))
    tabElement.index = index
  }

  removeListeners () {
    for (let index=0; index<this.tabElements.length; ++index) {
      this.tabElements[index].removeEventListener('click',   this.onTabClick)
      this.tabElements[index].removeEventListener('keydown', this.onKeyDown)
      this.tabElements[index].removeEventListener('keyup',   this.onKeyUp)
    }
  }

  onTabClick (event) {
    var tab = event.target
    this.activateTab(tab, false)
  }

  onKeyDown (event) {
    const key = event.keyCode

    switch (key) {
      case this.constants.keys.END:
        event.preventDefault()
        this.focusLastTab()
        break;
      case this.constants.keys.HOME:
        event.preventDefault()
        this.focusFirstTab()
        break
      case this.constants.keys.UP:
      case this.constants.keys.DOWN:
        this.switchTabOnArrowPress(event)
        break;
      default:
    }
  }

  switchTabOnArrowPress (event) {
    const key = event.keyCode

    if (this.constants.direction[key]) {
      let target = event.target
      if (target.index !== undefined) {
        if (this.tabElements[target.index + this.constants.direction[key]]) {
          this.tabElements[target.index + this.constants.direction[key]].focus()
          return
        }

        if (key === this.constants.keys.LEFT || key === this.constants.keys.UP) {
          this.focusLastTab()
          return
        }

        if (key === this.constants.keys.RIGHT || key == this.constants.keys.DOWN) {
          this.focusFirstTab()
        }
      }
    }
  }

  onKeyUp (event) {
    const key = event.keyCode

    switch (key) {
      case this.constants.keys.LEFT:
      case this.constants.keys.RIGHT:
        this.switchTabOnArrowPress(event)
        break
      case this.constants.keys.ENTER:
      case this.constants.keys.SPACE:
        this.activateTab(event.target)
        break
      default:
    }
  }

  activateTab(tab, setFocus) {
    setFocus = setFocus || true
    // Deactivate all other tabs
    this.deactivateTabs()
    // Remove tabindex attribute
    tab.removeAttribute('tabindex')
    // Set the tab as selected
    tab.setAttribute('aria-selected', 'true')
    // Get the value of aria-controls (which is an ID)
    let controls = tab.getAttribute('aria-controls')
    // Remove hidden class from tab panel to make it visible
    document.getElementById(controls).classList.remove('hidden')
    // Set focus when required
    if (setFocus) tab.focus()
  }

  deactivateTabs () {
    // deselect all tabs
    for (let tab=0; tab<this.tabElements.length; tab++) {
      this.tabElements[tab].setAttribute('tabindex', '-1')
      this.tabElements[tab].setAttribute('aria-selected', 'false')
    }
    // hide all panels
    for (let panel=0; panel<this.tabPanelElements.length; panel++) {
      this.tabPanelElements[panel].classList.add('hidden')
    }
  }

  focusFirstTab () {
    this.tabElements[0].focus()
  }

  focusLastTab () {
    this.tabElements[this.tabElements.length - 1].focus()
  }

  /**
   * @description Pseudo-random string generator
   * http://stackoverflow.com/a/27872144/383904
   * Default: return a random alpha-numeric string
   *
   * @param {Integer} len Desired length
   * @param {String} an Optional (alphanumeric), "a" (alpha), "n" (numeric)
   * @return {String}
   */
  randomString (len, an) {
    an = an && an.toLowerCase()
    let str = ''
    const min = an == 'a' ? 10 : 0
    const max = an == 'n' ? 10 : 62
    for (let i=0; i < len; i++) {
      let r = Math.random() * (max - min) + min << 0
      str += String.fromCharCode(r += r > 9 ? r < 36 ? 55 : 61 : 48)
    }
    return str
  }

}
