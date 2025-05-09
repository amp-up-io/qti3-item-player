<template>
  <div ref="root" class="amp-likert-num">
    <div class="amp-likert-range">
      <input ref="range"
        type="range" 
        :min="minimum" 
        :max="maximum" 
        :step="step"
        :disabled="isDisabled"
        v-model="currentValue"
        @input="handleInput"/>
    </div>
    <div ref="value" 
      class="amp-likert-value"
      :aria-label="valueAriaLabel">{{ currentValue }}</div>
    <slot></slot>
  </div>
</template>

<script>
/*
 * Implementation of a qti-custom-interaction with class="amp:likert-numerc".  AmpLikertNumeric
 * requires one <custom-option> subelement containing JSON configuration parameters which are 
 * parsed into an object and used to set the UX and behaviors of the interaction.
 */
import { store } from '@/store/store'
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'

const qtiAttributeValidation = new QtiAttributeValidation()

export default {
  name: 'AmpLikertNumeric',

  props: {
    responseIdentifier: {
      required: true,
      type: String
    }
  },

  data () {
    return {
      response: null,
      state: null,
      isValidResponse: false,
      invalidResponseMessage: '',
      valueAriaLabel: '',
      baseType: 'integer',
      cardinality: 'single',
      customOption: null,
      configuration: null,
      responseDeclaration: null,
      isDisabled: false,
      isQtiValid: true,
      minimum: 0,
      maximum: 0,
      step: 0,
      initialValue: 0,
      currentValue: 0
    }
  },

  methods: {
    /**
     * @description Get this interaction's response.
     * @return {String} response
     */
    getResponse () {
      return this.response
    },

    /**
     * @description Set this interaction's response
     * @param {String} response - string containing selected choice identifier.
     */
    setResponse (response) {
      this.response = response
      const value = 
        (response === null)
          ? this.initialValue
          : response
      this.setValue(value)
      this.setAriaLabel(value)
    },

    /**
     * @description Get this interaction's state.
     * @return {Object} state
     */
    getState () {
      return this.state
    },

    /**
     * @description Set/restore this interaction's state.
     * @param {Object} state
     */
    setState (state) {
      this.state = state
    },

    /**
     * @description Get this interaction's response validity.
     * @return {Boolean} isValidResponse
     */
    getIsValid () {
      return this.isValidResponse
    },

    /**
     * @description Set this interaction's response validity.
     * @param {Boolean} isValid
     */
    setIsValid (isValid) {
      this.isValidResponse = isValid
    },

    /**
     * @description Get this interaction's invalid response message.
     * @return {String} custom message
     */
    getInvalidResponseMessage () {
      return this.invalidResponseMessage
    },

    setValue (value) {
      this.currentValue = value
    },

    resetValue() {
      this.currentValue = this.initialValue
      this.setAriaLabel(this.currentValue)
    },

    disable () {
      this.isDisabled = true
    },

    enable () {
      this.isDisabled = false
    },

    isValidSlot (slot) {
      if (typeof slot.componentOptions !== 'undefined') {
        return true
      } else {
        // check if text is something not empty
        if ((typeof slot.text !== 'undefined') && (slot.text.trim().length > 0)) {
          // not an empty text slot.  this is an error.
          throw new QtiValidationException('Invalid Child Node: "' + slot.text.trim() + '"')
        } else {
          // empty text slot.  not a component, but not an error
          return false
        }
      }
    },

    /**
     * Examine the child node:
     * nodes (1)
     */
    validateChildren: function () {
      let countNodes = 0
      this.$slots.default.forEach((slot) => {
        if (this.isValidSlot(slot)) {
          // Detect a custom-option
          if (slot.componentOptions.tag === 'custom-option') {
            countNodes +=1
          } else {
            throw new QtiValidationException('Node is not a "custom-option" element: "' + slot.componentOptions.tag + '"')
          }
        }
      })
      if (countNodes !== 1) {
        throw new QtiValidationException('Must have exactly one "custom-option" node')
      }

      // All good.  Save off our children (should be 1 single custom-option)
      this.processChildren()
      // Try to parse the JSON config
      this.parseConfiguration()
    },

    processChildren () {
      this.customOption = this.$children[0]
    },

    /**
     * @description Parse the content of the <custom-option> element into an
     * Object containing all configuration properties.
     */
    parseConfiguration () {
      try {
        this.configuration = JSON.parse(this.customOption.content)
        this.initialValue = this.currentValue = this.configuration.initialValue
        this.minimum = this.configuration.min
        this.maximum = this.configuration.max
        this.step = this.configuration.step
        this.invalidResponseMessage = this.configuration.invalidResponseMessage
        this.setAriaLabel(this.currentValue)
      } catch (err) {
        this.isQtiValid = false
        throw new QtiValidationException('Unable to parse AmpLikertNumeric configuration')
      }
    },

    /**
     * @description Handle a change in the slider value.
     * @param {String} data
     */
    handleInput (event) {
      this.setIsValid(true)

      this.setResponse(this.transformValueToResponse(event.target.value))
      
      // Notify parent that we have an update
      this.$parent.$emit('customInteractionUpdate', {
          response: this.getResponse()
        })
    },

    /**
     * @description Convert the string value to an integer value.
     * Also sets our internal response value.
     * @param {String} value 
     */
    transformValueToResponse (value) {
      return parseInt(value)
    },

    /**
     * @description Helper method to create a better experience
     * for screen readers.
     * @param {integer} value
     */
    setAriaLabel (value) {
      this.valueAriaLabel = `Likert Value: ${value}`
    }

  },

  created () {
    try {
      this.responseDeclaration = qtiAttributeValidation.validateResponseIdentifierAttribute(store, this.responseIdentifier)
    } catch (err) {
      this.isQtiValid = false
      if (err.name === 'QtiValidationException') {
        throw new QtiValidationException(err.message)
      } else {
        throw new Error(err.message)
      }
    }
  },

  mounted () {
    if (this.isQtiValid) {
      try {
        this.validateChildren()

        // Notify the parent <qti-custom-interaction> that we are ready.
        // The parent component will then initialize our response and state.
        this.$parent.$emit('customInteractionReady', {
          baseType: 'integer',
          cardinality: 'single',
          node: this
        })
      } catch (err) {
        this.isQtiValid = false
        throw new QtiValidationException(err.message)
      }
    }
  }
}
</script>

<style>
.amp-likert-num {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 0 auto;
  height: 2rem;
  width: 100%;
  background: var(--background);
  padding: 0px 10px;
}

.amp-likert-range {
  flex: 1;
}

.amp-likert-value {
  font-size: 1.5rem;
  width: 50px;
  text-align: center;
}

.amp-likert-num input[type=range]{
  -webkit-appearance: none;
  appearance: none;
  cursor: pointer;
  margin-right: 4px;
  width: 100%;
  background: transparent;
}

.amp-likert-num input[type=range]:disabled {
  pointer-events: none;
}

.amp-likert-num input[type=range]:focus {
  outline: none;
}

.amp-likert-num input[type=range]::-webkit-slider-runnable-track {
  width: 100%;
  height: 11px;
  background: var(--slider-track);
  border: none;
  border-radius: 10px;
}

.amp-likert-num input[type=range].disabled::-webkit-slider-runnable-track {
  background: var(--well-bg);
}

.amp-likert-num input[type=range]:focus::-webkit-slider-runnable-track {
  -webkit-appearance: none;
  appearance: none;
  background: var(--slider-focus-track);
}

.amp-likert-num input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  border: none;
  height: 15px;
  width: 15px;
  border-radius: 50%;
  background: var(--foreground);
  margin-top: -2.5px;
}

.amp-likert-num input[type=range].disabled::-webkit-slider-thumb {
  background: var(--well-bg);
}

.amp-likert-num input[type=range]:focus::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  border: 1px solid var(--well-border);
  background: var(--foreground);
}

.amp-likert-num input[type=range].disabled:focus::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  border: none;
  background: var(--well-bg);
}

.amp-likert-num input[type=range].disabled:focus::-webkit-slider-runnable-track {
  background: var(--well-bg);
}

.amp-likert-num input[type=range]::-moz-range-track {
  width: 100%;
  height: 11px;
  background: var(--slider-track);
  border: none;
  border-radius: 10px;
}

.amp-likert-num input[type=range]::-moz-range-thumb {
  border: none;
  height: 15px;
  width: 15px;
  border-radius: 50%;
  background: var(--foreground);
}

.amp-likert-num input[type=range]:focus::-moz-range-thumb {
  border: 1px solid var(--well-border);
  background: var(--foreground);
}

/*hide the outline behind the border*/
.amp-likert-num input[type=range]:-moz-focusring{
  outline: 1px solid var(--white);
  outline-offset: -1px;
}

.amp-likert-num input[type=range]:focus::-moz-range-track {
  background: var(--slider-focus-track);
}

.amp-likert-num input[type=range].disabled::-moz-range-thumb,
.amp-likert-num input[type=range].disabled::-moz-range-track,
.amp-likert-num input[type=range].disabled:focus::-moz-range-track {
  background: var(--well-bg);
}
</style>
