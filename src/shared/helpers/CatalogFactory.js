
export class CatalogFactory {

  constructor (item, store) {
    this.item = item
    this.itemElement = item.$refs.item
    this.store = store
    // List of all item elements that have a data-catalog-idref attribute
    this.nodeList = null
    return this
  }

  constants = {
    // PNP supports
    supports: {
      GLOSSARY: 'glossary-on-screen',
      KEYWORD_TRANSLATION: 'keyword-translation',
      EXT_SBAC_GLOSSARY_ILLUSTRATION: 'ext:sbac-glossary-illustration'
    },
    // No language specified
    LANGUAGE_OFF: '',
  }

  bindAll () {
    // Get Catalogs
    const catalogs = this.store.getCatalogs()
    if (catalogs.length === 0) return

    // Clean out the DOM
    this.resetAll()

    // Get catalog-idref's
    this.nodeList = this.itemElement.querySelectorAll('[data-catalog-idref]')

    // If no catalog-idref's, bail
    if (this.nodeList.length === 0) return

    // Step 1: Bind Glossary
    this.bindGlossary(this.nodeList)
  }

  resetAll () {
    if (this.nodeList === null) return

    this.nodeList.forEach((node) => {
      this.unbindGlossaryDOM(node)
    }, this)

    this.nodeList = null
  }

  /**
   * @description Determine if any supports are enabled that are rendered
   * via a Glossary Dialog.  Glossary supports are:
   *   glossary-on-screen
   *   keyword-translation
   *   ext:sbac-glossary-illustration
   * @param {Class} pnp
   */
  getPnpGlossarySupports(pnp) {
    let supports = []

    if (pnp.getGlossaryOnScreen()) {
      supports.push(this.constants.supports.GLOSSARY)
    }

    if (pnp.getKeywordTranslationLanguage() !== this.constants.LANGUAGE_OFF) {
      supports.push(`${this.constants.supports.KEYWORD_TRANSLATION}:${pnp.getKeywordTranslationLanguage()}`)
    }

    if (pnp.getExtSbacGlossaryIllustration()) {
      supports.push(this.constants.supports.EXT_SBAC_GLOSSARY_ILLUSTRATION)
    }

    return supports
  }

  /**
   * @description Bind the item to the Glossary Dialog when the PNP and Catalog
   * have appropriate settings and content.
   * @param {NodeList} nodes - a DOM NodeList
   */
  bindGlossary (nodes) {
    // If a 'Glossary' support is enabled it will be added to the enabledSupportsArray.
    const pnpGlossarySupports = this.getPnpGlossarySupports(this.store.getItemContextPnp())

    // Bail if no Glossary supports enabled
    if (pnpGlossarySupports.length === 0) return

    nodes.forEach((node) => {
        this.bindGlossaryNode(node, pnpGlossarySupports)
      }, this)
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

    // Get the catalog idref from the DOM
    const idref = event.target.getAttribute('data-catalog-idref')

    // Glossary data may contain glossary, keyword translation,
    // and sbac illustrated glossary
    const catalogData = this.createGlossaryData(idref)

    this.item.$parent.$emit('itemCatalogEvent', {
      type: 'glossary',
      catalogIdRef: idref,
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
   * @param {String} idref - containing a data-catalog-idref
   * @return {Object} data - to support a Glossary Dialog message
   */
  createGlossaryData (idref) {
    // Get the catalog associated with this idref
    const catalog = this.store.getCatalog(idref)

    // First, look for supports that requires Glossary Dialog binding.
    // If a support is enabled it will be added to pnpGlossarySupports.
    const pnpGlossarySupports = this.getPnpGlossarySupports(this.store.getItemContextPnp())

    // Create the payload from the catalog and supports
    return this.createGlossaryDataFromCatalog(catalog, pnpGlossarySupports)
  }

  createGlossaryDataFromCatalog (catalog, supports) {
    let data = []

    // Loop through each of the supports.  When we find catalog
    // content for the support, add it to our data payload.
    supports.forEach((support) => {
      const card = this.findCatalogCardBySupport(catalog, support)
      if (card === null) return

      if ((support === 'glossary-on-screen') ||
          (support === 'ext:sbac-glossary-illustration')) {
        const content = this.createGlossaryContent(card)
        if (content === null) return

        // Add content
        data.push({ support: support, card:  content })
        return
      }

      if (support.startsWith('keyword-translation:')) {
        const languageCode = this.getLanguageCodeFromSupport(support)
        const content = this.createTranslationContent(card, languageCode)
        if (content === null) return

        // Add content
        data.push({ support: 'keyword-translation', card: content })
        return
      }
    }, this)

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

  createGlossaryContent (card) {
    return this.getGlossaryCardContent(card)
  }

  createTranslationContent (card, languageCode) {
    // Search by language
    let translationContent = this.getTranslationCardContent(card, languageCode)
    if (translationContent !== null) return translationContent

    // Language search failed. Do a default search.
    return this.getTranslationCardContent(card, languageCode, true)
  }

  getGlossaryCardContent (card) {
    let content = null

    // Should be QtiHtmlContent or QtiFileRef or QtiCardEntry
    card.getChildren().forEach((cardChild) => {

        switch (cardChild.$options.name) {
          case 'QtiHtmlContent':
            content = this.createContent('qti-html-content', cardChild)
            return
          case 'QtiFileRef':
            content = this.createContent('qti-file-ref', cardChild)
            return
          case 'QtiCardEntry':
            content = this.getGlossaryCardContent(cardChild)
            return
          default:
            // ??
            return
        }

      }, this)

    return content
  }

  /**
   * @description This is specifically for keyword translation.  Find a card or
   * cardEntry that matches the requested language.
   * @param {Component} card - a qti-card
   * @param {String} lang - the requested language code
   * @param {Boolean} defaultSearch - true when this method is called for a
   *                                  default search; attribute default="true"
   * @param {Integer} depth - this method can recurse.  Tracks depth of the
   *                          recursion.  May never exceed 1.
   * @return {String} content or null when no content found.
   */
  getTranslationCardContent (card, lang, defaultSearch=false, depth=0) {
    // Under no circumstances may depth exceed 1.
    if (depth > 1) return null

    // If the card has an xml:lang attribute, and that xml:lang is not equal
    // to our lang parameter, then bail.
    if ((depth == 0) &&
        (card.getLanguage().length > 0) &&
        (card.getLanguage() !== lang)) return null

    let content = null

    // Should be QtiHtmlContent, QtiFileRef, or QtiCardEntry
    card.getChildren().forEach((cardChild) => {

        switch (cardChild.$options.name) {
          case 'QtiHtmlContent':
            content = this.createContent('qti-html-content', cardChild)
            return
          case 'QtiFileRef':
            content = this.createContent('qti-file-ref', cardChild)
            return
          case 'QtiCardEntry':
            // default search
            if (defaultSearch && cardChild.isDefault()) {
              content = this.getTranslationCardContent(cardChild, lang, defaultSearch, depth+1)
              return
            }

            // language search
            if (cardChild.getLanguage() === lang) {
              content = this.getTranslationCardContent(cardChild, lang, defaultSearch, depth+1)
              return
            }
            return
          default:
            // ??
            return
        }

      }, this)

    return content
  }

  createContent (elementName, node) {
    return {
      properties: {
        name: elementName
      },
      content: node.getContent()
    }
  }

}
