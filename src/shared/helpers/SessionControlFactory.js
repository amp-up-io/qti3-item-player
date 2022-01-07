export class SessionControlFactory {

  constructor () {
    this.sc = this.defaultSessionControl()
    return this
  }

  constants = {
    TIME_LIMITS_DEFAULT: {
      minTime: null, // no limit
      maxTime: null, // no limit
      allowLateSubmission: false
    },
    ATTEMPTS_UNLIMITED: 0
  }

  defaultSessionControl () {
    let sc = {
      allowComment: false,
      allowReview: true,
      allowSkipping: true,
      maxAttempts: this.constants.ATTEMPTS_UNLIMITED,
      showFeedback: false,
      showSolution: false,
      timeLimits: this.constants.TIME_LIMITS_DEFAULT,
      validateResponses: false
    }
    return sc
  }

  setSessionControl (sc) {
    if (typeof sc === 'undefined') return

    if (sc === null) {
      this.sc = this.defaultSessionControl()
    }

    if (('allowComment' in sc) && (sc.allowComment !== null)) {
      this.setAllowComment(sc.allowComment)
    }

    if (('allowReview' in sc) && (sc.allowReview !== null)) {
      this.setAllowReview(sc.allowReview)
    }

    if (('allowSkipping' in sc) && (sc.allowSkipping !== null)) {
      this.setAllowSkipping(sc.allowSkipping)
    }

    if (('maxAttempts' in sc) && (sc.maxAttempts !== null)) {
      this.setMaxAttempts(sc.maxAttempts)
    }

    if (('showFeedback' in sc) && (sc.showFeedback !== null)) {
      this.setShowFeedback(sc.showFeedback)
    }

    if (('showSolution' in sc) && (sc.showSolution !== null)) {
      this.setShowSolution(sc.showSolution)
    }

    if (('timeLimits' in sc) && (sc.timeLimits !== null)) {
      if ('minTime' in sc.timeLimits) {
        this.setTimeLimitsMinTime(sc.timeLimits.minTime)
      }
      if ('maxTime' in sc.timeLimits) {
        this.setTimeLimitsMaxTime(sc.timeLimits.maxTime)
      }
      if ('allowLateSubmission' in sc.timeLimits) {
        this.setTimeLimitsAllowLateSubmission(sc.timeLimits.allowLateSubmission)
      }
    }

    if (('validateResponses' in sc) && (sc.validateResponses !== null)) {
      this.setValidateResponses(sc.validateResponses)
    }
  }


  getSessionControl () {
    let sc = {
      allowComment: this.getAllowComment(),
      allowReview: this.getAllowReview(),
      allowSkipping: this.getAllowSkipping(),
      maxAttempts: this.getMaxAttempts(),
      showFeedback: this.getShowFeedback(),
      showSolution: this.getShowSolution(),
      timeLimits: this.getTimeLimits(),
      validateResponses: this.getValidateResponses()
    }
    return sc
  }

  getAllowComment () {
    return this.sc.allowComment
  }

  setAllowComment (allowComment) {
    this.sc.allowComment = allowComment
  }

  getAllowReview () {
    return this.sc.allowReview
  }

  setAllowReview (allowReview) {
    this.sc.allowReview = allowReview
  }

  getAllowSkipping () {
    return this.sc.allowSkipping
  }

  setAllowSkipping (allowSkipping) {
    this.allowSkipping = allowSkipping
  }

  getMaxAttempts () {
    return this.sc.maxAttempts
  }

  setMaxAttempts (maxAttempts) {
    this.sc.maxAttempts = maxAttempts
  }

  getShowFeedback () {
    return this.sc.showFeedback
  }

  setShowFeedback (showFeedback) {
    this.sc.showFeedback = showFeedback
  }

  getShowSolution () {
    return this.sc.showSolution
  }

  setShowSolution (showSolution) {
    this.sc.showSolution = showSolution
  }

  getTimeLimits () {
    return this.sc.timeLimits
  }

  /**
   * @description Set all timeLimits properties in one call.
   * @param minTime - non-negative double=null
   * @param maxTime - non-negative double=null
   * @param allowLateSubmission - boolean=false
   */
  setTimeLimits (minTime=null, maxTime=null, allowLateSubmission=false) {
    this.setTimeLimitsMinTime(minTime)
    this.setTimeLimitsMaxTime(maxTime)
    this.setTimeLimitsAllowLateSubmission(allowLateSubmission)
  }

  getTimeLimitsMinTime () {
    return this.sc.timeLimits.minTime
  }

  setTimeLimitsMinTime (minTime) {
    this.sc.timeLimits.minTime = minTime
  }

  getTimeLimitsMaxTime () {
    return this.sc.timeLimits.maxTime
  }

  setTimeLimitsMaxTime(maxTime) {
    this.sc.timeLimits.maxTime = maxTime
  }

  getTimeLimitsAllowLateSubmission () {
    return this.sc.timeLimits.allowLateSubmission
  }

  setTimeLimitsAllowLateSubmission(allowLateSubmission) {
    this.sc.timeLimits.allowLateSubmission = allowLateSubmission
  }

  getValidateResponses () {
    return this.sc.validateResponses
  }

  setValidateResponses (validateResponses) {
    this.sc.validateResponses = validateResponses
  }

}
