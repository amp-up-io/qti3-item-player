import ExtendedTextPlainDefault from '@/components/qti/interactions/standard/ExtendedTextPlainDefault'
import ExtendedTextXhtmlDefault from '@/components/qti/interactions/standard/ExtendedTextXhtmlDefault'

const EXTENDED_TEXT_TYPE = {
  DEFAULT: 'default-plain',
  DEFAULT_SBAC: 'sbac-plain',
  XHTML_DEFAULT: 'default-xhtml',
  XHTML_SBAC: 'sbac-xhtml'
}

export function extendedTextInteractionAdapter(interactionSubType, props, attrs) {
  // Produce the Template for the extended text interaction
  switch (interactionSubType) {
    case EXTENDED_TEXT_TYPE.XHTML_DEFAULT:
    case EXTENDED_TEXT_TYPE.XHTML_SBAC:
      return {
        template: `<extended-text-xhtml-default ` +
          `response-identifier="` + props.responseIdentifier + `" ` +
          getExpectedLength(props) +
          getPatternMask(props) +
          getPatternMaskMessage(props) +
          getPlaceholderText(props) +
          getHeightClass(props) +
          getCounterStyle(props) +
          getPassthroughAttrs(attrs) + ` />`,
        components: { ExtendedTextXhtmlDefault }
      }
    default:
      return {
        template: `<extended-text-plain-default ` +
          `response-identifier="` + props.responseIdentifier + `" ` +
          getExpectedLength(props) +
          getPatternMask(props) +
          getPatternMaskMessage(props) +
          getPlaceholderText(props) +
          getHeightClass(props) +
          getCounterStyle(props) +
          getPassthroughAttrs(attrs) + ` />`,
        components: { ExtendedTextPlainDefault }
      }
  }
}

export function getExtendedTextInteractionSubType(clazz, format) {
  const sbac = isSbacInClass(clazz)

  if (format === 'plain' && sbac) return EXTENDED_TEXT_TYPE.DEFAULT_SBAC
  if (format === 'plain') return EXTENDED_TEXT_TYPE.DEFAULT
  if (format === 'xhtml' && sbac) return EXTENDED_TEXT_TYPE.XHTML_DEFAULT
  if (format === 'xhtml') return EXTENDED_TEXT_TYPE.XHTML_DEFAULT
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

function getExpectedLength (props) {
  if (typeof props.expectedLength === 'undefined') return ''
  return `expected-length="` + props.expectedLength + `" `
}

function getHeightClass (props) {
  if (typeof props.heightClass === 'undefined') return ''
  return `height-class="` + props.heightClass + `" `
}

function getCounterStyle (props) {
  if (typeof props.counterStyle === 'undefined') return 'none'
  return `counter-style="` + props.counterStyle + `" `
}

function getPassthroughAttrs (attrs) {
  let result = ''
  for (const [key, value] of Object.entries(attrs)) {
    result += `${key}="${value}" `
  }
  return result
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
