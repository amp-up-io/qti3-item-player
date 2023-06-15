import ExtendedTextPlainDefault from '@/components/qti/interactions/standard/ExtendedTextPlainDefault'
import ExtendedTextPlainLrn from '@/components/qti/interactions/standard/ExtendedTextPlainLrn'
import ExtendedTextPlainVerticalRl from '@/components/qti/interactions/standard/ExtendedTextPlainVerticalRl'
import ExtendedTextXhtmlDefault from '@/components/qti/interactions/standard/ExtendedTextXhtmlDefault'

const EXTENDED_TEXT_TYPE = {
  DEFAULT: 'default-plain',
  DEFAULT_SBAC: 'sbac-plain',
  DEFAULT_LRN: 'lrn-plain',
  DEFAULT_VERTICAL_RL: 'vertical-rl-plain',
  XHTML_DEFAULT: 'default-xhtml',
  XHTML_SBAC: 'sbac-xhtml',
  XHTML_VERTICAL_RL: 'vertical-rl-xhtml'
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
    case EXTENDED_TEXT_TYPE.DEFAULT_LRN:
      return {
        template: `<extended-text-plain-lrn ` +
          `response-identifier="` + props.responseIdentifier + `" ` +
          getExpectedLength(props) +
          getPatternMask(props) +
          getPatternMaskMessage(props) +
          getPlaceholderText(props) +
          getHeightClass(props) +
          getCounterStyle(props) +
          getPassthroughAttrs(attrs) + ` />`,
        components: { ExtendedTextPlainLrn }
      }
    case EXTENDED_TEXT_TYPE.DEFAULT_VERTICAL_RL:
      return {
        template: `<extended-text-plain-vertical-rl ` +
          `response-identifier="` + props.responseIdentifier + `" ` +
          getExpectedLength(props) +
          getPatternMask(props) +
          getPatternMaskMessage(props) +
          getPlaceholderText(props) +
          getHeightClass(props) +
          getCounterStyle(props) +
          getPassthroughAttrs(attrs) + ` />`,
        components: { ExtendedTextPlainVerticalRl }
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
  if (sbac && format === 'plain') return EXTENDED_TEXT_TYPE.DEFAULT_SBAC
  if (sbac && format === 'xhtml') return EXTENDED_TEXT_TYPE.XHTML_DEFAULT

  const lrn = isLrnInClass(clazz)
  if (lrn && format === 'plain') return EXTENDED_TEXT_TYPE.DEFAULT_LRN

  const verticalRL = isVerticalRightLeftInClass(clazz)
  if (verticalRL && format === 'plain') return EXTENDED_TEXT_TYPE.DEFAULT_VERTICAL_RL
  if (verticalRL && format === 'xhtml') return EXTENDED_TEXT_TYPE.XHTML_VERTICAL_RL

  if (format === 'plain') return EXTENDED_TEXT_TYPE.DEFAULT
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

  return findClass('sbac', clazz)
}

/**
 * @description Utility method to sniff for lrn in the class attribute.
 */
function isLrnInClass (clazz) {
  if ((typeof clazz === 'undefined') || (clazz === null) || (clazz.length == 0)) {
    return false
  }

  return findClass('lrn', clazz)
}

/**
 * @description Utility method to sniff for vertical-right-left in the class attribute.
 */
function isVerticalRightLeftInClass (clazz) {
  if ((typeof clazz === 'undefined') || (clazz === null) || (clazz.length == 0)) {
    return false
  }

  return findClass('qti-writing-orientation-vertical-rl', clazz)
}

function findClass (needle, clazz) {
  const clazzTokens = clazz.split(' ')
  for (let index = 0; index < clazzTokens.length; index++) {
    if (clazzTokens[index] === needle) return true
  }

  return false
}
