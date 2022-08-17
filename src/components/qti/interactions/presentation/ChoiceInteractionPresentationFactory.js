/**
 * @description Class to encapsulate all QTI shared presentation vocabulary
 * for a qti-choice-interaction.
 */
class ChoicePresentationFactory {

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

      // Orientation
      QTI_ORIENTATION_VERTICAL: 'qti-orientation-vertical',
      QTI_ORIENTATION_HORIZONTAL: 'qti-orientation-horizontal',

      // Hide the input control (radio or checkbox)
      QTI_INPUT_CONTROL_HIDDEN: 'qti-input-control-hidden',

      // Sbac
      SBAC_PRESENTATION: 'sbac',

      // lrn
      LRN_PRESENTATION: 'lrn',

      // Stacking options
      QTI_CHOICES_STACKING_1: 'qti-choices-stacking-1',
      QTI_CHOICES_STACKING_2: 'qti-choices-stacking-2',
      QTI_CHOICES_STACKING_3: 'qti-choices-stacking-3',
      QTI_CHOICES_STACKING_4: 'qti-choices-stacking-4',
      QTI_CHOICES_STACKING_5: 'qti-choices-stacking-5',

      // Use data- attributes to define these.
      DATA_MAX_SELECTIONS_MESSAGE: 'data-max-selections-message',
      DATA_MIN_SELECTIONS_MESSAGE: 'data-min-selections-message'
    }

    this.parentClassList = null
    this.choiceGroupNode = null
    this.choices = null

    this.presentation_HideLabels = false
    this.presentation_Labels = this.constants.LABELS_UPPER_ALPHA
    this.presentation_LabelsSuffix = this.constants.LABELS_SUFFIX_PERIOD
    this.presentation_Sbac = false
    this.presentation_Lrn = false
    this.presentation_IsInputControlHidden = false
    this.presentation_IsOrientationVertical = false
    this.presentation_IsOrientationHorizontal =  false
    this.presentation_MaxSelectionsMessage = ''
    this.presentation_MinSelectionsMessage = ''
    this.presentation_Label_Style = ''
    this.presentation_Stacking_Class = ''
  }

  /**
   * @description Initialize the factory by passing the Choice interaction class attribute and
   * a reference to the choice group component.
   * @param - choiceGroupNode - a component (not a DOM element) that encapsulates the choices
   * @param - classList - this is the dom classList of the qti-choice-interaction component
   * @param - choices - array of choice objects derived from qti-simple-choice's
   */
    initialize (choiceGroupNode) {
      this.choiceGroupNode = choiceGroupNode
      this.parentClassList = choiceGroupNode.choiceInteractionClassAttribute
      this.choices = choiceGroupNode.choices

      this.processRootClassAttribute(this.parentClassList)
      this.processStackingClass()
      this.processLabelsAndInputControls()
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
          case this.constants.QTI_ORIENTATION_VERTICAL:
            this.presentation_IsOrientationVertical = true
            this.presentation_IsOrientationHorizontal = false
            break

          case this.constants.QTI_ORIENTATION_HORIZONTAL:
            this.presentation_IsOrientationVertical = false
            this.presentation_IsOrientationHorizontal = true
            break

          case this.constants.QTI_CHOICES_STACKING_1:
            this.presentation_Stacking_Class = this.constants.QTI_CHOICES_STACKING_1
            break

          case this.constants.QTI_CHOICES_STACKING_2:
            this.presentation_Stacking_Class = this.constants.QTI_CHOICES_STACKING_2
            break

          case this.constants.QTI_CHOICES_STACKING_3:
            this.presentation_Stacking_Class = this.constants.QTI_CHOICES_STACKING_3
            break

          case this.constants.QTI_CHOICES_STACKING_4:
            this.presentation_Stacking_Class = this.constants.QTI_CHOICES_STACKING_4
              break

          case this.constants.QTI_CHOICES_STACKING_5:
            this.presentation_Stacking_Class = this.constants.QTI_CHOICES_STACKING_5
            break

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

          case this.constants.QTI_INPUT_CONTROL_HIDDEN:
            this.presentation_IsInputControlHidden = true
            break

          case this.constants.SBAC_PRESENTATION:
            this.presentation_Sbac = true
            break

          case this.constants.LRN_PRESENTATION:
            this.presentation_Lrn = true
            break

          default:
            break
        } // end switch
      } // end for
    }

    /**
     * @description Utility method to compute a Stacking Class when orientation is horizontal
     * and a Stacking Class is not explicitly specified.
     */
    processStackingClass () {
      // If there is a stacking class, but no explicit orientation, then coerce orientation
      if ((this.presentation_Stacking_Class !== '') &&
          !this.presentation_IsOrientationVertical &&
          !this.presentation_IsOrientationHorizontal) {

        if (this.choices.length > 1) {
          // coerce to horizontal
          this.presentation_IsOrientationHorizontal = true
        } else {
          // coerce orientation to Vertical
          this.presentation_IsOrientationVertical = true
        }

      } else if ((this.presentation_Stacking_Class === '') && this.presentation_IsOrientationHorizontal) {
        // If orientation is explicitly horizontal, but no stacking class is specified, then coerce the
        const count = this.choices.length
        if (count >= 5) {
          // QTI shared vocabulary permits stacking support max of 5
          this.presentation_Stacking_Class = this.constants.QTI_CHOICES_STACKING_5
        } else if (count == 4) {
          this.presentation_Stacking_Class = this.constants.QTI_CHOICES_STACKING_4
        } else if (count == 3) {
          this.presentation_Stacking_Class = this.constants.QTI_CHOICES_STACKING_3
        } else if (count == 2) {
          this.presentation_Stacking_Class = this.constants.QTI_CHOICES_STACKING_2
        }

        if (count == 1) {
          // coerce orientation to Vertical
          this.presentation_IsOrientationVertical = true
          this.presentation_IsOrientationHorizontal = false
        }
      }

      // If still no explicit or coerced orientation (via stacking) then default to vertical orientation
      // according to QTI 3 specification
      if (!this.presentation_IsOrientationVertical && !this.presentation_IsOrientationHorizontal) {
        this.presentation_IsOrientationVertical = true
      }

      // Add the proper orientation to the choicegroup element
      this.choiceGroupNode.$refs.choicegroup.classList.add((this.presentation_IsOrientationVertical) ? this.constants.QTI_ORIENTATION_VERTICAL : this.constants.QTI_ORIENTATION_HORIZONTAL)

      // Add the proper stacking class to the choicegroup element
      if (this.presentation_Stacking_Class !== '') {
        this.choiceGroupNode.$refs.choicegroup.classList.add(this.presentation_Stacking_Class)
      }
    }

  /**
   * @description Utility method to Show/Hide Input Controls and Labels on all choices.
   */
  processLabelsAndInputControls () {
    for (let index = 0; index < this.choices.length; index++) {
      // Update Labels
      if (this.presentation_HideLabels) {
        this.choices[index].hideLabel()
      } else if (this.presentation_Sbac) {
        this.choices[index].setLabelSbac(this.presentation_Labels[index])
      } else if (this.presentation_Lrn) {
        this.choices[index].setLabelLrn(this.presentation_Labels[index]);
      } else {
        this.choices[index].setLabel(this.presentation_Labels[index] + this.presentation_LabelsSuffix)
      }

      // Update input control.  By default, input control (radio button or checkbox) is visible.
      if (this.presentation_IsInputControlHidden) {
        this.choices[index].hideControl()
      }
    }
  }
}

export default ChoicePresentationFactory
