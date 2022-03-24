
export class CatalogFactory {

  constructor (item, store) {
    this.item = item
    this.itemElement = item.$refs.item
    this.store = store
    this.nodeList = null
    return this
  }

  bindAll () {
    // Get Catalogs
    const catalogs = this.store.getCatalogs()
    if (catalogs.length === 0) return

    // Get catalog-idref's
    this.nodeList = this.itemElement.querySelectorAll('[data-catalog-idref]')
    if (this.nodeList.length === 0) return

    // First, look for supports that requires Glossary Dialog binding.
    // If a support is enabled it will be added to the enabledSupportsArray.
    const pnpGlossarySupports = this.getPnpGlossarySupports(this.store.getItemContextPnp())
    const hasPnpGlossarySupports = (pnpGlossarySupports.length > 0)

    this.nodeList.forEach((node) => {
        if (hasPnpGlossarySupports) this.bindGlossaryNode(node, pnpGlossarySupports)
      }, this)
  }

  resetAll () {
    this.nodeList.forEach((node) => {
      this.unbindGlossaryDOM(node)
    }, this)

    this.nodeList = null
  }

  /**
   * @description Determine if any supports are enabled that are rendered
   * via a Glossary Dialog.
   * @param {Class} pnp
   */
  getPnpGlossarySupports(pnp) {
    let supports = []

    if (pnp.getGlossaryOnScreen()) {
      supports.push('glossary-on-screen')
    }

    if (pnp.getKeywordTranslationLanguage() != null) {
      supports.push(`keyword-translation:${pnp.getKeywordTranslationLanguage()}`)
    }

    if (pnp.getExtSbacGlossaryIllustration()) {
      supports.push('ext:sbac-glossary-illustration')
    }

    return supports
  }

  /**
   * @description This preps a DOM element to be a clickable
   * glossary dialog element.
   * @param {DomElement} node
   * @param {Array} supports - list of Catalog supports
   */
  bindGlossaryNode (node, supports) {
    const idref = node.getAttribute('data-catalog-idref')
    const catalog = this.store.getCatalog(idref)

    // If no catalog, bail
    if (typeof catalog === 'undefined') return

    // If catalog does not have requested supports, bail
    if (!this.hasCatalogGlossarySupport(catalog, supports)) return

    // Found the needed catalog supports.  Bind the DOM.
    this.bindGlossaryDOM(node)
  }

  /**
   * @description This preps a DOM element to be a clickable
   * glossary dialog element.
   * @param {DomElement} node
   */
  bindGlossaryDOM (node) {
    node.classList.add('qti3-player-catalog-clickable-term')
    // Add a data- for the term - if one does not already exist
    this.setGlossaryTerm(node)
    node.addEventListener('click',    this.showGlossary.bind(this))
    node.addEventListener('touchend', this.showGlossary.bind(this))
  }

  /**
   * @description This unbinds a DOM element as a clickable
   * glossary dialog element.
   * @param {DomElement} node
   */
  unbindGlossaryDOM (node) {
    if (node.classList.contains('qti3-player-catalog-clickable-term')) {
      node.classList.remove('qti3-player-catalog-clickable-term')
      node.removeEventListener('click',    this.showGlossary)
      node.removeEventListener('touchend', this.showGlossary)
    }
  }

  /**
   * @description Set a data-glossary-term on a node in the DOM.
   * @param {DomElement} node
   */
  setGlossaryTerm (node) {
    if (node.hasAttribute('data-glossary-term')) return

    // Transform a data-sbac-term into a data-glossary-term
    if (node.hasAttribute('data-sbac-term')) {
      node.setAttribute('data-glossary-term', node.getAttribute('data-sbac-term'))
      return
    }

    node.setAttribute('data-glossary-term', node.innerText)
  }

  showGlossary (event) {
    event.preventDefault()
    event.stopPropagation()

    // Glossary data may contain glossary, keyword translation,
    // and sbac illustrated glossary
    const catalogData = this.createGlossaryData(event.target)

    this.item.$parent.$emit('itemCatalogEvent', {
      type: 'glossary',
      catalogId: event.target.getAttribute('data-catalog-idref'),
      term: event.target.getAttribute('data-glossary-term'),
      data: catalogData
    })
  }

  /**
   * @description Main workhorse method that generates a Glossary data object.
   * Strategy: get the current settings from the PNP.  Then examine the catalog
   * for any content that supports the PNP.  Build a Glossary data Object containing
   * as many as three properties: 'glossary', 'keywordTranslation', and
   * 'sbacGlossaryIllustration'.
   * @param {DomElement} element - containing a data-catalog-idref
   * @return {Object} data - to support a Glossary Dialog message
   */
  createGlossaryData (element) {
    const idref = element.getAttribute('data-catalog-idref')
    const data = {}

    // First, look for supports that requires Glossary Dialog binding.
    // If a support is enabled it will be added to the enabledSupportsArray.
    const pnpGlossarySupports = this.getPnpGlossarySupports(this.store.getItemContextPnp())

    if (pnpGlossarySupports.length == 0) {
      // ?? How did we get here ?? If there are no supports
      // then the Glossary event should not have been bound.
      return data
    }

    const catalog = this.store.getCatalog(idref)

    for (let i=0; i<pnpGlossarySupports.length; i++) {
      const card = this.findCatalogCardBySupport(catalog, pnpGlossarySupports[i])

      if (card == null) continue

      if (pnpGlossarySupports[i] === 'glossary-on-screen') {
        data.glossary = { definition: this.getGlossaryCardContent(card) }
        continue
      }

      if (pnpGlossarySupports[i].startsWith('keyword-translation:')) {
        const languageCode = this.getLanguageCodeFromSupport(pnpGlossarySupports[i])
        data.keywordTranslation = { definition: this.getTranslationCardContent(card, languageCode) }
        continue
      }

      if (pnpGlossarySupports[i] === 'ext:sbac-glossary-illustration') {
        data.sbacGlossaryIllustration = { definition: this.getGlossaryCardContent(card) }
        continue
      }
    }

    return data
  }

  hasCatalogGlossarySupport(catalog, glossarySupports) {
    let card = null

    glossarySupports.forEach((support) => {
      let supportCard = this.findCatalogCardBySupport(catalog, support)
      if (supportCard !== null) {
        card = supportCard
        return
      }
    }, this)

    return card != null
  }

  getLanguageCodeFromSupport (support) {
    return support.substring(support.indexOf(':') + 1)
  }

  findCatalogCardBySupport (catalog, support) {
    if (typeof catalog === 'undefined') return null
    // If keyword translation, drop the language from the support.
    support = (support.startsWith('keyword-translation:') ? 'keyword-translation' : support)
    return this.findCardBySupport(catalog.node.getCards(), support)
  }

  findCardBySupport (cards, support) {
    let supportedCard = null

    cards.forEach((card) => {
        if (card.support === support) {
          supportedCard = card
          return
        }
      }, this)

    return supportedCard
  }

  getGlossaryCardContent (card) {
    let content = ''

    // Should be QtiHtmlContent or QtiCardEntry
    card.getChildren().forEach((cardChild) => {

        // Handle QtiHtmlContent
        if (cardChild.$options.name === 'QtiHtmlContent') {
          content = cardChild.getContent()
          return
        }

        // Handle QtiCardEntry
        if (cardChild.$options.name === 'QtiCardEntry') {
          content = this.getGlossaryCardContent(cardChild)
          return
        }

      }, this)

    return content
  }

  getTranslationCardContent (card, lang) {
    let content = ''

    // Should be QtiHtmlContent or QtiCardEntry
    card.getChildren().forEach((cardChild) => {

        // Handle QtiHtmlContent
        if (cardChild.$options.name === 'QtiHtmlContent') {
          content = cardChild.getContent()
          return
        }

        // Handle QtiCardEntry
        if (cardChild.$options.name === 'QtiCardEntry') {
          content = this.getTranslationCardContent(cardChild, lang)
          return
        }

      }, this)

    return content
  }

}
