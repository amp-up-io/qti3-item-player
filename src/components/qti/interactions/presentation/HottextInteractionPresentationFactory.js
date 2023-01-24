/**
 * @description Class to encapsulate QTI shared presentation vocabulary
 * for a qti-hottext-interaction.
 */
class HottextPresentationFactory {

  constructor(classList) {
    this.constants = {
      // QTI 3 Shared Vocabulary constants

      // Defines the color theme of the hottext/selections
      QTI_UNSELECTED_HIDDEN: 'qti-unselected-hidden',
    }

    this.classList = classList

    this.presentation_UnselectedHidden = false

    // Sniff for shared CSS vocabulary
    this.processClassAttribute()
    return this
  }

  /**
   * @description The class attribute on the interaction may contain
   * QTI 3 shared vocabulary.
   */
  processClassAttribute () {
    if ((typeof this.classList === 'undefined') || (this.classList === null) || (this.classList.length == 0)) {
      return
    }

    const clazzTokens = this.classList.split(' ')
    for (let index = 0; index < clazzTokens.length; index++) {
      switch (clazzTokens[index]) {
        case this.constants.QTI_UNSELECTED_HIDDEN:
          this.presentation_UnselectedHidden = true
          break
        default:
      }
    }
  }

  getUnselectedHidden () {
    return this.presentation_UnselectedHidden
  }

}

export default HottextPresentationFactory
