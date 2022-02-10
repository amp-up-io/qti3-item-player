import EndAttemptDefault from '@/components/qti/interactions/custom/EndAttemptDefault'
import EndAttemptControllerBar from '@/components/qti/interactions/custom/EndAttemptControllerBar'

const END_ATTEMPT_TYPE = {
  DEFAULT: '',
  ENDATTEMPT_CONTROLLER_BAR: 'endattempt-controller-bar'
}

export function endAttemptInteractionAdapter(interaction, props) {
  // Produce the Template for the interaction
  switch (interaction) {
    case END_ATTEMPT_TYPE.ENDATTEMPT_CONTROLLER_BAR:
      return {
        template: `<end-attempt-controller-bar ` +
          `response-identifier="` + props.responseIdentifier + `" ` +
          `title="` + props.title + `" ` +
          `data-steps="` + props.dataSteps + `" ` +
          `data-hastemplates="` + props.dataHastemplates + `" ` +
          `data-controller-type="` + props.dataControllerType + `" ` +
          `data-hideprogress="` + props.dataHideprogress + `" ` +
          `/>`,
        components: { EndAttemptControllerBar }
      }
    default:
      return {
        template: `<end-attempt-default ` +
          `response-identifier="` + props.responseIdentifier + `" ` +
          `title="` + props.title + `"/>`,
        components: { EndAttemptDefault }
      }
  }
}

export function getEndAttemptInteractionSubType(clazz) {
  if ((typeof clazz === 'undefined') || (clazz === null) || (clazz.length == 0)) {
    return END_ATTEMPT_TYPE.DEFAULT
  }

  // Return the first supported subtype we find.
  const clazzTokens = clazz.split(' ')
  for (let index = 0; index < clazzTokens.length; index++) {
    switch (clazzTokens[index]) {
      case END_ATTEMPT_TYPE.ENDATTEMPT_CONTROLLER_BAR:
        return clazzTokens[index]
      default:
    }
  }

  return END_ATTEMPT_TYPE.DEFAULT
}
