<template>
  <div ref="root">
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
      // Current character counter
      counter: 0,
      // Track current caret index
      caretIndex: 0,
      // MaxlengthMessage
      maxlengthMessage: ''
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
    setResponse (response, restore=false) {
      if (response === null) {
        this.response = ''
        this.updateCounter(0)
        return
      }
        
      this.response = response

      if (restore) {
        this.updateContent(this.response)
      }
      
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
     * @param {Object} state
     */
    setState (state) {
      this.state = state
    },

    /**
     * @description Return text of the input element.
     * @return {String}
     */
    getContent () {
      return this.getTextContent(this.$refs.textarea.childNodes)
    },

    /**
     * @description Set the text of the input element.
     * @param {String} response 
     */
    updateContent (content) {
      this.$refs.textarea.innerText = content
    },
    
    /**
     * Retrieve the text value of an array of DOM nodes.
     * @param {Array or Node} elem - an array of childNodes
     * @return {String} text value of array of childNodes
     */
    getTextContent (elem) {
      let node
      let ret = ''
      let i = 0
      let nodeType = elem.nodeType
      
      if (!nodeType) {
        // If no nodeType, this is expected to be an array
        while ( (node = elem[i++]) ) {
          // Recurse
          ret += this.getTextContent(node)
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
      
      return ret
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

    handleInput (event) {
      event.preventDefault()

      let inputSucceeded = true

      this.setCaretIndex(this.getCaretPos(this.$refs.textarea) - 1)

      let inputText = this.getContent()

      //console.log('input length:', inputText.length)
      //for (let i=0; i<inputText.length; i++) {
      //  console.log(`input code at ${i}:${inputText.charCodeAt(i)}`)
      //}      

      if (this.showCounter && !this.applyLimitCheck(inputText)) return

      if (this.appliedRegex !== null)
        inputSucceeded = this.applyPatternMask(inputText)
      else
        this.setResponse(inputText)

      //console.log('input length:', inputText.length)
      //if (inputText.length === 1)
      //  console.log('input code at 0:', inputText.charCodeAt(0));

      if (!inputSucceeded) return

      // Save textarea value for future limit checks
      this.priorResponse = inputText

      // Notify parent that we have an update
      this.$parent.$emit('extendedTextUpdate', {
          response: this.getResponse()
        })
    },

    /**
     * @description Handle paste.
     * @param event The paste event object
     */
    handlePaste (event) {
      event.preventDefault()
      
      // Get the copied text from the clipboard
      
      /*
      const text = event.clipboardData
        ? (event.originalEvent || event).clipboardData.getData('text/plain')
        : // For IE
          window.clipboardData
          ? window.clipboardData.getData('Text')
          : ''
      
          
      //if (document.queryCommandSupported('insertText')) {
      //  document.execCommand('insertText', false, text);
      //} else {
        // Insert text at the current position of caret
        const myrange = document.getSelection().getRangeAt(0)
        myrange.deleteContents();
        
        const textNode = document.createTextNode(text)
        myrange.insertNode(textNode)
        myrange.selectNodeContents(textNode)
        myrange.collapse(false)
        
        const selection = window.getSelection()
        selection.removeAllRanges()
        selection.addRange(myrange)
      //}
      */

      //const content = this.getContent()
      //console.log('in paste, getContent length=' + content.length)
      //this.setResponse(content, true)

      // Get user selection, if there is any
      const range = this.getRange()

      if (range === null) return

      const currentContent = this.getContent()
      const startOffset = range.startOffset
      const endOffset = range.endOffset

      let clipboardText = event.clipboardData.getData("text/plain")

      let content = 
        currentContent.substring(0, startOffset) + 
        clipboardText + 
        currentContent.substring(endOffset)

      let inputSucceeded = true

      if (this.showCounter && !this.applyLimitCheck(content)) return

      if (this.appliedRegex !== null)
        inputSucceeded = this.applyPatternMask(content)
      else
        this.setResponse(content, true)

      if (!inputSucceeded) return

      // Save off our new caret index
      this.setCaretIndex(startOffset + clipboardText.length)

      // Move the caret to the end of the pasted text
      this.setCaretPos(this.$refs.textarea, this.getCaretIndex())

      // Save input value for future limit checks
      this.priorResponse = content

      // Notify parent that we have an update
      this.$parent.$emit('extendedTextUpdate', {
          response: this.getResponse()
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
     * @description This selects all characters down from 
     * the current caret position.
     * @param {DOMElement} contentEditable element 
     */
    newDownRange (element) {
      const node = element.firstChild
      const currentRange = this.getRange()

      if (currentRange === null) return

      const startPos = currentRange.startOffset
      const endPos = currentRange.endOffset

      // Bail if we are already at the end of the response
      if (endPos === this.getResponse().length) return

      const selection = window.getSelection()
      selection.removeAllRanges()

      const range = document.createRange()
      range.setStart(node, startPos)
      range.setEnd(node, endPos+1)
      selection.addRange(range)
    },

    /**
     * @description This selects all characters up from 
     * the current caret position.
     * @param {DOMElement} contentEditable element 
     */
    newUpRange (element) {
      const node = element.firstChild
      const currentRange = this.getRange()

      if (currentRange === null) return

      const startPos = currentRange.startOffset
      const endPos = currentRange.endOffset

      //Bail if we are at the beginning of the response
      if (startPos === 0) return

      const selection = window.getSelection()
      selection.removeAllRanges()

      const range = document.createRange()
      range.setStart(node, startPos-1)
      range.setEnd(node, endPos)
      selection.addRange(range)
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
      //this.setCaretPos(this.$refs.textarea, this.getCaretIndex())
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
.ext-text-default-vert-rl {
  display: inline-block;
  margin: .25rem .5rem;
  writing-mode:vertical-rl;
  vertical-align: top;
  padding: .25rem .3rem;
  font-family: inherit;
  font-size: inherit;
  font-weight: 400;
  line-height: inherit;
  width: calc(5.85rem + .35rem);
  color: var(--foreground);
  height: 98%;
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
}

.ext-text-default-vert-rl:focus {
  color: var(--foreground);
  background-color: var(--background);
  border-color: var(--choice-control-focus-border);
  outline: 0;
  box-shadow: var(--choice-control-focus-shadow);
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

.qti-height-lines-3 .ext-text-default-vert-rl {
  width: calc(5.85rem + .35rem);
}

.qti-height-lines-6 .ext-text-default-vert-rl {
  width: calc(11.15rem + .35rem);
}

.qti-height-lines-15 .ext-text-default-vert-rl {
  width: calc(27.35rem + .35rem);
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
