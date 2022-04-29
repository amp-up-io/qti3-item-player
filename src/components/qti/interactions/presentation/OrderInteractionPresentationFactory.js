/**
 * @description Class to encapsulate all QTI shared presentation vocabulary
 * for a qti-order-interaction.
 */
class OrderPresentationFactory {

  constructor() {
    this.constants = {
      // QTI 3 Shared Vocabulary constants
      // Use class attribute to define these.
      LABELS_UPPER_ALPHA: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'],
      LABELS_LOWER_ALPHA: ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z'],
      LABELS_DECIMAL: ['1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','26'],
      LABELS_SUFFIX_PERIOD: '.',
      LABELS_SUFFIX_PARENTHESIS: ')',
      LABELS_SUFFIX_NONE: '',

      // Defines the Label
      QTI_LABELS_NONE: 'qti-labels-none',
      QTI_LABELS_DECIMAL: 'qti-labels-decimal',
      QTI_LABELS_LOWER_ALPHA: 'qti-labels-lower-alpha',
      QTI_LABELS_UPPER_ALPHA: 'qti-labels-upper-alpha',

      // Defines the suffix; e.g., "." or ")" or "" after the Label
      QTI_LABELS_SUFFIX_NONE: 'qti-labels-suffix-none',
      QTI_LABELS_SUFFIX_PERIOD: 'qti-labels-suffix-period',
      QTI_LABELS_SUFFIX_PARENTHESIS: 'qti-labels-suffix-parenthesis',

      // Choices orientation
      QTI_CHOICES_TOP: 'qti-choices-top',
      QTI_CHOICES_BOTTOM: 'qti-choices-bottom',
      QTI_CHOICES_LEFT: 'qti-choices-left',
      QTI_CHOICES_RIGHT: 'qti-choices-right',

      // Orientation
      QTI_ORIENTATION_VERTICAL: 'qti-orientation-vertical',
      QTI_ORIENTATION_HORIZONTAL: 'qti-orientation-horizontal',

      // Use data- attributes to define these.
      DATA_MAX_SELECTIONS_MESSAGE: 'data-max-selections-message',
      DATA_MIN_SELECTIONS_MESSAGE: 'data-min-selections-message'
    }

    this.parentClassList = null
    this.orderWrapperElement = null
    this.orderGroupNode = null
    this.choices = null

    this.presentation_HideLabels = false
    this.presentation_Labels = this.constants.LABELS_DECIMAL
    this.presentation_LabelsSuffix = this.constants.LABELS_SUFFIX_NONE
    this.presentation_Choices_Orientation = null
    this.presentation_IsOrientationVertical = false
    this.presentation_MaxSelectionsMessage = ''
    this.presentation_MinSelectionsMessage = ''
    this.presentation_Label_Style = ''
  }

  /**
   * @description Initialize the factory by passing the Order interaction class attribute and
   * a reference to the order group component.
   * @param - orderWrapperElement - a DOM element that wraps the orderGroupNode
   * @param - orderGroupNode - a component (not a DOM element) that encapsulates the choices
   */
  initialize (orderWrapperElement, orderGroupNode) {
    this.orderWrapperElement = orderWrapperElement
    this.orderGroupNode = orderGroupNode
    this.parentClassList = orderGroupNode.orderInteractionClassAttribute
    this.presentation_IsOrientationVertical = orderGroupNode.isOrientationVertical
    this.choices = orderGroupNode.choices

    this.processRootClassAttribute(this.parentClassList)
    this.processPresentation()
  }

  /**
   * @description The class attribute on the interaction's root element may contain
   * QTI 3 shared vocabulary.
   * @param - classList - a DOMTokenList of class attribute values
   */
  processRootClassAttribute (classList) {
    const classValues = classList.values()
    for (let clazz of classValues) {
      switch (clazz) {
        case this.constants.QTI_LABELS_NONE:
          this.presentation_HideLabels = true
          break

        case this.constants.QTI_LABELS_UPPER_ALPHA:
          this.presentation_Labels = this.constants.LABELS_UPPER_ALPHA
          break

        case this.constants.QTI_LABELS_LOWER_ALPHA:
          this.presentation_Labels = this.constants.LABELS_LOWER_ALPHA
          break

        case this.constants.QTI_LABELS_DECIMAL:
          this.presentation_Labels = this.constants.LABELS_DECIMAL
          break

        case this.constants.QTI_LABELS_SUFFIX_NONE:
          this.presentation_LabelsSuffix = this.constants.LABELS_SUFFIX_NONE
          break

        case this.constants.QTI_LABELS_SUFFIX_PERIOD:
          this.presentation_LabelsSuffix = this.constants.LABELS_SUFFIX_PERIOD
          break

        case this.constants.QTI_LABELS_SUFFIX_PARENTHESIS:
          this.presentation_LabelsSuffix = this.constants.LABELS_SUFFIX_PARENTHESIS
          break

        case this.constants.QTI_CHOICES_TOP:
        case this.constants.QTI_CHOICES_BOTTOM:
        case this.constants.QTI_CHOICES_LEFT:
        case this.constants.QTI_CHOICES_RIGHT:
          this.presentation_Choices_Orientation = clazz
          break

        default:
          break
      } // end switch
    } // end for
  }

  processPresentation () {
    this.processOrientation()

    if (this.presentation_Choices_Orientation === null) return

    const targetWrapper = this.createTargetWrapper()

    if (this.presentation_Choices_Orientation === this.constants.QTI_CHOICES_LEFT) {
      this.orderGroupNode.$refs.ordergroup.classList.add(this.constants.QTI_CHOICES_LEFT)
      // place targetWrapper after source choices
      this.orderWrapperElement.appendChild(targetWrapper)
    } else if (this.presentation_Choices_Orientation === this.constants.QTI_CHOICES_TOP) {
      // place targetWrapper after source choices
      this.orderWrapperElement.appendChild(targetWrapper)
    } else if (this.presentation_Choices_Orientation === this.constants.QTI_CHOICES_RIGHT) {
      this.orderGroupNode.$refs.ordergroup.classList.add(this.constants.QTI_CHOICES_RIGHT)
      // place targetWrapper in front of source choices
      this.orderWrapperElement.insertBefore(targetWrapper, this.orderGroupNode.$refs.ordergroup)
    } else if (this.presentation_Choices_Orientation === this.constants.QTI_CHOICES_BOTTOM) {
      // place targetWrapper in front of source choices
      this.orderWrapperElement.insertBefore(targetWrapper, this.orderGroupNode.$refs.ordergroup)
    }
  }

  processOrientation () {
    // Default to vertical orientation.
    const orientation = this.getOrientationClass(this.presentation_IsOrientationVertical)
    // Add the proper orientation to the ordergroup element
    this.orderGroupNode.$refs.ordergroup.classList.add(orientation)
  }

  getOrientationClass (isVertical) {
    if (isVertical) return this.constants.QTI_ORIENTATION_VERTICAL
    return this.constants.QTI_ORIENTATION_HORIZONTAL
  }

  createTargetWrapper () {
    let targetWrapper = document.createElement('ul')
    targetWrapper.classList.add('qti-order-target-wrapper')

    if (this.presentation_Choices_Orientation === this.constants.QTI_CHOICES_LEFT) {
      targetWrapper.classList.add(this.constants.QTI_CHOICES_LEFT)
    } else if (this.presentation_Choices_Orientation === this.constants.QTI_CHOICES_RIGHT) {
      targetWrapper.classList.add(this.constants.QTI_CHOICES_RIGHT)
    }

    targetWrapper.classList.add(this.getOrientationClass(this.presentation_IsOrientationVertical))

    for (let i=0; i<this.choices.length; i++) {
      targetWrapper.appendChild(this.createTargetFromChoice(i))
    }

    return targetWrapper
  }

  createTargetFromChoice (index) {
    let target = document.createElement('li')

    if (this.presentation_HideLabels) {
      // Setting this will shrink the min-height of the target
      target.classList.add('qti-labels-none')
    }

    target.classList.add('target')
    target.setAttribute('data-identifier', index)
    target.setAttribute('aria-label', index)
    this.createTargetLabel(target, index)
    return target
  }

  createTargetLabel (target, index) {
    if (this.presentation_HideLabels) return

    let labelDiv = document.createElement('div')
    labelDiv.classList.add('target-label')
    labelDiv.innerText = `${this.presentation_Labels[index]}${this.presentation_LabelsSuffix}`
    target.appendChild(labelDiv)
  }

}

export default OrderPresentationFactory
