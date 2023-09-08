/**
 * @description Class to encapsulate all QTI shared presentation vocabulary
 * for a qti-graphic-gap-match-interaction.
 */
class GraphicGapMatchPresentationFactory {

  constructor(staticClass) {
    this.constants = {
      // QTI 3 Shared Vocabulary constants
      // Use class attribute to define these.

      // Defines the color theme of the hotspots/selections
      QTI_SELECTIONS_LIGHT: 'qti-selections-light',
      QTI_SELECTIONS_DARK: 'qti-selections-dark',
      QTI_UNSELECTED_HIDDEN: 'qti-unselected-hidden',

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
    this.ggmGroupElement = null
    this.ggmChoiceWrapperElement = null
    this.ggmTargetWrapperElement = null
    this.image = null
    this.choicesContainerWidth = null
    this.gapChoices = []
    this.gaps = []

    this.presentation_Choices_Orientation = null

    // Default is dark / blue theme
    this.presentation_Theme = this.constants.QTI_SELECTIONS_DARK

    this.presentation_MaxSelectionsMessage = ''
    this.presentation_MinSelectionsMessage = ''
  }

  initialize (ggmGroupElement, ggmChoiceWrapperElement, ggmTargetWrapperElement, image, choicesContainerWidth, gapChoices, gaps) {
    this.ggmGroupElement = ggmGroupElement
    this.ggmChoiceWrapperElement = ggmChoiceWrapperElement
    this.ggmTargetWrapperElement = ggmTargetWrapperElement
    this.image = image

    this.choicesContainerWidth = choicesContainerWidth
    this.gapChoices = gapChoices
    this.gaps = gaps

    this.processRootClassAttribute(this.parentClass)
    this.processPresentation()
  }

  /**
   * @description The class attribute on the interaction's root element may contain
   * QTI 3 shared vocabulary.
   * @param - clazz - a string containing class attribute values
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

        case this.constants.QTI_SELECTIONS_DARK:
        case this.constants.QTI_SELECTIONS_LIGHT:
        case this.constants.QTI_UNSELECTED_HIDDEN:
          this.presentation_Theme = clazzTokens[index]
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
      this.ggmChoiceWrapperElement.classList.add(this.constants.QTI_CHOICES_LEFT)
      this.ggmTargetWrapperElement.classList.add(this.constants.QTI_CHOICES_LEFT)
      this.ggmGroupElement.classList.add(this.constants.QTI_CHOICES_LEFT)
    } else if (this.presentation_Choices_Orientation === this.constants.QTI_CHOICES_TOP) {
      this.ggmChoiceWrapperElement.classList.add(this.constants.QTI_CHOICES_TOP)
      this.ggmTargetWrapperElement.classList.add(this.constants.QTI_CHOICES_TOP)
    } else if (this.presentation_Choices_Orientation === this.constants.QTI_CHOICES_RIGHT) {
      this.ggmChoiceWrapperElement.classList.add(this.constants.QTI_CHOICES_RIGHT)
      this.ggmTargetWrapperElement.classList.add(this.constants.QTI_CHOICES_RIGHT)
      this.ggmGroupElement.classList.add(this.constants.QTI_CHOICES_RIGHT)
      // place target wrapper before choices wrapper
      this.ggmGroupElement.insertBefore(this.ggmTargetWrapperElement, this.ggmChoiceWrapperElement)
    } else if (this.presentation_Choices_Orientation === this.constants.QTI_CHOICES_BOTTOM) {
      this.ggmChoiceWrapperElement.classList.add(this.constants.QTI_CHOICES_BOTTOM)
      this.ggmTargetWrapperElement.classList.add(this.constants.QTI_CHOICES_BOTTOM)
      // place target wrapper before choices wrapper
      this.ggmGroupElement.insertBefore(this.ggmTargetWrapperElement, this.ggmChoiceWrapperElement)
    }
    
    this.processImage()
    this.processChoicesContainerWidth()
    this.processGaps()
  }

  processImage () {
    if (this.image === null) return
    const rect = this.image.getBoundingClientRect()
    this.ggmTargetWrapperElement.style.width = `${rect.width}px`
    this.ggmTargetWrapperElement.style.height = `${rect.height}px`
  }

  processChoicesContainerWidth () {
    if (this.choicesContainerWidth === null) return
    this.ggmChoiceWrapperElement.style.width = `${this.choicesContainerWidth}px`
    this.ggmChoiceWrapperElement.style.textAlign = 'center'
  }
  
  processGaps () {
    for (let i=0; i < this.gaps.length; i++) {
      const gap = this.gaps[i]
      this.setGapStyle(gap, gap.getShape(), gap.getShapeData())
      this.gaps[i].$refs.gap.classList.add('target')
      this.gaps[i].$refs.gap.classList.add(this.presentation_Theme)
    }
  }

  setGapStyle (gap, shape, shapeData) {
    switch (shape) {
      case 'rect':
        gap.$refs.gap.style.left = `${shapeData[0]}px`
        gap.$refs.gap.style.top = `${shapeData[1]}px`
        gap.$refs.gap.style.width = `${shapeData[2]}px`
        gap.$refs.gap.style.height = `${shapeData[3]}px`
        break

      default:
        break
    }
  }

}

export default GraphicGapMatchPresentationFactory
