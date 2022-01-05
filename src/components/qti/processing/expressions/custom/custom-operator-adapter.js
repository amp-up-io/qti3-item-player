import MathStringToFloat from './Math_StringToFloat'

const CUSTOM_OPERATORS = {
  MATH_STRINGTOFLOAT: 'math.stringToFloat',
  AMP_MATH_STRINGTOFLOAT: 'amp:math.stringToFloat',
  AMP_EE_ISEQUIVALENT: 'amp:ee.isEquivalent'
}

export function customOperatorAdapter(operator, props) {
  // Produce the Template for operator
  switch (operator) {
    case CUSTOM_OPERATORS.MATH_STRINGTOFLOAT:
    case CUSTOM_OPERATORS.AMP_MATH_STRINGTOFLOAT:
      return {
        template: `<MathStringToFloat><slot/></MathStringToFloat>`,
        components: { MathStringToFloat }
      }
    case CUSTOM_OPERATORS.AMP_EE_ISEQUIVALENT:
      return {
        template: `<MathEeIsEquivalent ` +
            `definition="` + props.definition + `">` +
            `<slot></slot>` +
          `</MathEeIsEquivalent>`,
        components: { /* MathEeIsEquivalent */ }
      }
    default:
      return undefined
  }
}

export function getCustomOperatorSubType(clazz) {
  if ((clazz === null) || clazz.length == 0) return null

  // Return the first supported operator we find.
  const clazzTokens = clazz.split(' ')
  for (let index = 0; index < clazzTokens.length; index++) {
    switch (clazzTokens[index]) {
      case CUSTOM_OPERATORS.MATH_STRINGTOFLOAT:
      case CUSTOM_OPERATORS.AMP_MATH_STRINGTOFLOAT:
        return clazzTokens[index]
      default:
    }
  }
  return null
}
