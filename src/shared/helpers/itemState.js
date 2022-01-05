export class itemState {

  constructor(guid, identifier, responseVars, templateVars, outcomeVars) {
    this.guid = guid
    this.identifier = identifier
    this.responseVariables = responseVars
    this.templateVariables = templateVars
    this.outcomeVariables = outcomeVars
    return this
  }

  getSerializedState () {
    let state = {
      guid: this.guid,
      identifier: this.identifier,
      responseVariables: [],
      outcomeVariables: [],
      templateVariables: []
    }

    state.responseVariables = this.serializeResponseVariables(this.responseVariables)
    state.outcomeVariables = this.serializeVariables(this.outcomeVariables)
    state.templateVariables = this.serializeVariables(this.templateVariables)

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

}
