import BigNumber from 'bignumber.js'

/**
 * @description Qti Processing class
 *
 */
export default class QtiProcessing {

  QTI_RESPONSE_RULES () {
    return [
      'qti-response-processing-fragment',
      'qti-response-condition',
      'qti-set-outcome-value',
      'qti-lookup-outcome-value',
      'qti-get-outcome-value',
      'qti-exit-response'
      // TODO: handle include
    ]
  }

  QTI_TEMPLATE_RULES () {
    return [
      'qti-set-template-value',
      'qti-exit-template',
      'qti-template-condition',
      'qti-set-default-value',
      'qti-set-correct-response',
      'qti-template-constraint'
    ]
  }

  QTI_EXPRESSIONS () {
    return [
      'qti-base-value',
      'qti-variable',
      'qti-correct',
      'qti-default',
      'qti-is-null',
      'qti-null',
      'qti-and',
      'qti-or',
      'qti-not',
      'qti-match',
      'qti-map-response',
      'qti-member',
      'qti-subtract',
      'qti-sum',
      'qti-random',
      'qti-random-float',
      'qti-random-integer',
      'qti-index',
      'qti-integer-divide',
      'qti-integer-modulus',
      'qti-integer-to-float',
      'qti-equal',
      'qti-equal-rounded',
      'qti-field-value',
      'qti-multiple',
      'qti-ordered',
      'qti-map-response-point',
      'qti-product',
      'qti-delete',
      'qti-string-match',
      'qti-pattern-match',
      'qti-substring',
      'qti-round',
      'qti-round-to',
      'qti-truncate',
      'qti-divide',
      'qti-gt',
      'qti-gte',
      'qti-lt',
      'qti-lte',
      'qti-max',
      'qti-min',
      'qti-custom-operator',
      'qti-math-operator',
      'qti-math-constant',
      'qti-repeat',
      'qti-gcd',
      'qti-lcm',
      'qti-stats-operator',
      'qti-power',
      'qti-any-n'
    ]
  }

  /**
   * @constructor QtiProcessing
   */
  constructor () {
  }

  isExpressionNode (nodeName) {
    return (this.QTI_EXPRESSIONS().includes(nodeName))
  }

  isResponseRuleNode (nodeName) {
    return (this.QTI_RESPONSE_RULES().includes(nodeName))
  }

  isTemplateRuleNode (nodeName) {
    return (this.QTI_TEMPLATE_RULES().includes(nodeName))
  }

  nullValue () {
    return null
  }

  isNullValue (v) {
    return ((typeof v === 'undefined') || (v === null))
  }

  isBaseTypeNumeric (baseType) {
    return ((baseType === 'float') || (baseType === 'integer'))
  }

  isSingleValuesMatch (baseType, firstValue, secondValue) {
    if (this.isBaseTypeNumeric(baseType)) {
      let firstNumber = new BigNumber(firstValue)
      let secondNumber = new BigNumber(secondValue)
      return (firstNumber.comparedTo(secondNumber) == 0)
    }
    return (firstValue === secondValue)
  }

  isMultipleValuesMatch (baseType, firstValue, secondValue) {
    // derived from stackoverflow issue: https://stackoverflow.com/questions/6229197/how-to-know-if-two-arrays-have-the-same-values
    if (!Array.isArray(firstValue) || !Array.isArray(secondValue) || firstValue.length !== secondValue.length) {
      return false
    }

    // .concat() to not mutate arguments
    const arr1 = firstValue.concat().sort()
    const arr2 = secondValue.concat().sort()

    if (!this.isBaseTypeNumeric(baseType)) {
      for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) {
          return false
        }
      }
    } else {
      // numeric ... so we need to be more precise
      for (let i = 0; i < arr1.length; i++) {
        if (!this.isSingleValuesMatch(baseType, arr1[i], arr2[i])) {
          return false
        }
      }
    }
    return true
  }

  isOrderedValuesMatch (baseType, arr1, arr2) {
    // derived from stackoverflow issue: https://stackoverflow.com/questions/6229197/how-to-know-if-two-arrays-have-the-same-values
    if (!Array.isArray(arr1) || !Array.isArray(arr2) || arr1.length !== arr2.length) {
      return false
    }

    if (!this.isBaseTypeNumeric(baseType)) {
      for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) {
          return false
        }
      }
    } else {
      // numeric ... so we need to be more precise
      for (let i = 0; i < arr1.length; i++) {
        if (!this.isSingleValuesMatch(baseType, arr1[i], arr2[i])) {
          return false
        }
      }
    }
    return true
  }

  mapResponse (declaration) {
    if (this.isNullValue(declaration.value)) {
      return declaration.mapping.getDefaultValue()
    }

    const mapping = declaration.mapping.getValue()
    const len = mapping.length

    if (declaration.cardinality === 'single') {

      // Coerce source numeric to string
      let sourceValue = (this.isBaseTypeNumeric(declaration.baseType) ? new BigNumber(declaration.value).toString() : declaration.value)

      for (let i = 0; i < len; i++) {
        const mapEntry = mapping[i]
        if (this.isSingleValuesMatch(
          'string',
          (mapEntry.caseSensitive ? mapEntry.mapKey : mapEntry.mapKey.toLowerCase()),
          (mapEntry.caseSensitive ? sourceValue : sourceValue.toLowerCase()))) {
          // Apply mapping constraints to our mappedValue and bail.
          return declaration.mapping.applyConstraints(new BigNumber(mapEntry.mappedValue))
        }
      }

    } else if ((declaration.cardinality === 'multiple') || (declaration.cardinality === 'ordered')) {
      // Init a running total
      let sum = new BigNumber(0)
      let containerValues = declaration.value

      // Coerce source numerics to strings
      if (this.isBaseTypeNumeric(declaration.baseType)) {
        for (let i = 0; i < containerValues.length; i++) {
          if (containerValues[i] !== null) {
            containerValues[i] = new BigNumber(containerValues[i]).toString()
          }
        }
      }

      // If a container contains multiple instances of the same value then that value is counted once only.
      // Remove duplicate values.
      containerValues = this.mappingEliminateNullsAndDuplicates(containerValues)

      // Iterate through the keys and the containerValues.
      // When we find a match, augment running total with the associated mappedValue.
      for (let i = 0; i < len; i++) {
        const mapEntry = mapping[i]
        for (let j = 0; j < containerValues.length; j++) {
          if (this.isSingleValuesMatch(
            'string',
            (mapEntry.caseSensitive ? mapEntry.mapKey : mapEntry.mapKey.toLowerCase()),
            (mapEntry.caseSensitive ? containerValues[j] : containerValues[j].toLowerCase()))) {
            sum = sum.plus(mapEntry.mappedValue)
          }
        }
      }
      // Apply mapping constraints to our final sum
      return declaration.mapping.applyConstraints(sum)
    } // end cardinality=multiple

    // No key matches, bail with defaultValue
    return declaration.mapping.getDefaultValue()
  } // end mapResponseValues

  mappingEliminateNullsAndDuplicates (arr) {
    let len = arr.length
    let result = []
    let obj = {}

    for (let i = 0; i < len; i++) {
      if (arr[i] !== null) {
        obj[arr[i]] = 0
      }
    }
    for (let o in obj) {
      result.push(o)
    }
    return result
  }

  mapValueFromLookupTable (declaration, value) {
    if (this.isNullValue(declaration.lookupTable)) {
      return this.nullValue()
    }
    if (this.isNullValue(value)) {
      return declaration.lookupTable.getDefaultValue()
    }

    const lookupTable = declaration.lookupTable.getValue()
    const lookupTableType = declaration.lookupTable.getTableType()
    // Set up our incoming value to be a BigNumber
    value = new BigNumber(value)

    if (lookupTableType === 'interpolation') {
      // sort ascending by sourceValue
      lookupTable.sort(function (a, b) {
        return a.sourceValue - b.sourceValue
      })

      for (let i = 0; i < lookupTable.length; i++) {
        let entry = lookupTable[i]
        const sourceValue = new BigNumber(entry.sourceValue)
        if ((value.comparedTo(sourceValue) < 0) || (entry.includeBoundary && (value.comparedTo(sourceValue) === 0))) {
          return entry.targetValue
        }
      }
    } else if (lookupTableType === 'match') {
      value = new BigNumber(value)
      for (let i = 0; i < lookupTable.length; i++) {
        let entry = lookupTable[i]
        const sourceValue = new BigNumber(entry.sourceValue)
        if (value.comparedTo(sourceValue) === 0) {
          return entry.targetValue
        }
      }
    }

    // No table matches, bail with defaultValue - which may be null
    return declaration.lookupTable.getDefaultValue()
  }

  /**
   * @description Randomize array in-place using Durstenfeld shuffle algorithm
   * Algorithm runtime is O(n).
   * Note that the shuffle is done in-place so if you don't want to modify the original array,
   * first make a copy of it with .slice(0).
   */
  shuffleArray (array) {
    for (let i = array.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1))
      let temp = array[i]
      array[i] = array[j]
      array[j] = temp
    }
  }

  /**
   * @description Randomize array in-place using Durstenfeld shuffle algorithm with Fixed elements
   * Algorithm runtime is O(n).
   * Note that the shuffle is done in-place so if you don't want to modify the original array,
   * first make a copy of it with .slice(0).
   */
  shuffleArrayFixed (array) {
    for (let i = array.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1))

      // skip shuffling of fixed elements
      // requires array elements to be objects with a fixed attribute.
      if (array[i].fixed || array[j].fixed) {
        continue
      }

      let temp = array[i]
      array[i] = array[j]
      array[j] = temp
    }
  }

  generalizedLcm (arrLength, arr) {
    let value = arr[0]

    for (let i = 1; i < arrLength; i++) {
      // If any value is 0, the result is 0
      if ((value === 0) || (arr[i] === 0)) {
        return 0
      }
      value = this.lcm(value, arr[i])
    }

    return value
  }

  lcm (a, b) {
    return (new BigNumber(a).multipliedBy(b).dividedBy(this.gcd(a, b)).toNumber())
  }

  generalizedGcd (arrLength, arr) {
    let value = arr[0]

    for (let i = 1; i < arrLength; i++) {
      value = this.gcd(value, arr[i])
    }

    return value
  }

  gcd (a, b) {
    b = new BigNumber(b)
    if (b.isZero()) {
      return a
    }

    return this.gcd(b.toNumber(), new BigNumber(a).modulo(b).toNumber())
  }

	getParametersFromDefinition (definition) {
		let params = new Map()

    if (typeof definition === 'undefined') return params
    definition = definition.trim()
    if (definition.length === 0) return params

    // Each key value pair is delimited by  a triple bar
    let pairs = definition.split('|||')

    for (let i = 0; i < pairs.length; i++) {
      // Each key is separated from its value by an "="
      const pair = pairs[i].split('=')
      // If there are inner key value pairs then they are separated by &equals; entity
      params.set(pair[0], (pair.length < 2) ? '' : pair[1].replaceAll('&equals;', '='))
    }

		return params
	}

  valueToPciJson (value, baseType, cardinality) {
    let result = {
      "base": null
    }

    if (value === null) {
      return result
    }

    if (cardinality === 'single') {
      result.base = this.singleValueToPciJson(value, baseType)
      return result
    }
    
    return result
  }

  singleValueToPciJson (value, baseType) {
    let result = {}
    switch (baseType) {
      case 'string':
      case 'identifier':
      case 'integer':
      case 'float':
      case 'duration':
      case 'boolean':
      case 'point':
        result[baseType] = value
        return result

      case 'pair':
      case 'directedPair':
      case 'intOrIdentifier':
      case 'file':
      case 'uri':
        // All of these are unsupported in QTI 3 Player
        // as of 3/9/2023
        return null

      default:
        // What else is there?
        return null
    }
  }

}
