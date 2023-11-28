<template>
  <span ref="root">
    <span ref="label" 
        class="text-entry-default-label qti-hidden">
    </span>
    <input
      ref="input"
      class="text-entry-default"
      v-bind="$attrs"
      v-model="response"
      type="text"
      :placeholder="placeholder"
      :disabled="disabled"
      autocapitalize="none"
      :spellcheck="spellcheck"
      :maxlength="maxlength"
      @input="handleInput"
    />
    <tooltip
      ref="tooltip"
      v-if="hasPatternMask"
      :target="() => $refs['input']"
      :message="patternMaskMessage"
      :color-style="colorStyle"
    />
  </span>
</template>

<script>
import { store } from '@/store/store'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import Tooltip from '@/shared/components/Tooltip'

const qtiAttributeValidation = new QtiAttributeValidation()

export default {
  name: 'TextEntryPlainDefault',

  components: {
    Tooltip
  },

  props: {

    responseIdentifier: {
      required: true,
      type: String
    },

    expectedLength: {
      required: false,
      type: String
    },

    placeholder: {
      required: false,
      type: String,
      default: ''
    },

    patternMask: {
      required: false,
      type: String
    },

    patternMaskMessage: {
      required: false,
      type: String,
      default: 'Invalid Input'
    },

    spellcheck: {
      required: false,
      type: String,
      default: 'false'
    },

    maxlength: {
      required: false,
      type: String,
      default: '500'
    }

  },

  computed: {

    computedExpectedLength () {
      return (typeof this.expectedLength !== 'undefined') ? this.expectedLength*1 : 400
    },

    hasPatternMask () {
      return (typeof this.patternMask !== 'undefined')
    },

    colorStyle () {
      const pnp = store.getItemContextPnp()
      return pnp.getColorStyle()
    },

    disabled () {
      return this.isDisabled
    }

  },

  data () {
    return {
      response: '',
      // Used for reverting to the prior response when a patternMask is applied
      // or when a counter limit is being enforced.
      priorResponse: '',
      // Save provided patternMask as a Regex here
      appliedRegex: null,
      // Used to toggle the patternMask message tooltip
      displayMessage: false,
      // Maintain disabled state
      isDisabled: false
    }
  },

  inheritAttrs: false,

  methods: {

    /**
     * @description Get this interaction's response.
     * @return {String} response string or null
     */
    getResponse () {
      return this.response
    },

    /**
     * @description Set this interaction's response
     * @param {String} response - string
     */
    setResponse (response) {
      if (response === null) {
        this.response = ''
        return
      }

      this.response = response
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

    setIsDisabled (isDisabled) {
      this.isDisabled = isDisabled

      if (isDisabled) {
        const response = this.getResponse()
        this.$refs.label.innerHTML = (response === null) ? '' : response
        this.$refs.label.classList.remove('qti-hidden')
        this.$refs.label.setAttribute('tabIndex', 0)
        this.$refs.input.classList.add('qti-hidden')

        // Add some padding to create the appearance of a 
        if ((response === null) || (response.length === 0)) {
          this.$refs.label.style.paddingRight = '1.1rem'
        }

      } else {
        this.$refs.label.classList.add('qti-hidden')
        this.$refs.label.setAttribute('tabIndex', -1)
        this.$refs.input.classList.remove('qti-hidden')
      }
    },

    /**
     * @description For textEntryInteraction with no patternMask, the maxlength
     * attribute (500) on the Input element is the only gatekeeper.
     * If a patternMask exists (appliedRegex is not null), use it to enforce the desired input.
     */
    handleInput (event) {
      event.preventDefault()

      let inputSucceeded = true

      if (this.appliedRegex !== null)
        inputSucceeded = this.applyPatternMask(this.$refs.input.value)
      else
        this.setResponse(this.$refs.input.value)

      if (!inputSucceeded) return

      // Save input value for future limit checks
      this.priorResponse = this.$refs.input.value

      // Notify parent that we have an update
      this.$parent.$emit('textEntryUpdate', {
          response: this.getResponse()
        })
    },

    getLength () {
      return this.response.length
    },

    applyPatternMask (value) {
      if (this.appliedRegex.test(value)) {
        // Pattern mask succeeded.  Update the response
        // and the new priorResponse.
        this.setResponse(value)
        this.priorResponse = value
        return true
      }

      // Pattern mask failed.  Display the message and revert the
      // control to the priorResponse.
      this.showPatternMaskMessage()
      this.setResponse(this.priorResponse)
      return false
    },

    showPatternMaskMessage () {
      this.$refs.tooltip.show()
      this.hidePatternMaskMessage()
    },

    hidePatternMaskMessage (timeout=3000) {
      setTimeout(() => {
          this.$refs.tooltip.hide()
        }, timeout)
    }

  },

  created () {
    this.appliedRegex = qtiAttributeValidation.validatePattern('pattern-mask', this.patternMask)
  },

  mounted () {
    // Notify parent that we are ready.
    // Pass ourselves to parent.
    this.$parent.$emit('textEntryReady', {
        node: this
      })
  }
}
</script>

<style>
input.text-entry-default {
  margin: 0;
  vertical-align:inherit;
  padding: 0 .3rem;
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.6rem;
  height: calc(1.5em + .35rem);
  color: var(--foreground);
  width: 8.6rem;
  background-color: var(--background);
  background-clip: padding-box;
  border: 1px solid var(--choice-control-focus-border);
  appearance: none;
  border-radius: .25rem;
  transition: border-color .15s ease-in-out,box-shadow .15s ease-in-out;
}

input.text-entry-default::placeholder {
  color: var(--foreground);
  opacity: 0.6;
  font-style: italic;
}

.text-entry-default-label {
  text-align: inherit;
  overflow-wrap: break-word;
  margin: 0 0.15rem;
  padding: 0.3rem .3rem;
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.6rem;
  color: var(--foreground);
  vertical-align: inherit;
  border: 1px solid var(--choice-control-focus-border);
  border-radius: .25rem;
  transition: background-color .15s ease-in-out,border-color .15s ease-in-out,box-shadow .15s ease-in-out;
  cursor: default;
}

input.text-entry-default:focus,
.text-entry-default-label:focus {
  color: var(--foreground);
  background-color: var(--background);
  border-color: var(--choice-control-focus-border);
  outline: 0;
  box-shadow: var(--choice-control-focus-shadow);
}

.qti-text-entry-interaction.qti-align-center input {
  text-align: center;
}

.qti-text-entry-interaction.qti-align-left input {
  text-align: left;
}

.qti-text-entry-interaction.qti-align-right input {
  text-align: right;
}

.qti-input-width-1 .text-entry-default {
  width: 1.7rem;
}

.qti-input-width-2 .text-entry-default {
  width: 2.7rem;
}

.qti-input-width-3 .text-entry-default {
  width: 3.7rem;
}

.qti-input-width-4 .text-entry-default {
  width: 4.7rem;
}

.qti-input-width-5 .text-entry-default {
  width: 5.6rem;
}

.qti-input-width-6 .text-entry-default {
  width: 6.6rem;
}

.qti-input-width-10 .text-entry-default {
  width: 10.4rem;
}

.qti-input-width-15 .text-entry-default {
  width: 15.2rem;
}

.qti-input-width-20 .text-entry-default {
  width: 20.0rem;
}

.qti-input-width-25 .text-entry-default {
  width: 25.0rem;
}

.qti-input-width-30 .text-entry-default {
  width: 30.0rem;
}

.qti-input-width-35 .text-entry-default {
  width: 35.0rem;
}

.qti-input-width-40 .text-entry-default {
  width: 40.0rem;
}

.qti-input-width-45 .text-entry-default {
  width: 45.0rem;
}

.qti-input-width-50 .text-entry-default {
  width: 50.0rem;
}

.qti-input-width-72 .text-entry-default {
  width: 100%;
}
</style>
