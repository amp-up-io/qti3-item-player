
export class CatalogFactory {

  constructor (item, store) {
    //
    this.item = item
    this.itemElement = item.$refs.item
    this.store = store
    this.nodeList = []
    return this
  }

  bindAll () {
    const catalogs = this.store.getCatalogs()
    if (catalogs.length === 0) return

    this.nodeList = this.itemElement.querySelectorAll(`[data-catalog-idref="glosscat"]`)
    console.log('bindAll, nodeList:', this.nodeList)

    for (let i=0; i<this.nodeList.length; i++) {
      this.bindNode(this.nodeList[i], catalogs[0])
      //nodeList[i].classList.add('qti3-player-catalog-clickable-term')
      /*
      nodeList[i].addEventListener('click', () => {
        this.catalogFactory.term = 'RISD'
        this.catalogFactory.definition = '<p>An abbreviation <em>usually</em> created using the first letters of other words and pronounced as a word.</p>'
        this.catalogFactory.update()
        this.catalogFactory.show()
      })
      */
    }
  }

  resetAll () {
    for (let i=0; i<this.nodeList.length; i++) {
      this.unbindNode(this.nodeList[i])
    }
  }

  bindNode (node) {
    node.classList.add('qti3-player-catalog-clickable-term')
    node.addEventListener('click',    this.showGlossary.bind(this))
    node.addEventListener('touchend', this.showGlossary.bind(this))
  }

  unbindNode (node) {
    node.classList.remove('qti3-player-catalog-clickable-term')
    node.removeEventListener('click',    this.showGlossary)
    node.removeEventListener('touchend', this.showGlossary)
  }

  showGlossary () {
    this.item.$parent.$emit('itemCatalogEvent', {
      type: 'glossary'
    })
  }

}
