import TextEntryPlainDefault from '@/components/qti/interactions/standard/TextEntryPlainDefault'
import TextEntryPlainDefaultVertical from '@/components/qti/interactions/standard/TextEntryPlainDefaultVertical'

const TEXT_ENTRY_TYPE = {
  DEFAULT: 'default-plain-horizontal',
  DEFAULT_VERTICAL: 'default-plain-vertical'
}

export function textEntryInteractionAdapter(interactionSubType, props, attrs) {
  // Produce the Template for the text entry interaction
  switch (interactionSubType) {
    case TEXT_ENTRY_TYPE.DEFAULT:
      return {
        template: `<text-entry-plain-default ` +
          `response-identifier="` + props.responseIdentifier + `" ` +
          getExpectedLength(props) +
          getPatternMask(props) +
          getPatternMaskMessage(props) +
          getPlaceholderText(props) +
          getFormat(props) +
          getSpellcheck(props) + 
          getMaxlength(props) + 
          getPassthroughAttrs(attrs) + ` />`,
        components: { TextEntryPlainDefault }
      }
    case TEXT_ENTRY_TYPE.DEFAULT_VERTICAL:
      return {
        template: `<text-entry-plain-default-vertical ` +
          `response-identifier="` + props.responseIdentifier + `" ` +
          getExpectedLength(props) +
          getPatternMask(props) +
          getPatternMaskMessage(props) +
          getPlaceholderText(props) +
          getFormat(props) +
          getSpellcheck(props) +
          getWidthClass(props) +
          getVerticalMaxlength(props) +
          getPassthroughAttrs(attrs) + ` />`,
        components: { TextEntryPlainDefaultVertical }
      }
    default:
      return {
        template: `<text-entry-plain-default ` +
          `response-identifier="` + props.responseIdentifier + `" ` +
          getExpectedLength(props) +
          getPatternMask(props) +
          getPatternMaskMessage(props) +
          getPlaceholderText(props) +
          getFormat(props) +
          getSpellcheck(props) + 
          getMaxlength(props) + 
          getPassthroughAttrs(attrs) + ` />`,
        components: { TextEntryPlainDefault }
      }
  }
}

export function getTextEntryInteractionSubType(clazz) {
  if (isOrientationVertical(clazz)) return TEXT_ENTRY_TYPE.DEFAULT_VERTICAL
  return TEXT_ENTRY_TYPE.DEFAULT
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

function getFormat (props) {
  if (typeof props.format === 'undefined') return ''
  if (props.format.length == 0) return ''
  return `format="` + props.format + `" `
}

function getSpellcheck (props) {
  if (typeof props.spellcheck === 'undefined') return ''
  return `spellcheck="` + props.spellcheck + `" `
}

function getMaxlength (props) {
  if (typeof props.maxlength === 'undefined') return ''
  return `maxlength="` + props.maxlength + `" `
}

function getWidthClass (props) {
  if (typeof props.widthClass === 'undefined') return ''
  return `width-class="` + props.widthClass + `" `
}

function getVerticalMaxlength (props) {
  if (typeof props.verticalMaxlength === 'undefined') return ''
  return `maxlength="` + props.verticalMaxlength + `" `
}

function getPassthroughAttrs (attrs) {
  let result = ''
  for (const [key, value] of Object.entries(attrs)) {
    result += `${key}="${value}" `
  }
  return result
}

/**
 * @description Utility method to sniff for qti-orientation-vertical in the class attribute.
 */
function isOrientationVertical (clazz) {
  if ((typeof clazz === 'undefined') || (clazz === null) || (clazz.length == 0)) {
    return false
  }

  return findClass('qti-orientation-vertical', clazz)
}

function findClass (needle, clazz) {
  const clazzTokens = clazz.split(' ')
  for (let index = 0; index < clazzTokens.length; index++) {
    if (clazzTokens[index] === needle) return true
  }

  return false
}
