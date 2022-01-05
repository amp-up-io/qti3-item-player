
export default class QtiEvaluationException extends Error {
  constructor(message) {
    super(message)
    this.name = 'QtiEvaluationException'
  }
}
