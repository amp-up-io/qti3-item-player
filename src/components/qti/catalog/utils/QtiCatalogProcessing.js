import { store } from '@/store/store'

/**
 * @description QtiCatalogProcessing class
 *
 */
export default class QtiCatalogProcessing {

  /**
   * @constructor QtiCatalogProcessing
   */
  constructor () {
    this.catalogs = store.getCatalogs()
    return this
  }

  constants = {
    supports: {
      GLOSSARY_ON_SCREEN: 'glossary-on-screen',
      KEYWORD_TRANSLATION: 'keyword-translation',
      COMPUTER_READ_ALOUD: 'computer-read-aloud'
    }
  }

}
