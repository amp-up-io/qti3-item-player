import { RecordField } from '@/shared/helpers/RecordField'
import { PnpFactory } from '@/shared/helpers/PnpFactory'
import { SessionControlFactory } from '@/shared/helpers/SessionControlFactory'
import { ItemStateFactory } from '@/shared/helpers/ItemStateFactory'

export const store = {

  player: null,

  state: {
    item: null,
    itemBody: null,
    identifier: '',
    title: '',
    responseDeclarations: [],
    outcomeDeclarations: [],
    templateDeclarations: [],
    contextDeclarations: [],
    interactions: [],
    processing: [],
    feedbacks: [],
    templates: [],
    printedVariables: []
  },

  itemContext: {
    guid: null,
    pnp: null,
    sc: null, // itemSessionControl
    state: null,
    validationMessages: [] // store for validation messages
  },

  getResponseDeclarations () {
    return this.state.responseDeclarations
  },

  getResponseDeclaration (identifier) {
    return this.state.responseDeclarations.find(rd => rd.identifier === identifier)
  },

  getOutcomeDeclarations () {
    return this.state.outcomeDeclarations
  },

  getOutcomeDeclaration (identifier) {
    return this.state.outcomeDeclarations.find(od => od.identifier === identifier)
  },

  getTemplateDeclarations () {
    return this.state.templateDeclarations
  },

  getTemplateMathParameterVariables () {
    return this.state.templateDeclarations.filter(td => td.mathVariable === true)
  },

  getTemplateDeclaration (identifier) {
    return this.state.templateDeclarations.find(td => td.identifier === identifier)
  },

  getContextDeclarations () {
    return this.state.contextDeclarations
  },

  getContextDeclaration (identifier) {
    return this.state.contextDeclarations.find(cd => cd.identifier === identifier)
  },

  /**
   * @description Global search for a variable declaration.
   */
  getVariableDeclaration (identifier) {
    let declaration = this.state.outcomeDeclarations.find(od => od.identifier === identifier)
    if (typeof declaration !== 'undefined') {
      return declaration
    }
    declaration = this.state.responseDeclarations.find(rd => rd.identifier === identifier)
    if (typeof declaration !== 'undefined') {
      return declaration
    }
    declaration = this.state.templateDeclarations.find(td => td.identifier === identifier)
    if (typeof declaration !== 'undefined') {
      return declaration
    }
    declaration = this.state.contextDeclarations.find(cd => cd.identifier === identifier)
    if (typeof declaration !== 'undefined') {
      return declaration
    }
    return null
  },

  getInteraction (identifier) {
    return this.state.interactions.find(interaction => interaction.identifier === identifier)
  },

  getInteractions () {
    return this.state.interactions
  },

  getProcessing (processingType) {
    return this.state.processing.find(processingObject => processingObject.processingType === processingType)
  },

  getFeedbacks () {
    return this.state.feedbacks
  },

  getTemplates () {
    return this.state.templates
  },

  getPrintedVariables () {
    return this.state.printedVariables
  },

  getItem () {
    return this.state.item
  },

  setItem (node) {
    this.state.item = node.item
  },

  getItemBody () {
    return this.state.itemBody
  },

  setItemBody (node) {
    this.state.itemBody = node
  },

  defineResponseDeclaration (responseDeclaration) {
    let rdIndex = this.state.responseDeclarations.findIndex(rd => rd.identifier == responseDeclaration.identifier)

    if (rdIndex > -1) {
      // Found the response variable. This is an error.  Update it for now.
      this.state.responseDeclarations[rdIndex] = responseDeclaration
    } else {
      // New response variable.
      this.state.responseDeclarations.push(responseDeclaration)
    }
  },

  defineOutcomeDeclaration (outcomeDeclaration) {
    let odIndex = this.state.outcomeDeclarations.findIndex(od => od.identifier == outcomeDeclaration.identifier)

    if (odIndex > -1) {
      // Found the outcome variable.
      this.state.outcomeDeclarations[odIndex] = outcomeDeclaration
    } else {
      // New outcome variable.
      this.state.outcomeDeclarations.push(outcomeDeclaration)
    }
  },

  defineTemplateDeclaration (templateDeclaration) {
    let tdIndex = this.state.templateDeclarations.findIndex(td => td.identifier == templateDeclaration.identifier)

    if (tdIndex > -1) {
      // Found the template variable.
      this.state.templateDeclarations[tdIndex] = templateDeclaration
    } else {
      // New template variable.
      this.state.templateDeclarations.push(templateDeclaration)
    }
  },

  defineContextDeclaration (contextDeclaration) {
    let cdIndex = this.state.contextDeclarations.findIndex(cd => cd.identifier == contextDeclaration.identifier)

    if (cdIndex > -1) {
      // Found the context variable.
      this.state.contextDeclarations[cdIndex] = contextDeclaration
    } else {
      // New context variable.
      this.state.contextDeclarations.push(contextDeclaration)
    }
  },

  defineInteraction (interaction) {
    let interactionIndex = this.state.interactions.findIndex(i => i.identifier == interaction.identifier)

    if (interactionIndex < 0) {
      console.log('[DefineInteraction][' + interaction.identifier + ']')
      // New interaction
      this.state.interactions.push(interaction)
      return
    }

    // Found the interaction. Update properties.
    let i = this.state.interactions[interactionIndex]
    i.interactionType = interaction.interactionType
    i.isValidResponse = interaction.isValidResponse
    i.invalidResponseMessage = interaction.invalidResponseMessage
    i.maxSelectionsMessage = interaction.maxSelectionsMessage
    i.node = interaction.node
    i.resetValue = interaction.resetValue
  },

  defineProcessing (processingObject) {
    let processingType = processingObject.processingType
    let processingIndex = this.state.processing.findIndex(processing => processing.processingType == processingType)

    if (processingIndex > -1) {
      // Found the processingObject. Overwrite it.
      this.state.processing[processingIndex] = processingObject
    } else {
      // New processing of type processingType.
      this.state.processing.push(processingObject)
    }

    if (processingType == 'response')
      console.log('[QtiResponseProcessing][Defined]', processingObject)
    else if (processingType == 'template')
      console.log('[QtiTemplateProcessing][Defined]', processingObject)
    else if (processingType == 'outcome')
      console.log('[QtiOutcomeProcessing][Defined]', processingObject)
  },

  defineResponseProcessing (processingNode) {
    this.defineProcessing({ processingType: 'response', node: processingNode.node })
  },

  defineTemplateProcessing (processingNode) {
    this.defineProcessing({ processingType: 'template', node: processingNode.node })
  },

  defineItemBody (itemBodyObject) {
    this.setItemBody(itemBodyObject.node)
  },

  defineFeedback (feedback) {
    // New feedback element
    this.state.feedbacks.push(feedback)
    console.log('[DefineFeedback][' + feedback.outcomeIdentifier + '][' + feedback.identifier + ']')
  },

  defineTemplate (template) {
    this.state.templates.push(template)
  },

  definePrintedVariable (printedVariable) {
    this.state.printedVariables.push(printedVariable)
  },

  resetAll () {
    this.state.item = null
    this.state.itemBody = null
    this.state.identifier = ''
    this.state.title = ''
    this.state.responseDeclarations.splice(0, this.state.responseDeclarations.length)
    this.state.outcomeDeclarations.splice(0, this.state.outcomeDeclarations.length)
    this.state.templateDeclarations.splice(0, this.state.templateDeclarations.length)
    this.state.contextDeclarations.splice(0, this.state.contextDeclarations.length)
    this.state.interactions.splice(0, this.state.interactions.length)
    this.state.processing.splice(0, this.state.processing.length)
    this.state.feedbacks.splice(0, this.state.feedbacks.length)
    this.state.templates.splice(0, this.state.templates.length)
    this.state.printedVariables.splice(0, this.state.printedVariables.length)
    // Reset itemContext
    this.itemContext.guid = null
    this.itemContext.state = null
    this.itemContext.validationMessages.splice(0, this.itemContext.validationMessages.length)
    // For now, do not reset pnp and sessionControl
    // this.itemContext.pnp = null
    // this.itemContext.sc = null
  },

  initializeBuiltInDeclarations () {
    // Function to stub out resetValue
    function reset() {
      return 0
    }

    const defaultValueMap = new Map()
    defaultValueMap.set('candidateIdentifier', new RecordField('candidateIdentifier', 'string', null))
    defaultValueMap.set('testIdentifier', new RecordField('testIdentifier', 'string', null))
    defaultValueMap.set('environmentIdentifier', new RecordField('environmentIdentifier', 'string', null))

    // QTI_CONTEXT is built-in QTI3 Context variable
    this.defineContextDeclaration({
      identifier: 'QTI_CONTEXT',
      baseType: null,
      cardinality: 'record',
      value: defaultValueMap,
      defaultValue: defaultValueMap
    })
    console.log('[QtiAssessmentItem][QTI_CONTEXT] initialized')

    // Built-in Outcomes
    // SCORE
    this.defineOutcomeDeclaration({
      identifier: 'SCORE',
      baseType: 'float',
      cardinality: 'single',
      value: 0,
      defaultValue: 0,
      lookupTable: null,
      lookupTableType: null
    })
    console.log('[QtiAssessmentItem][SCORE] initialized')

    // completionStatus
    this.defineOutcomeDeclaration({
      identifier: 'completionStatus',
      baseType: 'identifier',
      cardinality: 'single',
      value: 'not_attempted',
      defaultValue: 'not_attempted',
      lookupTable: null,
      lookupTableType: null
    })
    console.log('[QtiAssessmentItem][completionStatus] initialized')

    // Built-in Response Variables
    // numAttempts
    this.defineResponseDeclaration({
      identifier: 'numAttempts',
      baseType: 'integer',
      cardinality: 'single',
      value: 0,
      resetValue: reset,
      defaultValue: 0,
      state: null
    })
    console.log('[QtiAssessmentItem][numAttempts] initialized')

    // duration
    this.defineResponseDeclaration({
      identifier: 'duration',
      baseType: 'duration',
      cardinality: 'single',
      value: 0,
      resetValue: reset,
      defaultValue: 0,
      state: null
    })
    console.log('[QtiAssessmentItem][duration] initialized')
  },

  setOutcomeVariableValue (valueObject) {
    let odIndex = this.state.outcomeDeclarations.findIndex(od => od.identifier == valueObject.identifier)

    if (odIndex < 0) return

    // Found the outcome variable, update its value property
    this.state.outcomeDeclarations[odIndex].value = valueObject.value
  },

  resetOutcomeVariableValue (valueObject) {
    let odIndex = this.state.outcomeDeclarations.findIndex(od => od.identifier == valueObject.identifier)

    if (odIndex < 0) return

    // Found the outcome variable, reset its value property
    let declaration = this.state.outcomeDeclarations[odIndex]
    if (declaration.defaultValue !== null) {
      declaration.value = this.defaultValue
      return
    }

    // Record, multiple, ordered are set to null
    if ((declaration.cardinality === 'record') ||
        (declaration.cardinality === 'multiple') ||
        (declaration.cardinality === 'ordered')) {
      declaration.value = null
      return
    }

    // Single cardinality, set numeric (or duration?) to 0, else set to null
    if ((declaration.baseType === 'integer') ||
        (declaration.baseType === 'float')) {
      declaration.value = 0
      return
    }

    declaration.value = null
  },

  setResponseVariableCorrectResponse (valueObject) {
    let rdIndex = this.state.responseDeclarations.findIndex(rd => rd.identifier == valueObject.identifier)

    if (rdIndex < 0) return

    // Found the response variable, set its correct response property
    let declaration = this.state.responseDeclarations[rdIndex]
    declaration.correctResponse = valueObject.value
  },

  setInteractionIsValidResponse (validityObject) {
    let interactionIndex = this.state.interactions.findIndex(interaction => interaction.identifier == validityObject.identifier)

    if (interactionIndex < 0) return

    // Found the interaction, update its isValidResponse property
    this.state.interactions[interactionIndex].isValidResponse = validityObject.isValidResponse
  },

  setResponseVariableValue (valueObject) {
    let rdIndex = this.state.responseDeclarations.findIndex(rd => rd.identifier == valueObject.identifier)

    if (rdIndex < 0) return

    // Found the response variable, update its value and state properties
    let declaration = this.state.responseDeclarations[rdIndex]
    declaration.value = valueObject.value
    declaration.state = valueObject.state
  },

  resetResponseVariableValue (valueObject) {
    let rdIndex = this.state.responseDeclarations.findIndex(rd => rd.identifier == valueObject.identifier)

    if (rdIndex < 0) return

    // Found the response variable, reset its value property
    let declaration = this.state.responseDeclarations[rdIndex]
    declaration.value = (declaration.defaultValue !== null ? declaration.defaultValue : null)
  },

  incrementNumAttempts () {
    let rdIndex = this.state.responseDeclarations.findIndex(rd => rd.identifier == 'numAttempts')
    this.state.responseDeclarations[rdIndex].value += 1
  },

  setTemplateVariableValue (valueObject) {
    let tdIndex = this.state.templateDeclarations.findIndex(td => td.identifier == valueObject.identifier)

    if (tdIndex <0) return

    // Found the template variable, update its value property
    this.state.templateDeclarations[tdIndex].value = valueObject.value
  },

  resetTemplateVariables () {
    this.state.templateDeclarations.forEach((templateDeclaration) => {
      templateDeclaration.node.reset()
    })
  },

  setVariableDefaultValue (valueObject) {
    // Try response variables
    let variableIndex = this.state.responseDeclarations.findIndex(rd => rd.identifier == valueObject.identifier)

    if (variableIndex > -1) {
      // Found the response variable, set its defaultValue property
      let declaration = this.state.responseDeclarations[variableIndex]
      declaration.defaultValue = valueObject.value
      return
    }

    // Try outcome variables
    variableIndex = this.state.outcomeDeclarations.findIndex(od => od.identifier == valueObject.identifier)

    if (variableIndex > -1) {
      // Found the outcome variable, set its defaultValue property
      let declaration = this.state.responseDeclarations[variableIndex]
      declaration.defaultValue = valueObject.value
      return
    }

    // TODO: Error?
  },

  getItemContextGuid () {
    return this.itemContext.guid
  },

  setItemContextGuid (guid) {
    this.itemContext.guid = guid
  },

  initializeItemContextPnp () {
    this.itemContext.pnp = new PnpFactory()
  },

  getItemContextPnp () {
    return this.itemContext.pnp
  },

  setItemContextPnp (pnp) {
    // Should always be a PnpFactory in itemContext, but check anyway.
    if (this.itemContext.pnp === null) {
      this.initializeItemContextPnp()
    }
    this.itemContext.pnp.setPnp(pnp)
  },

  initializeItemContextSessionControl () {
    this.itemContext.sc = new SessionControlFactory()
  },

  getItemContextSessionControl () {
    return this.itemContext.sc
  },

  setItemContextSessionControl (sessionControl) {
    // Should always be a SessionControlFactory in itemContext, but check anyway.
    if (this.itemContext.sc === null) {
      this.initializeItemContextSessionControl()
    }
    this.itemContext.sc.setSessionControl(sessionControl)
  },

  getItemContextState () {
    return this.itemContext.state
  },

  setItemContextState (state) {
    const itemStateFactory = new ItemStateFactory()
    // Copy the state
    const stateCopy = (state === null) ? state : itemStateFactory.createStateFromState(state)
    // Set the state to the new copy.
    this.itemContext.state = stateCopy
  },

  getItemContextStateVariable (identifier) {
    const state = this.getItemContextState()

    if (state === null) return null

    let declaration = state.outcomeVariables.find(od => od.identifier === identifier)
    if (typeof declaration !== 'undefined') return declaration

    declaration = state.responseVariables.find(rd => rd.identifier === identifier)
    if (typeof declaration !== 'undefined') return declaration

    declaration = state.templateVariables.find(td => td.identifier === identifier)
    if (typeof declaration !== 'undefined') return declaration

    declaration = state.contextDeclarations.find(cd => cd.identifier === identifier)
    if (typeof declaration !== 'undefined') return declaration

    return null
  },

  getItemContextValidationMessages () {
    return this.itemContext.validationMessages
  },

  addItemContextValidationMessage (validationMessageObject) {
    this.itemContext.validationMessages.push(validationMessageObject)
  },

  resetItemContextValidationMessages () {
    this.itemContext.validationMessages.splice(0, this.itemContext.validationMessages.length)
  },

  /**
   * @description Called when the Qti3Player is mounted.  Pass a copy
   * of itself in the playerNode parameter.
   * @param {Object} playerNode - object containing the player component (playerNode.player)
   */
  NotifyPlayerReady (playerNode) {
    this.player = playerNode.player
  },

  /**
   * @description This method should be called whenever we want to end an attempt.
   * For example, this might be called by a qti-end-attempt-interaction, or it might be
   * called by an item container such as an item or test controller.
   *
   * This calls the endAttempt method exposed by the qti-assessment-item component.
   * @param {Object} stateObject - an object containing any desired state.
   */
  NotifyEndAttempt (stateObject) {
    this.state.item.endAttempt(stateObject)
  },

  /**
   * @description This method should be called whenever we want to generate a
   * new template of the current item.
   * For example, this might be called by a qti-end-attempt-interaction, or it might be
   * called by an item container such as an item or test controller.
   *
   * This calls the newTemplate method exposed by the qti-assessment-item component.
   * @param {Object} stateObject - an object containing any desired state.
   */
  NotifyNewTemplate (stateObject) {
    this.state.item.newTemplate(stateObject)
  },

  /**
   * @description This method should be called after the qti-assessment-item component
   * has been completely loaded and parsed.
   * @param {Object} itemNode - an object containing the qti-assessment-item component itself.
   * e.g., { item: (reference to qti-assessment-item component) }
   */
  NotifyItemReady (itemNode) {
    this.setItem(itemNode)
  },

  /**
   * @description Method called by an interaction when the interaction determines
   * that its max-choices or max-selections threshold is about to be exceeded.
   * @param {String} message
   */
  NotifyInteractionSelectionsLimit(message) {
    const event = {
      icon: 'warning',
      message: message
    }
    this.player.displayAlertMessage(event)
  }
}
