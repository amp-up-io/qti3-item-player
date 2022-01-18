export class SessionControlFactory {

  constructor () {
    this.sc = this.defaultSessionControl()
    return this
  }

  constants = {
    TIME_LIMITS_DEFAULT: {
      min_time: null, // no limit
      max_time: null, // no limit
      allow_late_submission: false
    },
    ATTEMPTS_UNLIMITED: 0
  }

  defaultSessionControl () {
    let sc = {
      allow_comment: false,
      allow_review: true,
      allow_skipping: true,
      max_attempts: this.constants.ATTEMPTS_UNLIMITED,
      show_feedback: false,
      show_solution: false,
      time_limits: this.constants.TIME_LIMITS_DEFAULT,
      /*
       * This attribute controls the behaviour of delivery engines when the candidate
       * submits an invalid response. An invalid response is defined to be a response
       * which does not satisfy the constraints imposed by the interaction with which
       * it is associated (see interaction for more information). When validateResponses
       * is turned on (true) then the candidates are not allowed to submit the item until
       * they have provided valid responses for all interactions. When turned off (false)
       * invalid responses may be accepted by the system. The value of this attribute is
       * only applicable when the item is in a testPart with individual submission mode
       * (see Navigation and Submission).
       */
      validate_responses: false
    }
    return sc
  }

  setSessionControl (sc) {
    if (typeof sc === 'undefined') return

    if (sc === null) {
      this.sc = this.defaultSessionControl()
    }

    if (('allow_comment' in sc) && (sc.allow_comment !== null)) {
      this.setAllowComment(sc.allow_comment)
    }

    if (('allow_review' in sc) && (sc.allow_review !== null)) {
      this.setAllowReview(sc.allow_review)
    }

    if (('allowSkipping' in sc) && (sc.allow_skipping !== null)) {
      this.setAllowSkipping(sc.allow_skipping)
    }

    if (('maxAttempts' in sc) && (sc.max_attempts !== null)) {
      this.setMaxAttempts(sc.max_attempts)
    }

    if (('showFeedback' in sc) && (sc.show_feedback !== null)) {
      this.setShowFeedback(sc.show_feedback)
    }

    if (('showSolution' in sc) && (sc.show_solution !== null)) {
      this.setShowSolution(sc.show_solution)
    }

    if (('timeLimits' in sc) && (sc.time_limits !== null)) {
      if ('min_time' in sc.time_limits) {
        this.setTimeLimitsMinTime(sc.time_limits.min_time)
      }
      if ('maxTime' in sc.time_limits) {
        this.setTimeLimitsMaxTime(sc.time_limits.max_time)
      }
      if ('allowLateSubmission' in sc.time_limits) {
        this.setTimeLimitsAllowLateSubmission(sc.time_limits.allow_late_submission)
      }
    }

    if (('validateResponses' in sc) && (sc.validate_responses !== null)) {
      this.setValidateResponses(sc.validate_responses)
    }
  }


  getSessionControl () {
    let sc = {
      allow_comment: this.getAllowComment(),
      allow_review: this.getAllowReview(),
      allow_skipping: this.getAllowSkipping(),
      max_attempts: this.getMaxAttempts(),
      show_feedback: this.getShowFeedback(),
      show_solution: this.getShowSolution(),
      time_limits: this.getTimeLimits(),
      validate_responses: this.getValidateResponses()
    }
    return sc
  }

  getAllowComment () {
    return this.sc.allow_comment
  }

  setAllowComment (allow_comment) {
    this.sc.allow_comment = allow_comment
  }

  getAllowReview () {
    return this.sc.allow_review
  }

  setAllowReview (allow_review) {
    this.sc.allow_review = allow_review
  }

  getAllowSkipping () {
    return this.sc.allow_skipping
  }

  setAllowSkipping (allow_skipping) {
    this.allow_skipping = allow_skipping
  }

  getMaxAttempts () {
    return this.sc.max_attempts
  }

  setMaxAttempts (max_attempts) {
    this.sc.max_attempts = max_attempts
  }

  getShowFeedback () {
    return this.sc.show_feedback
  }

  setShowFeedback (show_feedback) {
    this.sc.show_feedback = show_feedback
  }

  getShowSolution () {
    return this.sc.showSolution
  }

  setShowSolution (show_solution) {
    this.sc.show_solution = show_solution
  }

  getTimeLimits () {
    return this.sc.time_limits
  }

  /**
   * @description Set all timeLimits properties in one call.
   * @param min_time - non-negative double=null
   * @param max_time - non-negative double=null
   * @param allow_late_submission - boolean=false
   */
  setTimeLimits (min_time=null, max_time=null, allow_late_submission=false) {
    this.setTimeLimitsMinTime(min_time)
    this.setTimeLimitsMaxTime(max_time)
    this.setTimeLimitsAllowLateSubmission(allow_late_submission)
  }

  getTimeLimitsMinTime () {
    return this.sc.time_limits.min_time
  }

  setTimeLimitsMinTime (min_time) {
    this.sc.time_limits.min_time = min_time
  }

  getTimeLimitsMaxTime () {
    return this.sc.time_limits.max_time
  }

  setTimeLimitsMaxTime(max_time) {
    this.sc.time_limits.max_time = max_time
  }

  getTimeLimitsAllowLateSubmission () {
    return this.sc.time_limits.allow_late_submission
  }

  setTimeLimitsAllowLateSubmission(allow_late_submission) {
    this.sc.time_limits.allow_late_submission = allow_late_submission
  }

  getValidateResponses () {
    return this.sc.validate_responses
  }

  setValidateResponses (validate_responses) {
    this.sc.validate_responses = validate_responses
  }

}
