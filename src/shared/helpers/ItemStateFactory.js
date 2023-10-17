export class ItemStateFactory {

  constructor(identifier, store) {
    // Sometimes we just use a raw constructor in order
    // to get access to this class's methods.
    if (typeof identifier === 'undefined') return this

    this.identifier = identifier
    this.guid = store.getItemContextGuid()
    this.contextVariables = store.getContextDeclarations()
    this.responseVariables = store.getResponseDeclarations()
    this.templateVariables = store.getTemplateDeclarations()
    this.outcomeVariables = store.getOutcomeDeclarations()
    this.validationMessages = store.getItemContextValidationMessages()
    return this
  }

  createStateFromState (state) {
    this.identifier = state.identifier
    this.guid = state.guid
    this.contextVariables = state.contextVariables
    this.responseVariables = state.responseVariables
    this.templateVariables = state.templateVariables
    this.outcomeVariables = state.outcomeVariables
    this.validationMessages = state.validationMessages

    return this.getSerializedState()
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
      let obj = {
        identifier: responseVariable.identifier,
        cardinality: responseVariable.cardinality,
        baseType: responseVariable.baseType,
        value: this.serializeVariableValue(responseVariable.cardinality, responseVariable.value),
        state: this.serializeVariableState(responseVariable.state)
      }

      // Response variable may have an optional correct.
      if ('correctResponse' in responseVariable) {
        obj.correctResponse = this.serializeVariableValue(responseVariable.cardinality, responseVariable.correctResponse)
      }

      variableArray.push(obj)
    })

    return variableArray
  }

  serializeVariables (variables) {
    let variableArray = []
    variables.forEach((variable) => {
      variableArray.push({
        identifier: variable.identifier,
        cardinality: variable.cardinality,
        baseType: variable.baseType,
        value: this.serializeVariableValue(variable.cardinality, variable.value)
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

  serializeVariableValue (cardinality, value) {
    if (cardinality !== 'record') return JSON.parse(JSON.stringify(value))

    // Records are Map's - special handling.
    return this.serializeRecordVariableValue(value)
  }

  serializeVariableState (state) {
    return JSON.parse(JSON.stringify(state))
  }

  serializeRecordVariableValue (value) {
    const jsonString = this.strMapToJson(value)
    return this.jsonToStrMap(jsonString)
  }

  strMapToJson (stringMap) {
    return JSON.stringify(this.strMapToObj(stringMap))
  }

  jsonToStrMap(jsonString) {
    return this.objToStrMap(JSON.parse(jsonString))
  }

  strMapToObj (strMap) {
    let obj = Object.create(null)
    for (let [k,v] of strMap) {
      // We don’t escape the key '__proto__'
      // which can cause problems on older engines
      obj[k] = v
    }
    return obj
  }

  objToStrMap (obj) {
    let strMap = new Map()
    for (let k of Object.keys(obj)) {
      strMap.set(k, obj[k])
    }
    return strMap
  }

}
