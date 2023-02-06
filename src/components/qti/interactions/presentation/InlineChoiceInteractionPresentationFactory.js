/**
 * @description Class to encapsulate QTI shared presentation vocabulary
 * for a qti-inline-choice-interaction.
 */
class InlineChoicePresentationFactory {

  constructor(classList) {
    this.constants = {
      // QTI 3 Shared Vocabulary constants

      // Orientation
      QTI_ORIENTATION_HORIZONTAL: 'qti-orientation-horizontal',
      QTI_ORIENTATION_VERTICAL: 'qti-orientation-vertical'
    }

    this.classList = classList
    // Default to horizontal orientation
    this.presentation_OrientationClass = this.constants.QTI_ORIENTATION_HORIZONTAL

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
        case this.constants.QTI_ORIENTATION_VERTICAL:
          this.presentation_OrientationClass = this.constants.QTI_ORIENTATION_VERTICAL
          break
        case this.constants.QTI_ORIENTATION_HORIZONTAL:
          this.presentation_OrientationClass = this.constants.QTI_ORIENTATION_HORIZONTAL
          break
        default:
      } // end switch
    } // end for
  }

  getOrientationClass () {
    return this.presentation_OrientationClass
  }

  isOrientationVertical () {
    return (this.presentation_OrientationClass == this.constants.QTI_ORIENTATION_VERTICAL)
  }

}

export default InlineChoicePresentationFactory
