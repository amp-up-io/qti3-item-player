/**
 * @description Class to encapsulate all QTI shared presentation vocabulary
 * for a qti-gap-match-interaction.
 */
class GapMatchPresentationFactory {

  constructor(staticClass) {
    this.constants = {
      // QTI 3 Shared Vocabulary constants
      // Use class attribute to define these.

      // Choices orientation
      QTI_CHOICES_TOP: 'qti-choices-top',
      QTI_CHOICES_BOTTOM: 'qti-choices-bottom',
      QTI_CHOICES_LEFT: 'qti-choices-left',
      QTI_CHOICES_RIGHT: 'qti-choices-right',

      // Use data- attributes to define these.
      DATA_MAX_SELECTIONS_MESSAGE: 'data-max-selections-message',
      DATA_MIN_SELECTIONS_MESSAGE: 'data-min-selections-message',
      DATA_CHOICES_CONTAINER_WIDTH: null
    }

    this.parentClass = staticClass
    this.clazzTokens = []
    this.gapMatchGroupElement = null
    this.gapChoiceWrapperElement = null
    this.gapTargetWrapperElement = null
    this.gapChoices = []
    this.gaps = []

    this.presentation_Choices_Orientation = null

    this.presentation_MaxSelectionsMessage = ''
    this.presentation_MinSelectionsMessage = ''
  }

  initialize (gapMatchGroupElement, gapChoiceWrapperElement, gapTargetWrapperElement, gapChoices, gaps) {
    this.gapMatchGroupElement = gapMatchGroupElement
    this.gapChoiceWrapperElement = gapChoiceWrapperElement
    this.gapTargetWrapperElement = gapTargetWrapperElement
    this.gapChoices = gapChoices
    this.gaps = gaps

    this.processRootClassAttribute(this.parentClass)
    this.processPresentation()
  }

  /**
   * @description The class attribute on the interaction's root element may contain
   * QTI 3 shared vocabulary.
   * @param - classList - a DOMTokenList of class attribute values
   */
  processRootClassAttribute (clazz) {
    const clazzTokens = clazz.split(' ')
    for (let index = 0; index < clazzTokens.length; index++) {
      switch (clazzTokens[index]) {
        case this.constants.QTI_CHOICES_TOP:
        case this.constants.QTI_CHOICES_BOTTOM:
        case this.constants.QTI_CHOICES_LEFT:
        case this.constants.QTI_CHOICES_RIGHT:
          this.presentation_Choices_Orientation = clazzTokens[index]
          break

        default:
          break
      } // end switch
    } // end for

    // Save it for later
    this.clazzTokens = clazzTokens
  }

  processPresentation () {
    if (this.presentation_Choices_Orientation === null) {
      this.presentation_Choices_Orientation = this.constants.QTI_CHOICES_TOP
    }

    if (this.presentation_Choices_Orientation === this.constants.QTI_CHOICES_LEFT) {
      this.gapChoiceWrapperElement.classList.add(this.constants.QTI_CHOICES_LEFT)
      this.gapTargetWrapperElement.classList.add(this.constants.QTI_CHOICES_LEFT)
    } else if (this.presentation_Choices_Orientation === this.constants.QTI_CHOICES_TOP) {
      this.gapChoiceWrapperElement.classList.add(this.constants.QTI_CHOICES_TOP)
      this.gapTargetWrapperElement.classList.add(this.constants.QTI_CHOICES_TOP)
    } else if (this.presentation_Choices_Orientation === this.constants.QTI_CHOICES_RIGHT) {
      this.gapChoiceWrapperElement.classList.add(this.constants.QTI_CHOICES_RIGHT)
      this.gapTargetWrapperElement.classList.add(this.constants.QTI_CHOICES_RIGHT)
      // place target wrapper before choices wrapper
      this.gapMatchGroupElement.insertBefore(this.gapTargetWrapperElement, this.gapChoiceWrapperElement)
    } else if (this.presentation_Choices_Orientation === this.constants.QTI_CHOICES_BOTTOM) {
      this.gapChoiceWrapperElement.classList.add(this.constants.QTI_CHOICES_BOTTOM)
      this.gapTargetWrapperElement.classList.add(this.constants.QTI_CHOICES_BOTTOM)
      // place target wrapper before choices wrapper
      this.gapMatchGroupElement.insertBefore(this.gapTargetWrapperElement, this.gapChoiceWrapperElement)
    }

    this.updateGaps()
  }

  updateGaps () {
    for (let i=0; i < this.gaps.length; i++) {
      this.gaps[i].$refs.gap.classList.add('target')
    }    
  }

}

export default GapMatchPresentationFactory
