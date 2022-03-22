
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
      this.unbindGlossaryNode(node)
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

    // If catalog has requested supports, bail
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
    // linguistic guidance, and sbac illustrated glossary
    const catalogData = this.createGlossaryData(event.target)

    this.item.$parent.$emit('itemCatalogEvent', {
      type: 'glossary',
      catalogId: event.target.getAttribute('data-catalog-idref'),
      term: event.target.getAttribute('data-glossary-term'),
      data: catalogData
    })
  }

  createGlossaryData (element) {
    const idref = element.getAttribute('data-catalog-idref')
    const data = {}

    const catalog = this.store.getCatalog(idref)
    const card = this.findCatalogCardBySupport(catalog, 'glossary-on-screen')

    // Bail if no glossary card
    if (card === null) return data

    data.glossary = {
      definition: this.getGlossaryCardContent(card)
    }
    return data
  }

  hasCatalogGlossarySupport(catalog, glossarySupports) {
    let card = null

    glossarySupports.forEach((support) => {
      card = this.findCatalogCardBySupport(catalog, support)
      if (card !== null) return
    }, this)

    return card != null
  }

  findCatalogCardBySupport (catalog, support) {
    if (typeof catalog === 'undefined') return null
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

}
