export class ItemStateFactory {

  constructor(identifier, store) {
    this.identifier = identifier
    this.guid = store.getItemContextGuid()
    this.contextVariables = store.getContextDeclarations()
    this.responseVariables = store.getResponseDeclarations()
    this.templateVariables = store.getTemplateDeclarations()
    this.outcomeVariables = store.getOutcomeDeclarations()
    this.validationMessages = store.getItemContextValidationMessages()

    return this
  }

  getSerializedState () {
    let state = {
      identifier: this.identifier,
      guid: this.guid,
      contextVariables: this.serializeVariables(this.contextVariables),
      responseVariables: this.serializeResponseVariables(this.responseVariables),
      outcomeVariables: this.serializeVariables(this.outcomeVariables),
      templateVariables: this.serializeVariables(this.templateVariables),
      validationMessages: this.serializeValidationMessages(this.validationMessages)
    }

    return state
  }

  serializeResponseVariables (responseVariables) {
    let variableArray = []
    responseVariables.forEach((responseVariable) => {
      variableArray.push({
        identifier: responseVariable.identifier,
        value: JSON.parse(JSON.stringify(responseVariable.value)),
        state: JSON.parse(JSON.stringify(responseVariable.state))
      })
    })

    return variableArray
  }

  serializeVariables (variables) {
    let variableArray = []
    variables.forEach((variable) => {
      variableArray.push({
        identifier: variable.identifier,
        value: JSON.parse(JSON.stringify(variable.value))
      })
    })

    return variableArray
  }

  serializeValidationMessages (messages) {
    let messageArray = []
    messages.forEach((message) => {
      messageArray.push({
        identifier: message.identifier,
        message: message.message
      })
    })

    return messageArray
  }

}
