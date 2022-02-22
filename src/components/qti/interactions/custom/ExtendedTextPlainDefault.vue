<template>
  <div ref="root">
    <textarea
      ref="textarea"
      class="extendedtext-plain-default"
      v-bind="$attrs"
      v-model="response"
      :placeholder="placeholder"
      autocapitalize="none"
      spellcheck="false"
      maxlength="maxLength"
      v-on:input="handleInput($event)"
    />
    <tooltip
      ref="tooltip"
      v-if="hasPatternMask"
      :target="() => $refs['textarea']"
      :message="patternMaskMessage"
      :color-style="colorStyle"
    />
  </div>
</template>

<script>
import { store } from '@/store/store'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import Tooltip from '@/shared/components/Tooltip'

const qtiAttributeValidation = new QtiAttributeValidation()

export default {
  name: 'ExtendedTextPlainDefault',

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

    counterStyle: {
      required: false,
      type: String,
      default: 'none'
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

    maxLength () {
      return 10000
    }

  },

  data () {
    return {
      response: '',
      // Used for reverting to the prior response when a patternMask is applied
      priorResponse: '',
      // Save provided patternMask as a Regex here
      appliedRegex: null,
      // Used to toggle the patternMask message tooltip
      displayMessage: false
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

    handleInput (event) {
      event.preventDefault()
      let inputSucceeded = true

      if (this.appliedRegex !== null)
        inputSucceeded = this.applyPatternMask(this.$refs.textarea.value)
      else
        this.setResponse(this.$refs.textarea.value)

      if (!inputSucceeded) return

      // Notify parent that we have an update
      this.$parent.$emit('extendedTextUpdate', {
          response: this.getResponse()
        })
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
    this.$parent.$emit('extendedTextReady', {
        node: this
      })
  }
}
</script>

<style>
.extendedtext-plain-default {
  margin: 0;
  vertical-align:inherit;
  padding: 0 .3rem;
  font-family: inherit;
  font-size: inherit;
  font-weight: 400;
  line-height: 1.6rem;
  height: calc(4.8rem + .35rem);
  color: var(--foreground);
  width: 100%;
  background-color: var(--background);
  background-clip: padding-box;
  border-width: 1px;
  border-color: var(--choice-control-focus-border);
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  border-radius: .25rem;
  transition: border-color .15s ease-in-out,box-shadow .15s ease-in-out;
}

.extendedtext-plain-default:focus {
  color: var(--foreground);
  background-color: var(--background);
  border-color: var(--choice-control-focus-border);
  outline: 0;
  box-shadow: var(--choice-control-focus-shadow);
}

.extendedtext-plain-default::placeholder {
  color: var(--foreground);
  opacity: 0.6;
  font-style: italic;
}

.qti-height-lines-3 .extendedtext-plain-default {
  height: calc(4.8rem + .35rem);
}

.qti-height-lines-6 .extendedtext-plain-default {
  height: calc(9.6rem + .35rem);
}

.qti-height-lines-15 .extendedtext-plain-default {
  height: calc(24rem + .35rem);
}
</style>
