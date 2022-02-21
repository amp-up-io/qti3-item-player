import ExtendedTextPlainDefault from '@/components/qti/interactions/custom/ExtendedTextPlainDefault'
//import ExtendedTextXhtmlDefault from '@/components/qti/interactions/custom/ExtendedTextXhtmlDefault'

const EXTENDED_TEXT_TYPE = {
  DEFAULT: 'default-plain',
  DEFAULT_SBAC: 'sbac-plain',
  XHTML_DEFAULT: 'default-xhtml',
  XHTML_SBAC: 'sbac-xhtml'
}

export function extendedTextInteractionAdapter(interactionSubType, props) {
  // Produce the Template for the extended text interaction
  switch (interactionSubType) {
    case EXTENDED_TEXT_TYPE.XHTML_DEFAULT:
    case EXTENDED_TEXT_TYPE.XHTML_SBAC:
      return {
        template: `<extended-text-plain-default ` +
          `response-identifier="` + props.responseIdentifier + `" ` +
          getPatternMask(props) +
          getPatternMaskMessage(props) +
          getPlaceholderText(props) + `/>`,
        components: { ExtendedTextPlainDefault }
      }
    default:
      return {
        template: `<extended-text-plain-default ` +
          `response-identifier="` + props.responseIdentifier + `" ` +
          getPatternMask(props) +
          getPatternMaskMessage(props) +
          getPlaceholderText(props) + `/>`,
        components: { ExtendedTextPlainDefault }
      }
  }
}

export function getExtendedTextInteractionSubType(clazz, format) {
  const sbac = isSbacInClass(clazz)

  if (format === 'plain' && sbac) return EXTENDED_TEXT_TYPE.DEFAULT_SBAC
  if (format === 'plain') return EXTENDED_TEXT_TYPE.DEFAULT
  if (format === 'xhtml' && sbac) return EXTENDED_TEXT_TYPE.XHTL_SBAC
  if (format === 'xhtml') return EXTENDED_TEXT_TYPE.XHTL_DEFAULT
  return EXTENDED_TEXT_TYPE.DEFAULT
}

function getPatternMask (props) {
  if (typeof props.patternMask === 'undefined') return ''
  return `pattern-mask="` + props.patternMask + `" `
}

function getPatternMaskMessage (props) {
  return `pattern-mask-message="` + props.patternMaskMessage + `" `
}

function getPlaceholderText (props) {
  return `placeholder="` + props.placeholder + `" `
}

/**
 * @description Utility method to sniff for sbac in the class attribute.
 */
function isSbacInClass (clazz) {
  if ((typeof clazz === 'undefined') || (clazz === null) || (clazz.length == 0)) {
    return false
  }

  const clazzTokens = clazz.split(' ')
  for (let index = 0; index < clazzTokens.length; index++) {
    if (clazzTokens[index] === 'sbac') return true
  }

  return false
}
