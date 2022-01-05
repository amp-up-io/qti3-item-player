
export default class QtiTemplateConstraintException extends Error {
  constructor(message) {
    super(message)
    this.name = 'QtiTemplateConstraintException'
  }
}
