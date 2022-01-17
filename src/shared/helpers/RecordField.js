/**
 * @description Helper Class for initializing default Record Fields.
 */
export class RecordField {

  constructor(identifier, baseType, value) {
    this.fieldIdentifier = identifier
    this.value = value
    this.baseType = baseType
    this.cardinality = 'single'
  }

  getValue () {
    return this.value
  }

  setValue (value) {
    this.value = value
  }

  getBaseType () {
    return this.baseType
  }

  setBaseType (baseType) {
    this.baseType = baseType
  }

  getCardinality () {
    return this.cardinality
  }

  getFieldIdentifier () {
    return this.fieldIdentifier
  }

  setFieldIdentifier (identifier) {
    this.fieldIdentifier = identifier
  }

}
