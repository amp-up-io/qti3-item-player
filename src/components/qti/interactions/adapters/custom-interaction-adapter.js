import Vue from 'vue'
import AmpLikertNumeric from '@/components/qti/interactions/custom/AmpLikertNumeric'
import CustomOption from '@/components/qti/interactions/custom/CustomOption'

Vue.component('custom-option', CustomOption)

const CUSTOM_INTERACTIONS = {
  AMP_LIKERT_NUMERIC: 'amp:likert-numeric'
}

/**
 * @description Produce the Template for the interaction.
 * @param {String} interactionSubtype
 * @param {Object} props - QtiCustomInteraction properties such as response-identifier
 * @param {Object} attrs - HTML element attributes that are not props
 *                         and not the class attribute.
 * @returns {Object} Template and Component dependencies
 */
export function customInteractionAdapter(interactionSubtype, props, attrs) {
  switch (interactionSubtype) {
    case CUSTOM_INTERACTIONS.AMP_LIKERT_NUMERIC:
      return {
        template: `<AmpLikertNumeric ` +
          `responseIdentifier="${props.responseIdentifier}" ${printAttrs(attrs)}>` +
            `<slot></slot>` +
          `</AmpLikertNumeric>`,
        components: { AmpLikertNumeric, CustomOption }
      }
    default:
      return {
        template: `<div>[Unsupported Custom Interaction: ${interactionSubtype}]</div>`
      }
  }
}

/**
 * @description 
 * @param {String} clazz 
 * @returns {String}
 */
export function getCustomInteractionSubType(clazz) {
  // Return the first supported operator we find.
  const clazzTokens = clazz.split(' ')
  for (let index = 0; index < clazzTokens.length; index++) {
    switch (clazzTokens[index]) {
      case CUSTOM_INTERACTIONS.AMP_LIKERT_NUMERIC:
        return clazzTokens[index]
      default:
    }
  }
  return clazz
}

function printAttrs (attrs) {
  let result = ''
  for (const key in attrs) {
    const value = attrs[key]
    result += `${key}="${value}" `
  }
  return result
}
