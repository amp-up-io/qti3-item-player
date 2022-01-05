
export default class QtiExitProcessingException extends Error {
  constructor(message) {
    super(message)
    this.name = 'QtiExitProcessingException'
  }
}
