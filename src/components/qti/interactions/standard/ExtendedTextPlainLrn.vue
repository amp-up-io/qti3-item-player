<template>
  <div ref="root">
    <div ref="toolbar" class="extendedtext-toolbar">
      <div v-if="showCounter" aria-hidden="true" class="toolbar-right">
        <span class="extendedtext-toolbar-counter">
          {{counter}}<span v-if="isCounterUp"> / {{expectedLength}}</span> Word(s)
        </span>
      </div>
      <span class="toolbar-left">
        <button  v-if="showCopy" type="button" class="btn-copy" unselectable="on">Copy</button>
        <button  v-if="showCut" type="button" class="btn-cut" unselectable="on">Cut</button>
        <button  v-if="showPaste" type="button" class="btn-paste" unselectable="on">Paste</button>
      </span>
    </div>
    <textarea
      ref="textarea"
      class="extendedtext-plain-lrn"
      v-bind="$attrs"
      v-model="response"
      :placeholder="placeholder"
      autocapitalize="none"
      :spellcheck="computeSpellcheck"
      maxlength="maxLength"
      @input="handleInput"
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
    },

    /*
     * Show or hide native browser squiggly
     */
    dataSpellcheck: {
      required: false,
      type: String
    },

    /*
     * Comma-separated list from 'cut', 'copy', 'paste'
     */
    dataLrnToolbarButtons: {
      required: false,
      type: String
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
    },

    showCounter () {
      return (this.counterStyle === 'up' || this.counterStyle === 'down')
    },

    isCounterUp () {
      return (this.counterStyle === 'up')
    },

    computeSpellcheck () {
      return (typeof this.dataSpellcheck !== 'undefined') ? this.dataSpellcheck : false
    },

    showCopy() {
      return (typeof this.dataLrnToolbarButtons !== 'undefined') ? this.dataLrnToolbarButtons.includes('copy') : false
    },

    showCut () {
      return (typeof this.dataLrnToolbarButtons !== 'undefined') ? this.dataLrnToolbarButtons.includes('cut') : false
    },

    showPaste () {
      return (typeof this.dataLrnToolbarButtons !== 'undefined') ? this.dataLrnToolbarButtons.includes('paste') : false
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
      // Current word counter
      counter: 0
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
        this.updateCounter(0)
        return
      }

      this.response = response
      this.updateCounter(this.computeWordCount(this.response))
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

      if (this.showCounter && !this.applyLimitCheck(this.$refs.textarea.value)) return

      if (this.appliedRegex !== null)
        inputSucceeded = this.applyPatternMask(this.$refs.textarea.value)
      else
        this.setResponse(this.$refs.textarea.value)

      if (!inputSucceeded) return

      // Save textarea value for future limit checks
      this.priorResponse = this.$refs.textarea.value

      // Notify parent that we have an update
      this.$parent.$emit('extendedTextUpdate', {
          response: this.getResponse()
        })
    },

    /**
     * @description Lrn has no hard limit constraints AFAIK, but keep this
     * around just in case we find out otherwise.
     * @return {String} response
     */
    applyLimitCheck (value) {
      // No hard limit check with lrn
      if (this.computeWordCount(value) > this.computedExpectedLength) {
        // Revert to the prior response
        //this.setResponse(this.priorResponse)
        return true
      }

      // Limit check succeeded.
      return true
    },

    updateCounter (contentLength) {
      if (!this.showCounter) return

      if (this.isCounterUp) {
        this.counter = contentLength
        return
      }

      this.counter = this.computedExpectedLength - contentLength
    },

    /**
     * @description Calculate the number of words in a string response.
     * @return {String} response
     */
    computeWordCount (response) {
      // Match on any sequence of non-whitespace characters
      return response.match(/\S+/g).length
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
    this.$parent.$emit('extendedTextReady', {
        node: this
      })
  }
}
</script>

<style>
.extendedtext-toolbar {
  border: 1px solid;
  border-color: var(--ed-bc);
  box-sizing: border-box;
  font-family: 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif;
  padding: 0;
  min-height: 2.85rem;
}

.extendedtext-toolbar .toolbar-right {
  display: inline-block;
  vertical-align: middle;
  float: right;
}

.extendedtext-toolbar .toolbar-left {
  display: inline-block;
  vertical-align: middle;
}

.extendedtext-toolbar .toolbar-left button {
  color: var(--foreground);
  background: var(--background);
  border: none;
  cursor: pointer;
  display: inline-block;
  float: left;
  text-transform: none;
  text-decoration: none;
  text-shadow: none;
  font-weight: normal;
  outline: none;
  padding: .6rem .6rem .6rem .6rem;
  line-height: 1.5em;
  -webkit-box-shadow: none;
  box-shadow: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  user-select: none;
  -ms-user-select: none;
}

.extendedtext-toolbar .toolbar-left button:hover,
.extendedtext-toolbar .toolbar-left button:focus {
    color: #06c;
    filter: var(--choice-ctrlh-hover-brightness);
}

.extendedtext-toolbar-counter {
  display: inline-block;
  min-height: 2.6rem;
  line-height: 1.5rem;
  float: right;
  box-sizing: border-box;
  color: var(--foreground);
  background: var(--background);
  padding: .6rem .5rem;
}

.extendedtext-plain-lrn {
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
  border-width: 0 1px 1px 1px;
  border-color: var(--choice-control-focus-border);
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  border-radius: 0 0 0.25rem 0.25rem;
  transition: border-color .15s ease-in-out,box-shadow .15s ease-in-out;
}

.extendedtext-plain-lrn:focus {
  color: var(--foreground);
  background-color: var(--background);
  border-color: var(--choice-control-focus-border);
  outline: 0;
  box-shadow: var(--choice-control-focus-shadow);
}

.extendedtext-plain-lrn::placeholder {
  color: var(--foreground);
  opacity: 0.6;
  font-style: italic;
}

.qti-height-lines-3 .extendedtext-plain-lrn {
  height: calc(4.8rem + .35rem);
}

.qti-height-lines-6 .extendedtext-plain-lrn {
  height: calc(9.6rem + .35rem);
}

.qti-height-lines-15 .extendedtext-plain-lrn {
  height: calc(24rem + .35rem);
}
</style>
