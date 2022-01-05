
export default class QtiParseException extends Error {
  constructor(message) {
    super(message)
    this.name = 'QtiParseException'
  }

}
