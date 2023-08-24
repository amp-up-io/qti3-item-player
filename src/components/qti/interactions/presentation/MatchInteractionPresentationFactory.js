/**
 * @description Class to encapsulate all QTI shared presentation vocabulary
 * for a qti-match-interaction.
 */
class MatchPresentationFactory {

  constructor() {
    this.constants = {
      // QTI 3 Shared Vocabulary constants
      // Use class attribute to define these.

      // Choices orientation
      QTI_CHOICES_TOP: 'qti-choices-top',
      QTI_CHOICES_BOTTOM: 'qti-choices-bottom',
      QTI_CHOICES_LEFT: 'qti-choices-left',
      QTI_CHOICES_RIGHT: 'qti-choices-right',

      // Indicates a match interaction in a table
      QTI_MATCH_TABULAR: 'qti-match-tabular',
      QTI_HEADER_HIDDEN: 'qti-header-hidden',
      // When qti-match-tabular - flip the source-target axes
      ROW_CENTRIC: 'row-centric',

      // Use data- attributes to define these.
      DATA_MAX_SELECTIONS_MESSAGE: 'data-max-selections-message',
      DATA_MIN_SELECTIONS_MESSAGE: 'data-min-selections-message',
      DATA_FIRST_COLUMN_HEADER: ''
    }

    this.interactionSubType = 'default'
    this.parentClass = ''
    this.clazzTokens = []
    this.matchWrapperElement = null
    this.matchGroupNode = null
    this.matchSetNode1 = null
    this.matchSetNode2 = null
    this.choices1 = []
    this.choices2 = []

    this.presentation_Choices_Orientation = null
    this.presentation_Header_Hidden = false
    this.presentation_Row_Centric = false

    this.presentation_MaxSelectionsMessage = ''
    this.presentation_MinSelectionsMessage = ''
  }

  /**
   * @description Initialize the factory by passing the Match interaction class attribute and
   * a reference to the match group component.
   * @param - matchWrapperElement - a DOM element that wraps the matchGroupNode
   * @param - matchGroupNode - a component (not a DOM element) that encapsulates the simple match sets
   * @param - matchSetNode1 - a component (not a DOM element) that encapsulates the first match set's choices
   * @param - matchSetNode2 - a component (not a DOM element) that encapsulates the second match set's choices
   */
  initialize (interactionSubType, matchWrapperElement, matchGroupNode, matchSetNode1, matchSetNode2) {
    this.interactionSubType = interactionSubType
    this.matchWrapperElement = matchWrapperElement
    this.matchGroupNode = matchGroupNode
    this.parentClass = matchGroupNode.matchInteractionStaticClass
    this.matchSetNode1 = matchSetNode1
    this.matchSetNode2 = matchSetNode2

    this.choices1 = this.matchSetNode1.getChoices()
    this.choices2 = this.matchSetNode2.getChoices()

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

        case this.constants.QTI_MATCH_TABULAR:
          // Placeholder.  Do Nothing.
          break

        case this.constants.QTI_HEADER_HIDDEN:
          this.presentation_Header_Hidden = true
          break

        case this.constants.ROW_CENTRIC:
          this.presentation_Row_Centric = true
          break

        default:
          break
      } // end switch
    } // end for

    // Save it for later
    this.clazzTokens = clazzTokens
  }

  processPresentation () {

    this.matchSetNode1.$refs.matchset.classList.add('qti-match-source-wrapper')
    this.matchSetNode2.$refs.matchset.classList.add('qti-match-target-wrapper')
    
    if (this.interactionSubType === 'default') {

      if (this.presentation_Choices_Orientation === null) {
        this.presentation_Choices_Orientation = this.constants.QTI_CHOICES_TOP
      }

      if (this.presentation_Choices_Orientation === this.constants.QTI_CHOICES_LEFT) {
        this.matchSetNode1.$refs.matchset.classList.add(this.constants.QTI_CHOICES_LEFT)
        this.matchSetNode2.$refs.matchset.classList.add(this.constants.QTI_CHOICES_LEFT)
      } else if (this.presentation_Choices_Orientation === this.constants.QTI_CHOICES_TOP) {
        this.matchSetNode1.$refs.matchset.classList.add(this.constants.QTI_CHOICES_TOP)
        this.matchSetNode2.$refs.matchset.classList.add(this.constants.QTI_CHOICES_TOP)
      } else if (this.presentation_Choices_Orientation === this.constants.QTI_CHOICES_RIGHT) {
        this.matchSetNode1.$refs.matchset.classList.add(this.constants.QTI_CHOICES_RIGHT)
        this.matchSetNode2.$refs.matchset.classList.add(this.constants.QTI_CHOICES_RIGHT)
        // place matchSetNode2 before matchSetNode1
        this.matchWrapperElement.insertBefore(this.matchSetNode2.$refs.matchset, this.matchSetNode1.$refs.matchset)
      } else if (this.presentation_Choices_Orientation === this.constants.QTI_CHOICES_BOTTOM) {
        this.matchSetNode1.$refs.matchset.classList.add(this.constants.QTI_CHOICES_BOTTOM)
        this.matchSetNode2.$refs.matchset.classList.add(this.constants.QTI_CHOICES_BOTTOM)
        // place matchSetNode2 before matchSetNode1
        this.matchWrapperElement.insertBefore(this.matchSetNode2.$refs.matchset, this.matchSetNode1.$refs.matchset)
      }

      this.updateMatchSetChoices(this.matchSetNode1, true)
      this.updateMatchSetChoices(this.matchSetNode2, false)  

    } else if (this.interactionSubType === 'matchtabular') {
      this.createMatchTable()

      // Hide the matchsets
      this.matchSetNode1.$refs.matchset.classList.add('matchset-hidden')
      this.matchSetNode2.$refs.matchset.classList.add('matchset-hidden')
    }

  }

  updateMatchSetChoices (matchSetNode, isSource) {
    const choices = matchSetNode.getChoices()
    for (let i=0; i < choices.length; i++) {
      if (isSource) {
        choices[i].$refs.choice.classList.add('source')
        choices[i].$refs.description.classList.add('draggable')
      } else {
        choices[i].$refs.choice.classList.add('target')
        choices[i].$refs.description.classList.add('match-target-label')
      }
    }    
  }

  createMatchTable () {
      // Create and insert a table element
      const tableElement = document.createElement('table')

      this.clazzTokens.forEach((token) => {
        tableElement.classList.add(token)
      })

      // Add extra's
      tableElement.classList.add('matchtabular', 'table', 'table-bordered')

      // Insert it
      this.matchWrapperElement.insertBefore(tableElement, this.matchSetNode1.$refs.matchset)
  }

}

export default MatchPresentationFactory
