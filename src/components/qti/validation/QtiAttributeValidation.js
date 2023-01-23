import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiParseException from '@/components/qti/exceptions/QtiParseException'
import BigNumber from 'bignumber.js'

/**
 * @description Qti Attribute Validation class
 *
 */
export default class QtiAttributeValidation {

  QTI_BASE_TYPES () {
    return [
      'boolean',
      'directedPair',
      'duration',
      'file',
      'float',
      'identifier',
      'integer',
      'pair',
      'point',
      'string',
      'uri'
    ]
  }

  QTI_CARDINALITIES () {
    return [
      'single',
      'multiple',
      'ordered',
      'record'
    ]
  }

  QTI_MATH_OPERATORS () {
    return [
      'abs',
      'acos',
      'acot',
      'acsc',
      'asec',
      'asin',
      'atan',
      'atan2',
      'ceil',
      'cos',
      'cosh',
      'cot',
      'coth',
      'csc',
      'csch',
      'exp',
      'floor',
      'ln',
      'log',
      'sec',
      'sech',
      'signum',
      'sin',
      'sinh',
      'tan',
      'tanh',
      'toDegrees',
      'toRadians'
    ]
  }

  QTI_MATH_CONSTANTS () {
    return [
      'pi',
      'e'
    ]
  }

  QTI_STATS_OPERATORS () {
    return [
      'mean',
      'sampleVariance',
      'sampleSD',
      'popVariance',
      'popSD'
    ]
  }

  QTI_RUBRICBLOCK_VIEWS () {
    // enumerated vocabulary of view attribute
    return [
      'author',
      'candidate',
      'proctor',
      'scorer',
      'testConstructor',
      'tutor'
    ]
  }

  /**
   * @constructor QtiAttributeValidation
   */
  constructor () {
  }

  validateBaseType (baseType) {
    if (!this.QTI_BASE_TYPES().includes(baseType)) {
      throw new QtiValidationException('Invalid base-type: "' + baseType + '".')
    }
  }

  validateCardinality (cardinality) {
    if (!this.QTI_CARDINALITIES().includes(cardinality)) {
      throw new QtiValidationException('Invalid cardinality: "' + cardinality + '".')
    }
  }

  validateBaseTypeAndCardinality(baseType, isRecordCardinality) {
    if (isRecordCardinality && (typeof baseType !== 'undefined')) {
      // Specification is unclear.  If cardinality is record, can base-type be specified
      // even though it is ignored?  Or is it a validation error to specify a base-type
      // when cardinality=record?
      throw new QtiValidationException('base-type not permitted for "record" cardinality.')
    } else if (!isRecordCardinality && (typeof baseType === 'undefined')) {
      throw new QtiValidationException('base-type is a required attribute.')
    } else if (!isRecordCardinality && (typeof baseType !== 'undefined')) {
      this.validateBaseType(baseType)
    }
  }

  validateFieldIdentifierAndCardinality(fieldIdentifier, isRecordCardinality) {
    if (isRecordCardinality && (typeof fieldIdentifier === 'undefined')) {
      throw new QtiValidationException('field-identifier is required for record cardinality.')
    } else if (!isRecordCardinality && (typeof fieldIdentifier !== 'undefined')) {
      throw new QtiValidationException('field-identifier only permitted for record cardinality.')
    }
  }

  validatePositiveIntegerAttribute(attributeName, attributeValue, isRequired) {
    let pattern = /^\d+$/
    let value

    if (typeof attributeValue === 'undefined') {
      if (isRequired) {
        throw new QtiValidationException('attribute: ' + attributeName + ' is a required attribute')
      } else {
        return
      }
    }

    if (pattern.test(attributeValue)) {
      value = this.IntegerValue(attributeValue)
    } else {
      throw new QtiParseException('Invalid ' + attributeName + ' attribute "' + attributeValue + '"')
    }

    if (value < 0) {
      throw new QtiValidationException('Invalid ' + attributeName + ' attribute.  Must be greater than or equal to 0')
    }

    return value
  }

  validateIntegerAttribute(attributeName, attributeValue, isRequired, defaultValue) {
    let pattern = /^-?\d+$/
    let value

    if (typeof attributeValue === 'undefined') {
      if (isRequired) {
        throw new QtiValidationException('attribute: ' + attributeName + ' is a required attribute')
      } else {
        return defaultValue
      }
    }

    if (pattern.test(attributeValue)) {
      value = this.IntegerValue(attributeValue)
    } else {
      throw new QtiParseException('Invalid ' + attributeName + ' attribute "' + attributeValue + '"')
    }

    return value
  }

  /**
   * @description Identifier starts with letter or underscore(_) and contains only letters, underscores(_), digits,
   * hyphens(-) and periods(.)
   *
   * Smarter Balanced is an exception and not handled here.  Lots of odd characters and leading digit is permitted for SBAC.
   */
  validateIdentifierAttribute (identifier) {
    if (identifier != null) {
      if (identifier.length != identifier.trim().length) {
        throw new QtiValidationException('Invalid identifier "' + identifier + '". Whitespace not permitted.')
      }
    }

    if (identifier == null || identifier.length == 0) {
      throw new QtiValidationException('Invalid identifier "' + identifier + '". Length is not valid.')
    }

    // First character.
    if (!this.isCharacterALetter(identifier.charAt(0)) && !this.isCharacterADigit(identifier.charAt(0)) && !(identifier.charAt(0) === '_')) {
      throw new QtiValidationException('Invalid identifier "' + identifier + '". First character "' + identifier.charAt(0) + '" is not valid.')
    }

    // Rest of characters.
    for (let i = 1; i < identifier.length; i++) {
      if (!this.isCharacterALetterOrDigit(identifier.charAt(i)) && !(identifier.charAt(i) === '_') && !(identifier.charAt(i) === '-') && !(identifier.charAt(i) === '.')) {
        throw new QtiValidationException('Invalid identifier "' + identifier + '". Character "' + identifier.charAt(i) + '" at position ' + (i + 1) + ' is not valid.')
      }
    }
  }

  validateFloatAttribute(attributeName, attributeValue, isRequired, defaultValue) {
    let pattern = /^[-+]?([0-9]*\.[0-9]+|[0-9]+)$/
    let value

    if (typeof attributeValue === 'undefined') {
      if (isRequired) {
        throw new QtiValidationException('attribute: ' + attributeName + ' is a required attribute')
      } else {
        return defaultValue
      }
    }

    if (pattern.test(attributeValue)) {
      value = this.FloatValue(attributeValue)
    } else {
      throw new QtiParseException('Invalid ' + attributeName + ' attribute "' + attributeValue + '"')
    }

    return value
  }

  validateResponseIdentifierAttribute (store, responseIdentifier) {
    this.validateIdentifierAttribute(responseIdentifier)
    let responseDeclaration = store.getResponseDeclaration(responseIdentifier)
    if (typeof responseDeclaration === 'undefined') {
      throw new QtiValidationException('No response declaration found for response-identifier: "' + responseIdentifier + '"')
    }
    return responseDeclaration
  }

  validateOutcomeIdentifierAttribute (store, outcomeIdentifier) {
    this.validateIdentifierAttribute(outcomeIdentifier)
    let outcomeDeclaration = store.getOutcomeDeclaration(outcomeIdentifier)
    if (typeof outcomeDeclaration === 'undefined') {
      throw new QtiValidationException('No outcome declaration found for identifier: "' + outcomeIdentifier + '"')
    }
    return outcomeDeclaration
  }

  validateTemplateIdentifierAttribute (store, templateIdentifier) {
    this.validateIdentifierAttribute(templateIdentifier)
    let templateDeclaration = store.getTemplateDeclaration(templateIdentifier)
    if (typeof templateDeclaration === 'undefined') {
      throw new QtiValidationException('No template declaration found for identifier: "' + templateIdentifier + '"')
    }
    return templateDeclaration
  }

  validateVariableIdentifierAttribute (store, variableIdentifier) {
    this.validateIdentifierAttribute(variableIdentifier)
    let declaration = store.getOutcomeDeclaration(variableIdentifier)
    if (typeof declaration !== 'undefined') {
      return declaration
    }
    declaration = store.getResponseDeclaration(variableIdentifier)
    if (typeof declaration !== 'undefined') {
      return declaration
    }
    declaration = store.getContextDeclaration(variableIdentifier)
    if (typeof declaration !== 'undefined') {
      return declaration
    }
    declaration = store.getTemplateDeclaration(variableIdentifier)
    if (typeof declaration !== 'undefined') {
      return declaration
    }
    throw new QtiValidationException('No declaration found for identifier: "' + variableIdentifier + '"')
  }

  validatePrintedVariableIdentifierAttribute (store, variableIdentifier) {
    if (typeof variableIdentifier === 'undefined') {
      throw new QtiValidationException('Attribute "identifier" is undefined')
    }
    this.validateIdentifierAttribute(variableIdentifier)
    let declaration = store.getOutcomeDeclaration(variableIdentifier)
    if (typeof declaration !== 'undefined') {
      return declaration
    }
    declaration = store.getTemplateDeclaration(variableIdentifier)
    if (typeof declaration !== 'undefined') {
      return declaration
    }
    declaration = store.getContextDeclaration(variableIdentifier)
    if (typeof declaration !== 'undefined') {
      return declaration
    }
    throw new QtiValidationException('No declaration found for identifier: "' + variableIdentifier + '"')
  }

  validateMaxMinChoices (maxChoices, minChoices) {
    let maxChoicesValue = this.validatePositiveIntegerAttribute('max-choices', maxChoices)
    let minChoicesValue = this.validatePositiveIntegerAttribute('min-choices', minChoices)
    if ((maxChoicesValue > 0) && (minChoicesValue > maxChoicesValue)) {
      throw new QtiValidationException('Invalid min-choices attribute "' + minChoices + '". Must be less than or equal to max-choices attribute when max-choices attribute is greater than 0')
    }
  }

  validatePattern (attributeName, pattern) {
    if (typeof pattern === 'undefined') {
      return null
    }

    if ((pattern == null) || (pattern.length == 0)) {
      throw new QtiParseException('Invalid ' + attributeName + ' "' + pattern + '". Length is not valid.')
    }

    let mask = pattern.trim()

    if (mask.length == 0) {
      throw new QtiParseException('Invalid ' + attributeName + ' "' + pattern + '".')
    }

    // Strip off any begin line and end line chars as this is an XML Regex expression.
    // XML regex means the begin/end line chars are not good.
    mask = mask.startsWith('^') ? mask.substring(1) : mask
    mask = mask.endsWith('$') ? mask.substring(0, mask.length-1) : mask
    // XMLSchema REGEX specifies the "/" as a normal character, unlike Javascript "/" which is a pattern delimiter.
    // Consequently, we need to escape the forward slash "/" chars.
    mask = mask.replaceAll('/', '\\/')
    // Replace one backslash with two backslashes.
    //mask = mask.replaceAll('\\', '\\\\')

    try {
      return new RegExp('^' + mask + '$')
    } catch (err) {
      throw new QtiParseException('Unable to parse ' + attributeName + ': "' + pattern + '""')
    }
  }

  validatePlaceholderText (message, localePlaceholderMessage) {
    return (typeof message !== 'undefined') ? message : localePlaceholderMessage
  }

  validatePatternmaskMessage (message, localePatternMaskMessage) {
    return (typeof message !== 'undefined') ? message : localePatternMaskMessage
  }

  validateCaseSensitive (attributeValue, isRequired) {
    if (typeof attributeValue === 'undefined') {
      if (isRequired) {
        throw new QtiValidationException('Attribute "case-sensitive" is a required attribute')
      } else {
        // Default to false when not specified
        return false
      }
    }

    if ((attributeValue === 'true') || (attributeValue === "1")) {
      return true
    }
    if ((attributeValue === 'false') || (attributeValue === "0" )) {
      return false
    }
    throw new QtiValidationException('Invalid case-sensitive attribute.  Must be a Boolean value.')
  }

  validateIncludeBoundary(attributeValue, attributeName) {
    if (typeof attributeValue === 'undefined') {
      // Default to true when not specified
      return true
    }

    if ((attributeValue === 'true') || (attributeValue === "1")) {
      return true
    }
    if ((attributeValue === 'false') || (attributeValue === "0" )) {
      return false
    }
    throw new QtiValidationException('Invalid ' + attributeName + ' attribute.  Must be a Boolean value.')
  }

  validateValueFromBaseType (baseType, attributeValue) {
    let value = null
    try {
      // Handle five baseTypes for now.
      switch (baseType) {
        case 'string':
          if (attributeValue === null || attributeValue.length === 0) {
            throw new QtiParseException('Null string "' + attributeValue + '".')
          }
          value = attributeValue
          break

        case 'identifier':
          // this validation method does not return a value
          this.validateIdentifierAttribute(attributeValue)
          value = attributeValue
          break

        case 'integer':
          value = this.IntegerValue(attributeValue)
          break

        case 'float':
          value = this.FloatValue(attributeValue)
          break

        case 'duration':
          value = this.DurationValue(attributeValue)
          break

        default:
          throw new QtiParseException('[Unhandled Attribute Value BaseType]: "' + baseType + '"')
      }
    } catch (err) {
      if (err.name === 'QtiValidationException') {
        throw new QtiValidationException(err.message)
      } else if (err.name === 'QtiParseException') {
        throw new QtiParseException(err.message)
      }
    }
    return value
  }

  validateShowHideAttribute (attributeValue) {
    if (typeof attributeValue === 'undefined') {
      return true
    }

    if (attributeValue === 'show') {
      return true
    }
    if (attributeValue === 'hide') {
      return false
    }
    throw new QtiValidationException('Invalid show-hide attribute: "' + attributeValue + '"  Value must be "show" or "hide".')
  }

  validateShapeAttribute (attributeValue) {
    if (typeof attributeValue === 'undefined') {
      return ''
    }
    
    if (attributeValue === 'circle') {
      return 'circle'
    }
    if (attributeValue === 'rect') {
      return 'rect'
    }
    if (attributeValue === 'poly') {
      return 'poly'
    }
    if (attributeValue === 'default') {
      return 'default'
    }
    if (attributeValue === 'ellipse') {
      return 'ellipse'
    }
    throw new QtiValidationException('Invalid shape attribute: "' + attributeValue + '"  Value must be "circle", "rect", "poly", "default", or "ellipse".')
  }

  validateToleranceModeAttribute (attributeValue) {
    if (typeof attributeValue === 'undefined') {
      return true
    }

    if (attributeValue === 'exact') {
      return 'exact'
    }
    if (attributeValue === 'absolute') {
      return 'absoluate'
    }
    if (attributeValue === 'relative') {
      return 'relative'
    }
    throw new QtiValidationException('Invalid tolerance-mode attribute: "' + attributeValue + '"  Value must be "exact", "absolute", or "relative".')
  }

  validateRoundingModeAttribute (attributeValue) {
    if (typeof attributeValue === 'undefined') {
      return true
    }

    if (attributeValue === 'decimalPlaces') {
      return 'decimalPlaces'
    }
    if (attributeValue === 'significantFigures') {
      return 'significantFigures'
    }
    throw new QtiValidationException('Invalid rounding-mode attribute: "' + attributeValue + '"  Value must be "decimalPlaces" or "significantFigures".')
  }

  validateMathOperatorNameAttribute (name) {
    if (this.QTI_MATH_OPERATORS().includes(name)) {
      return true
    }
    throw new QtiValidationException('Unsupported qti-math-operator "name" attribute: "' + name + '".')
  }

  validateMathConstantNameAttribute (name) {
    if (this.QTI_MATH_CONSTANTS().includes(name)) {
      return true
    }
    throw new QtiValidationException('Unsupported qti-math-constant "name" attribute: "' + name + '".')
  }

  validateStatsOperatorNameAttribute (name) {
    if (this.QTI_STATS_OPERATORS().includes(name)) {
      return true
    }
    throw new QtiValidationException('Unsupported qti-stats-operator "name" attribute: "' + name + '".')
  }

  /**
   * @description Parse and validate the tolerance attribute found on qti-equal.
   * Examples:  tolerance="0.1"  tolerance="0.1 0.2"
   * @param - tolerance attribute value
   * @return - array with two elements: a lower and upper tolerance
   */
  validateToleranceAttribute (tolerance) {
    if ((tolerance === null) || (tolerance.length === 0)) {
      return []
    }

    const t = tolerance.split(' ')
    if (t.length === 0) {
      throw new QtiValidationException('Unable to parse tolerance attribute: "' + tolerance + '"')
    } else if (t.length < 3) {
      // tolerance contains one or two values
      try {
        if (t.length === 1) {
          // tolerance value is used for lower and upper bound
          const value = new BigNumber(this.FloatValue(t[0]))
          if (value.comparedTo(new BigNumber(0)) < 0) {
            throw new QtiValidationException('Tolerance attribute: "' + value.valueOf() + '" cannot be negative.')
          }
          return [ value, value ]
        } else if (t.length === 2) {
          // tolerance contains distinct lower and upper bound values
          const value1 = new BigNumber(this.FloatValue(t[0]))
          if (value1.comparedTo(new BigNumber(0)) < 0) {
            throw new QtiValidationException('Tolerance attribute: "' + value1.valueOf() + '" cannot be negative.')
          }
          const value2 = new BigNumber(this.FloatValue(t[1]))
          if (value2.comparedTo(new BigNumber(0)) < 0) {
            throw new QtiValidationException('Tolerance attribute: "' + value2.valueOf() + '" cannot be negative.')
          }
          return [ value1, value2 ]
        }
      } catch (err) {
        if (err.name === 'QtiValidationException') {
          throw new QtiValidationException(err.message)
        } else if (err.name === 'QtiParseException') {
          throw new QtiParseException(err.message)
        }
      }

    } else if (t.length >= 3) {
      throw new QtiValidationException('Invalid tolerance attribute: "' + tolerance + '".  Value must contain 1 or 2 tolerances.')
    }
  }

  validateRubricBlockViewAttribute (view) {
    if (!this.QTI_RUBRICBLOCK_VIEWS().includes(view)) {
      throw new QtiValidationException('Invalid view attribute: "' + view + '".')
    }
  }

  parseXmlLangAttribute (xmlLangAttribute) {
    if (typeof xmlLangAttribute === 'undefined') return null
    return xmlLangAttribute
  }

  isCharacterALetter (char) {
    return (/[a-zA-Z]/).test(char)
  }

  isCharacterADigit (char) {
    return /\d/.test(char)
  }

  isCharacterALetterOrDigit (char) {
    return this.isCharacterALetter(char) || this.isCharacterADigit(char)
  }

  IntegerValue (value) {
    if (value != null)  {
      value = value.trim()
    }

    if (value == null || value.length == 0) {
      throw new QtiParseException('Invalid integer "' + value + '". Length is not valid.')
    }

    try {
      let intValue = parseInt(value, 10)
      if (Number.isNaN(intValue)) {
        throw new QtiParseException('Invalid integer "' + value + '". ')
      } else {
        return intValue
      }
    } catch (err) {
      throw new QtiParseException(err.message)
    }
  }

  FloatValue (value) {
    if (value != null)  {
      value = value.trim()
    }

    if (value == null || value.length == 0) {
      throw new QtiParseException('Invalid float "' + value + '". Length is not valid.')
    }

    try {
      let floatValue = parseFloat(value)
      if (Number.isNaN(floatValue)) {
        throw new QtiParseException('Invalid float "' + value + '". ')
      } else {
        return floatValue
      }
    } catch (err) {
      throw new QtiParseException(err.message)
    }
  }

  DurationValue (value) {
    try {
			let result = new BigNumber(value)
			if (result.isZero() && result.isNegative()) {
				result = new BigNumber(0)
			}

      if (result.comparedTo(0) < 0) {
        throw new QtiParseException('Invalid duration "' + result + '". Duration cannot be negative.')
      }

      return result.toNumber()
    } catch (err) {
      throw new QtiParseException(err.message)
    }
  }

  /**
   * @description Pseudo-random string generator
   * http://stackoverflow.com/a/27872144/383904
   * Default: return a random alpha-numeric string
   *
   * @param {Integer} len Desired length
   * @param {String} an Optional (alphanumeric), "a" (alpha), "n" (numeric)
   * @return {String}
   */
  randomString (len, an) {
    an = an && an.toLowerCase()
    let str = ''
    const min = an == 'a' ? 10 : 0
    const max = an == 'n' ? 10 : 62
    for (let i=0; i < len; i++) {
      let r = Math.random() * (max - min) + min << 0
      str += String.fromCharCode(r += r > 9 ? r < 36 ? 55 : 61 : 48)
    }
    return str
  }

  /**
   * @description Utility method to detect malformed xhtml or
   * or unregistered components.
   */
  isValidSlot (slot) {
    if (typeof slot.componentOptions !== 'undefined') return true

    // Check if text is something not empty
    if ((typeof slot.text !== 'undefined') && (slot.text.trim().length > 0)) {
      // Not an empty text slot.  this is an error.
      throw new QtiValidationException('Invalid Child Node: "' + slot.text.trim() + '"')
    }
    
    // Empty text slot.  Not a component, but not an error
    return false
  }

}
