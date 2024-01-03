<template>
  <div ref="root">
    <div ref="toolbar" class="ext-text-toolbar">
      <div v-if="showCounter" aria-hidden="true" class="toolbar-right">
        <span class="ext-text-toolbar-counter">
          {{counter}}<span v-if="isCounterUp"> / {{expectedLength}}</span> Word(s)
        </span>
      </div>
      <span class="toolbar-left">
        <button  v-if="showCopy" @click.prevent="handleCopy" type="button" class="btn-copy" unselectable="on">Copy</button>
        <button  v-if="showCut" @click.prevent="handleCut" type="button" class="btn-cut" unselectable="on">Cut</button>
        <button  v-if="showPaste" @click.prevent="handlePaste" type="button" class="btn-paste" unselectable="on">Paste</button>
      </span>
    </div>
    <textarea
      ref="textarea"
      class="ext-text-plain-lrn"
      v-bind="$attrs"
      v-model="response"
      :placeholder="placeholder"
      :disabled="disabled"
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
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'
import Tooltip from '@/shared/components/Tooltip'

const qtiAttributeValidation = new QtiAttributeValidation()
const qtiProcessing = new QtiProcessing()

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
    dataToolbarButtons: {
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
      if (this.isDisabled) return false
      return (typeof this.dataToolbarButtons !== 'undefined') ? this.dataToolbarButtons.includes('copy') : false
    },

    showCut () {
      if (this.isDisabled) return false
      return (typeof this.dataToolbarButtons !== 'undefined') ? this.dataToolbarButtons.includes('cut') : false
    },

    showPaste () {
      if (this.isDisabled) return false
      return (typeof this.dataToolbarButtons !== 'undefined') ? this.dataToolbarButtons.includes('paste') : false
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
      // Current word counter
      counter: 0,
      // Handle on currently selected text.  Used for cut and copy operations.
      selectedText: '',
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
        this.updateCounter(0)
        return
      }

      this.response = response
      this.updateCounter(qtiProcessing.computeWordCount(this.response))
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
    },

    handleInput (event) {
      event.preventDefault()

      const response = this.$refs.textarea.value
      if (!this.isPassedConstraints(response)) return
      this.setResponse(response)

      // Save textarea value for future limit checks
      this.priorResponse = response

      // Notify parent that we have an update
      this.$parent.$emit('extendedTextUpdate', {
          response: this.getResponse()
        })
    },

    isPassedConstraints (value) {
      if (this.showCounter && !this.applyLimitCheck(value)) return false
      //if (this.appliedRegex !== null && !this.applyPatternMask(value)) return false
      return true
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
        this.setResponse(this.priorResponse)
        return false
      }

      // Limit check succeeded.
      return true
    },

    applyPatternMask (value) {
      if (this.appliedRegex.test(value)) {
        // Pattern mask succeeded.
        return true
      }

      // Pattern mask failed.  Display the message and revert the
      // control to the priorResponse.
      this.showPatternMaskMessage()
      this.setResponse(this.priorResponse)
      return false
    },

    updateCounter (contentLength) {
      if (!this.showCounter) return

      if (this.isCounterUp) {
        this.counter = contentLength
        return
      }

      this.counter = this.computedExpectedLength - contentLength
    },

    getLength () {
      return this.response.length
    },

    showPatternMaskMessage () {
      this.$refs.tooltip.show()
      this.hidePatternMaskMessage()
    },

    hidePatternMaskMessage (timeout=3000) {
      setTimeout(() => {
          this.$refs.tooltip.hide()
        }, timeout)
    },

    handleCopy () {
      this.selectedText = this.getSelectedText()
    },

    handleCut () {
      this.selectedText = this.getSelectedText()
      // Replace selection with empty string
      this.insertText('')
    },

    handlePaste () {
      this.insertText(this.selectedText)
    },

    getSelectedText () {
      const element = this.$refs.textarea
      // Get text from textarea selection
      if (typeof element.selectionStart == 'number') {
        // Get text from selection range
        const selectedText = element.value.slice(element.selectionStart, element.selectionEnd)
        // Refocus the textarea and highlight the selection range
        element.focus()
        element.setSelectionRange(element.selectionStart, element.selectionEnd)
        return selectedText
      }

      return ''
    },

    insertText (value) {
      this.insertTextAtCursor(value)

      this.setResponse(this.$refs.textarea.value)

      // Save textarea value for future limit checks
      this.priorResponse = this.$refs.textarea.value

      // Notify parent that we have an update
      this.$parent.$emit('extendedTextUpdate', {
        response: this.getResponse()
      })
    },

    insertTextAtCursor (value) {
      const element = this.$refs.textarea

      if (element.selectionStart || element.selectionStart === 0) {
        const startPos = element.selectionStart
        const endPos = element.selectionEnd
        const scrollTop = element.scrollTop

        // Compute new text string
        const newValue = element.value.substring(0, startPos) +
                         value +
                         element.value.substring(endPos, element.value.length)

        if (!this.isPassedConstraints(newValue)) return
        element.value = newValue

        // Update selection and scroll position
        element.focus()
        element.selectionStart = startPos + value.length
        element.selectionEnd = startPos + value.length
        element.scrollTop = scrollTop
        return
      }

      // no cursor pos?
      // Compute new text string
      const newValue = element.value + value
      if (!this.isPassedConstraints(newValue)) return
      element.value = newValue
      element.focus()
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
.ext-text-toolbar {
  border: 1px solid;
  border-color: var(--ed-bc);
  box-sizing: border-box;
  font-family: 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif;
  padding: 0;
  min-height: 2.85rem;
}

.ext-text-toolbar .toolbar-right {
  display: inline-block;
  vertical-align: middle;
  float: right;
}

.ext-text-toolbar .toolbar-left {
  display: inline-block;
  vertical-align: middle;
}

.ext-text-toolbar .toolbar-left button {
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

.ext-text-toolbar .toolbar-left button:hover,
.ext-text-toolbar .toolbar-left button:focus {
    color: #06c;
    filter: var(--choice-ctrlh-hover-brightness);
}

.ext-text-toolbar-counter {
  display: inline-block;
  min-height: 2.6rem;
  line-height: 1.5rem;
  float: right;
  box-sizing: border-box;
  color: var(--foreground);
  background: var(--background);
  padding: .6rem .5rem;
}

.ext-text-plain-lrn {
  margin: 0;
  vertical-align:inherit;
  padding: .75rem .9rem;
  font-family: inherit;
  font-size: inherit;
  font-weight: 400;
  line-height: 1.42rem;
  height: calc(5.45rem + .35rem);
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

.ext-text-plain-lrn:focus {
  color: var(--foreground);
  background-color: var(--background);
  border-color: var(--choice-control-focus-border);
  outline: 0;
  box-shadow: var(--choice-control-focus-shadow);
}

.ext-text-plain-lrn::placeholder {
  color: var(--foreground);
  opacity: 0.6;
  font-style: italic;
}

.qti-height-lines-3 .ext-text-plain-lrn {
  height: calc(5.45rem + .35rem);
}

.qti-height-lines-6 .ext-text-plain-lrn {
  height: calc(9.7rem + .35rem);
}

.qti-height-lines-15 .ext-text-plain-lrn {
  height: calc(22.5rem + .35rem);
}
</style>
