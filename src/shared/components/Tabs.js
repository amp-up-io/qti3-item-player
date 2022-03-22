export class Tabs {

  constructor (element) {
    this.element = element
    this.tabLabels = [ 'Glossary', 'Translation', 'Illustration' ]
    this.idList = this.createIds()
    this.hasGlossary = false
    this.hasKeyword = false
    this.hasIllustration = false
    return this
  }

  /**
   * @description Create the tab structure.
   * @param {Object} content
   * {
   *   term: 'Glossary Dialog',
   *   'glossary-on-screen': {
   *     definition: '<p>This is a draggable dialog which is created using HTML CSS & JavaScript. You can <em>move</em> this dialog anywhere on the document or page.</p>'
   *   }
   * }
   */
  create (content) {
    let firstTabButton = null
    let firstTabPanel = null

    this.hasGlossary = ('glossary' in content)

    if (this.hasGlossary) {
      firstTabButton = this.createTabButton (this.idList.tabIds[0], this.idList.tabPanelIds[0], 'Glossary', true)
      firstTabPanel = this.createTabPanel (this.idList.tabIds[0], this.idList.tabPanelIds[0], content.glossary.definition, 0)
    }

    if (firstTabButton == null) {
      this.element.innerHTML = ''
      return
    }

    const result = `<div class="qti3-player-cat-tabs">
        <div role="tablist" aria-label="Glossary Tab List">
          ${firstTabButton}
        </div>
        ${firstTabPanel}
      </div>`

    this.element.innerHTML = result
  }

  createTabButton (tabId, tabPanelId, tabLabel, isSelected=false) {
    return `<button type="button"
                role="tab"
                aria-selected="${isSelected}"
                aria-controls="${tabPanelId}"
                id="${tabId}">${tabLabel}</button>`
  }

  createTabPanel (tabId, tabPanelId, tabContent, tabIndex=-1) {
    return `<div tabindex="${tabIndex}"
                role="tabpanel"
                id="${tabPanelId}"
                aria-labelledby="${tabId}">${tabContent}</div>`
  }

  createIds () {
    const obj = {
      tabIds: [],
      tabPanelIds: []
    }

    for (let i=0; i<3; i++) {
      const idString = this.randomString (5, 'a')
      obj.tabIds.push('catalog-' + i + '-tab-' + idString)
      obj.tabPanelIds.push('catalog-' + i + '-tabpanel-' + idString)
    }

    return obj
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
