/**
 * @description Class to encapsulate QTI shared presentation vocabulary
 * for a qti-extended-text-interaction.
 */
class ExtendedTextPresentationFactory {

  constructor(classList, expectedLength) {
    this.constants = {
      // QTI 3 Shared Vocabulary constants

      // Defines the Counter style
      QTI_COUNTER_NONE: 'none',
      QTI_COUNTER_UP: 'qti-counter-up',
      QTI_COUNTER_DOWN: 'qti-counter-down',
      // Defines the height of the input area of the control
      QTI_HEIGHT_LINES_3: 'qti-height-lines-3',
      QTI_HEIGHT_LINES_6: 'qti-height-lines-6',
      QTI_HEIGHT_LINES_15: 'qti-height-lines-15',

      // Sbac
      SBAC_PRESENTATION: 'sbac'
    }

    this.classList = classList
    this.expectedLength = expectedLength
    // Default, 3 lines tall
    this.presentation_HeightClass = this.constants.QTI_HEIGHT_LINES_3
    // Default, hide character counter.
    this.presentation_CounterStyle = this.constants.QTI_COUNTER_NONE
    // Default, not sbac presentation.
    this.presentation_Sbac = false

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
        case this.constants.SBAC_PRESENTATION:
          this.presentation_Sbac = true
          break
        case this.constants.QTI_COUNTER_UP:
          this.presentation_CounterStyle = 'up'
          this.expectedLength = this.processExpectedLength()
          break
        case this.constants.QTI_COUNTER_DOWN:
          this.presentation_CounterStyle = 'down'
          this.expectedLength = this.processExpectedLength()
          break
        case this.constants.QTI_HEIGHT_LINES_3:
          this.presentation_HeightClass = this.constants.QTI_HEIGHT_LINES_3
          break
        case this.constants.QTI_HEIGHT_LINES_6:
          this.presentation_HeightClass = this.constants.QTI_HEIGHT_LINES_6
          break
        case this.constants.QTI_HEIGHT_LINES_15:
          this.presentation_HeightClass = this.constants.QTI_HEIGHT_LINES_15
          break
        default:
      } // end switch
    } // end for
  }

  processExpectedLength () {
    if ((typeof this.expectedLength === 'undefined') || (this.expectedLength === null) || (this.expectedLength.length == 0)) {
      return 400
    }

    if (this.expectedLength === '0') {
      return 400
    }

    return this.expectedLength*1
  }

  getCounterStyle () {
    return this.presentation_CounterStyle
  }

  getHeightClass () {
    return this.presentation_HeightClass
  }

  getExpectedLength () {
    return this.expectedLength
  }

  getIsSbac () {
    return this.presentation_Sbac
  }

}

export default ExtendedTextPresentationFactory
