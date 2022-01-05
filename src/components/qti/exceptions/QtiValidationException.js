
export default class QtiValidationException extends Error {
  constructor(message) {
    super(message)
    this.name = 'QtiParseException'
  }
}
