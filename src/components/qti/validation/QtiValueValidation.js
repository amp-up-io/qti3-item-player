import QtiParseException from '@/components/qti/exceptions/QtiParseException'

/**
 * @description Qti Value Validation class
 *
 */
export default class QtiValueValidation {

  /**
   * @constructor QtiValueValidation
   */
  constructor () {
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
      throw new QtiParseException('Invalid integer "' + value + '". ' + err.message)
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
      throw new QtiParseException('Invalid float "' + value + '". ' + err.message);
    }
  }

  BooleanValue (value) {
    if (value != null) {
      value = value.trim()
    }

    if (value == null || value.length == 0) {
      throw new QtiParseException('Invalid boolean "' + value + '". Length is not valid.')
    }

    if (value.toLowerCase() === 'true' || value === '1') {
      return true
    } else if (value.toLowerCase() === 'false' || value === '0') {
      return false
    } else {
      throw new QtiParseException('Invalid boolean "' + value + '".')
    }
  }

  StringValue (value) {
    if (value == null || value.length == 0) {
      throw new QtiParseException('Invalid string "' + value + '". Length is not valid.')
    }

    return value
  }

  /**
   * Identifier starts with letter or underscore(_) and contains only letters, underscores(_), digits,
   * hyphens(-) and periods(.)
   *
   * Smarter Balanced is an exception and not handled here.  Lots of odd characters and leading digit is permitted for SBAC.
   */
  IdentifierValue (value) {
    if (value != null) {
      value = value.trim()
    }

    if (value == null || value.length == 0) {
      throw new QtiParseException('Invalid identifier "' + value + '". Length is not valid.')
    }

    // First character.
    if (!this.isCharacterALetter(value.charAt(0)) && !this.isCharacterADigit(value.charAt(0)) && !(value.charAt(0) === '_')) {
      throw new QtiParseException('Invalid identifier "' + value + '". First character "' + value.charAt(0) + '" is not valid.')
    }

    // Rest of characters.
    for (let i = 1; i < value.length; i++) {
      if (!this.isCharacterALetterOrDigit(value.charAt(i)) && !(value.charAt(i) === '_') && !(value.charAt(i) === '-') && !(value.charAt(i) === '.')) {
        throw new QtiParseException('Invalid identifier "' + value + '". Character "' + value.charAt(i) + '" at position ' + (i + 1) + ' is not valid.')
      }
    }

    return value
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
}
