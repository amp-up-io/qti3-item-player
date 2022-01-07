export class SessionControlFactory {

  constructor(
      maxAttempts=0,
      showFeedback=false,
      allowReview=true,
      allowComment=false,
      allowSkipping=true,
      showSolution=false,
      validateResponses=false,
      timeLimits=null) {
    this.maxAttempts = maxAttempts
    this.showFeedback = showFeedback
    this.allowReview = allowReview
    this.allowComment = allowComment
    this.allowSkipping = allowSkipping
    this.showSolution = showSolution
    this.validateResponses = validateResponses
    this.timeLimits = timeLimits
    return this
  }

  getSessionControl () {
    let sessionControl = {
      allowComment: this.getAllowComment(),
      allowReview: this.getAllowReview(),
      allowSkipping: this.getAllowSkipping(),
      maxAttempts: this.getMaxAttempts(),
      showFeedback: this.getShowFeedback(),
      showSolution: this.getShowSolution(),
      timeLimits: this.getTimeLimits(),
      validateResponses: this.getValidateResponses()
    }
    return sessionControl
  }

  getAllowComment () {
    return this.allowComment
  }

  setAllowComment (allowComment) {
    this.allowComment = allowComment
  }

  getAllowReview () {
    return this.allowReview
  }

  setAllowReview (allowReview) {
    this.allowReview = allowReview
  }

  getAllowSkipping () {
    return this.allowSkipping
  }

  setAllowSkipping (allowSkipping) {
    this.allowSkipping = allowSkipping
  }

  getMaxAttempts () {
    return this.maxAttempts
  }

  setMaxAttempts (maxAttempts) {
    this.maxAttempts = maxAttempts
  }

  getShowFeedback () {
    return this.showFeedback
  }

  setShowFeedback (showFeedback) {
    this.showFeedback = showFeedback
  }

  getShowSolution () {
    return this.showSolution
  }

  setShowSolution (showSolution) {
    this.showSolution = showSolution
  }

  getTimeLimits () {
    return this.timeLimits
  }

  /**
   * @description TimeLimits is an object with the following schema:
   * {
   *   minTime: [0..1] non-negative double
   *   maxTime: [0..1] non-negative double
   *   allowLateSubmission: [0..1] boolean=false
   * }
   */
  setTimeLimits (timeLimits) {
    this.timeLimits = timeLimits
  }

  getValidateResponses () {
    return this.validateResponses
  }

  setValidateResponses (validateResponses) {
    this.validateResponses = validateResponses
  }

}
