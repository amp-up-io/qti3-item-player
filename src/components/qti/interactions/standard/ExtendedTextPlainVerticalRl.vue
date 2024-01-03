<template>
  <div ref="root">
    <div ref="label"
      class="ext-text-default-vert-rl-label qti-hidden">
    </div>
    <div
      ref="textarea"
      class="ext-text-default-vert-rl"
      v-bind="$attrs"
      tabindex="0" 
      contenteditable="true"
      autocapitalize="false"
      spellcheck="false"
      :maxlength="maxLength"
      :data-placeholder="placeholder"
      @input="handleInput"
      @keydown="handleKeydown"
      @paste="handlePaste"
      @drop="handleDrop"
    ></div>
    <div v-if="showCounter" aria-hidden="true" class="ext-text-default-vert-rl-counter">
      {{counter}}<span v-if="isCounterUp"> / {{expectedLength}}</span>
    </div>
    <tooltip
      ref="tooltip"
      v-if="hasPatternMask"
      :target="() => $refs['textarea']"
      :message="patternMaskMessage"
      :color-style="colorStyle"
      :placement="tooltipPlacement"
    />
  </div>
</template>

<script>
import { store } from '@/store/store'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import Tooltip from '@/shared/components/Tooltip'

const qtiAttributeValidation = new QtiAttributeValidation()

export default {
  name: 'ExtendedTextPlainVerticalRl',

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
      default: 'foo'
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
    },

    showCounter () {
      return (this.counterStyle === 'up' || this.counterStyle === 'down')
    },

    isCounterUp () {
      return (this.counterStyle === 'up')
    },

    tooltipPlacement () {
      return 'right'
    },

    disabled () {
      return this.isDisabled
    }

  },

  data () {
    return {
      response: '',
      state: null,
      // Used for reverting to the prior response when a patternMask is applied
      // or when a counter limit is being enforced.
      priorResponse: '',
      // Save provided patternMask as a Regex here
      appliedRegex: null,
      // Used to toggle the patternMask message tooltip
      displayMessage: false,
      // Current character counter
      counter: 0,
      // Track current caret index
      caretIndex: 0,
      // MaxlengthMessage
      maxlengthMessage: '',
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
        response = ''
      }
      
      this.response = response

      this.updateCounter(this.response.length)
    },

    /**
     * @description Method to use when we want to update the response but
     * not trigger any content model updates.
     * @param {String} response - text, not html
     */
    updateResponse (response) {
      this.response = response

      this.updateCounter(this.response.length)
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
     * When restore is true, this updates the textarea div with the
     * html in the state object.
     * @param {Object} state
     * @param {Boolean} restore
     */
    setState (state, restore=false) {
      this.state = state

      if (restore && ('html' in state)) {
        this.updateContent(state.html)
      }
    },

    computeState (html) {
      const state = {
        html: html
      }
      return state
    },

    setIsDisabled (isDisabled) {
      this.isDisabled = isDisabled

      if (isDisabled) {
        this.$refs.label.innerHTML = 
          this.replaceNewLines(this.getResponse())
        this.$refs.label.classList.remove('qti-hidden')
        this.$refs.label.setAttribute('tabIndex', 0)
        this.$refs.textarea.classList.add('qti-hidden')
      } else {
        this.$refs.label.classList.add('qti-hidden')
        this.$refs.label.setAttribute('tabIndex', -1)
        this.$refs.textarea.classList.remove('qti-hidden')      
      }
    },

    replaceNewLines (value) {
      if (value === null) return ''
      return value.replace(/\r\n|\r|\n/g,'<br />')
    },

    /**
     * @description Return text of the div element.
     * @return {String} text
     */
    getContent () {
      return this.getTextContent(this.$refs.textarea.childNodes)
    },

    /**
     * @description Set the html of the div element.
     * @param {String} html
     */
    updateContent (html) {
      this.$refs.textarea.innerHTML = html
    },
    
    /**
     * Retrieve the text value of an array of DOM nodes.
     * @param {Array or Node} elem - an array of childNodes
     * @return {String} text value of array of childNodes
     */
    getTextContent (elem) {
      let node
      let content = ''
      let i = 0
      let nodeType = elem.nodeType
      
      if (!nodeType) {
        // If no nodeType, this is expected to be an array
        while ( (node = elem[i++]) ) {
          // Recurse
          content += this.getTextContent(node)
        }
      }
      
      if ( nodeType === 1 || nodeType === 11 ) {
        return elem.textContent
      }
      if ( nodeType === 9 ) {
        return elem.documentElement.textContent
      }
      if ( nodeType === 3 || nodeType === 4 ) {
        return elem.nodeValue
      }
      
      return content
    },

    /**
     * @description getter for caretIndex
     * @return {int} caretIndex
     */
    getCaretIndex () {
      return this.caretIndex
    },
    
    /**
     * @description setter for caretIndex
     * @param {int} caretIndex
     */
    setCaretIndex (caretIndex) {
      this.caretIndex = caretIndex
    },

    /**
     * @description Handle input.
     * @param event The input event object
     */
    handleInput (event) {
      event.preventDefault()

      let inputSucceeded = true

      this.setCaretIndex(this.getCaretPos(this.$refs.textarea) - 1)

      let inputText = this.getContent()     

      if (this.showCounter && !this.applyLimitCheck(inputText)) return

      if (this.appliedRegex !== null) {
        inputSucceeded = this.applyPatternMask(inputText)
        if (!inputSucceeded) return
      }

      if ((inputText.length == 0) ||
          ((inputText.length == 1) && (inputText.charCodeAt(0) == 10))) {
        this.empty()
        this.updateCounter(0)
        inputText = ''
      }

      this.setResponse(inputText)
      
      // Save html in state
      this.setState(this.computeState(this.$refs.textarea.innerHTML))

      // Save textarea value for future limit checks
      this.priorResponse = inputText

      // Notify parent that we have an update
      this.$parent.$emit('extendedTextUpdate', {
          response: this.getResponse(),
          state: this.getState()
        })
    },

    /**
     * @description Handle paste.
     * @param event The paste event object
     */
    handlePaste (event) {
      event.preventDefault()

      let inputSucceeded = true

      let text = event.clipboardData.getData('text/plain')

      // Insert text at the current position of caret
      const range = document.getSelection().getRangeAt(0)
      range.deleteContents()

      const textNode = document.createTextNode(text)
      range.insertNode(textNode)
      range.selectNodeContents(textNode)
      range.collapse(false)

      const selection = window.getSelection()
      selection.removeAllRanges()
      selection.addRange(range)

      let inputText = this.getContent()

      if (this.showCounter && !this.applyLimitCheck(inputText)) return

      if (this.appliedRegex !== null) {
        inputSucceeded = this.applyPatternMask(inputText)
        if (!inputSucceeded) return
      }

      if ((inputText.length == 0) ||
          ((inputText.length == 1) && (inputText.charCodeAt(0) == 10))) {
        this.empty()
        this.updateCounter(0)
        inputText = ''
      }

      this.setResponse(inputText)

      // Save html in state
      this.setState(this.computeState(this.replaceNewLines(inputText)))

      // Save textarea value for future limit checks
      this.priorResponse = inputText

      // Notify parent that we have an update
      this.$parent.$emit('extendedTextUpdate', {
          response: this.getResponse(),
          state: this.getState()
        })
    },

    /**
     * @description Prevent dropping.
     */
    handleDrop (event) {
      event.preventDefault()
    },

    /**
     * @description
     * Handle various keyboard controls.
     * Arrow keys assume writing-mode is vertical-rl.
     * @param event The keydown event object
     */
    handleKeydown (event) {
      this.setCaretIndex(this.getCaretPos(this.$refs.textarea))

      switch (event.code) {
        case 'KeyI':
        case 'KeyB':
        case 'KeyU':
          // Prevent Ctrl+i,Ctrl+b,Ctrl+u on Plain Ext Text
          if (event.ctrlKey) event.preventDefault()
          return

        default:
          break
      }
    },

    /**
     * @description Returns document selection range 0
     * @return {Object} A range object
     */
    getRange () {
      const selection = document.getSelection()

      // rangeCount is 0 if nothing is selected; 
      // i.e., we do not have user focus)
      if (selection.rangeCount === 0) return null
      return selection.getRangeAt(0)
    },

    /**
     * @description get caret position
     * @returns {number}
     */
    getCaretPos (element) {
      let position = 0
      const isSupported = typeof window.getSelection !== 'undefined'
      if (isSupported) {
        const selection = window.getSelection()
        if (selection.rangeCount !== 0) {
          const range = window.getSelection().getRangeAt(0)
          const preCaretRange = range.cloneRange()
          preCaretRange.selectNodeContents(element)
          preCaretRange.setEnd(range.endContainer, range.endOffset)
          position = preCaretRange.toString().length
        }
      }
      return position
    },

    /**
     * @description Set caret position
     * @param {DOM element} element - element in which to set caret pos
     * @param {number} pos - caret position
     */
    setCaretPos (element, pos) {
      element.focus()     
      if (element.childNodes.length !== 1) return
      document.getSelection().collapse(element.childNodes[0], pos)
    },

    getLength () {
      return this.response.length
    },
    
    empty () {
      this.$refs.textarea.textContent = ''
    },

    applyLimitCheck (value) {
      if (value.length > this.computedExpectedLength) {
        // Revert to the prior response
        this.setResponse(this.priorResponse, true)
        // Set the caret back to where it was
        // before the limit was exceeded.
        this.setCaretPos(this.$refs.textarea, this.getCaretIndex())
        return false
      }

      // Limit check succeeded.
      return true
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
      this.setResponse(this.priorResponse, true)
      this.setCaretPos(this.$refs.textarea, this.getCaretIndex())
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
    },

    updateCounter (contentLength) {
      if (!this.showCounter) return

      if (this.isCounterUp) {
        this.counter = contentLength
        return
      }

      this.counter = this.computedExpectedLength - contentLength
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
.ext-text-default-vert-rl,
.ext-text-default-vert-rl-label {
  display: inline-block;
  box-sizing: border-box;
  margin: .25rem .5rem;
  writing-mode:vertical-rl;
  text-align: left;
  vertical-align: top;
  padding: .5rem .5rem;
  font-family: inherit;
  font-size: inherit;
  font-weight: 400;
  line-height: 1.6;
  width: calc(5.55rem + .35rem);
  color: var(--foreground);
  height: 97%;
  background-color: var(--background);
  background-clip: padding-box;
  border-width: 1px;
  border-style: solid;
  border-color: var(--choice-control-focus-border);
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  border-radius: .25rem;
  overflow-x: auto;
  outline: 0;
  word-wrap: anywhere; 
  overflow-wrap: anywhere; 
  white-space: break-spaces;
  position: relative;
  -webkit-user-modify: read-write-plaintext-only;
}

.ext-text-default-vert-rl-label {
  -webkit-user-modify: unset;
  cursor: default;
}

.ext-text-default-vert-rl:focus,
.ext-text-default-vert-rl-label:focus {
  color: var(--foreground);
  background-color: var(--background);
  border-color: var(--choice-control-focus-border);
  outline: 0;
  box-shadow: var(--choice-control-focus-shadow);
}

.ext-text-default-vert-rl > * {
  cursor: text;
}

.ext-text-default-vert-rl:empty:before {
  content: attr(data-placeholder);
  color: var(--foreground);
  background: transparent;
  opacity: 0.6;
  font-style: italic;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.qti-height-lines-3 .ext-text-default-vert-rl,
.qti-height-lines-3 .ext-text-default-vert-rl-label {
  width: calc(5.55rem + .35rem);
}

.qti-height-lines-6 .ext-text-default-vert-rl,
.qti-height-lines-6 .ext-text-default-vert-rl-label {
  width: calc(10.35rem + .35rem);
}

.qti-height-lines-15 .ext-text-default-vert-rl,
.qti-height-lines-15 .ext-text-default-vert-rl-label {
  width: calc(24.75rem + .35rem);
}

.ext-text-default-vert-rl-counter {
  margin: .25rem -6px .25rem .5rem;
  width: 1.5rem;
  line-height: 1.5rem;
  text-align: right;
  font-size: .875rem;
  color: var(--foreground);
  padding-bottom: .25rem;
  text-orientation: upright;
  letter-spacing: -2px;
}
</style>
