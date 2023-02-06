<template>
  <div ref="root" class="text-entry-default-vert-wrapper">
    <div 
      ref="input"
      class="text-entry-default-vert"
      v-bind="$attrs"
      tabindex="0" 
      contenteditable="true"
      autocapitalize="false"
      :spellcheck="spellcheck"
      :maxlength="maxlength"
      @input="handleInput"
      @blur="handleBlur"
      @focus="handleFocus"
      @keydown="handleKeydown"
      @paste="handlePaste"
      @drop="handleDrop"
    ></div>
    <label 
      ref="placeholder" 
      class="text-entry-default-vert-ph"
      aria-hidden="true">{{placeholder}}</label>
    <tooltip
      ref="tooltip"
      v-if="hasPatternMask"
      :target="() => $refs['input']"
      :message="patternMaskMessage"
      :color-style="colorStyle"
    />
    <tooltip
      ref="tooltipMaxlength"
      :target="() => $refs['input']"
      :message="maxlengthMessage"
      :color-style="colorStyle"
    />
  </div>
</template>

<script>
import { store } from '@/store/store'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import Tooltip from '@/shared/components/Tooltip'
//     <label ref="placeholder" class="text-entry-default-vert-placeholder">Foo</label>
const qtiAttributeValidation = new QtiAttributeValidation()

export default {
  name: 'TextEntryPlainDefaultVertical',

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

    widthClass: {
      required: false,
      type: String,
      default: ''
    },

    maxlength: {
      required: false,
      type: String,
      default: '8'
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
      if (response === null)
        this.response = ''
      else
        this.response = response

      if (restore) this.updateContent(this.response)
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
      return this.$refs.input.innerText
    },

    /**
     * @description Set the text of the input element.
     * Side Effect: show/hide the placeholder.
     * @param {String} response 
     */
    updateContent (content) {
      this.$refs.input.innerText = content
      // Show/Hide the placeholder
      if (content.length > 0)
        this.hidePlaceholder()
      else
        this.showPlaceholder()
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
     * @description For textEntryInteraction with no patternMask, the maxlength
     * attribute is the only gatekeeper.
     * If a patternMask exists (appliedRegex is not null), use it to enforce 
     * the desired input.
     */
    handleInput (event) {
      event.preventDefault()

      let inputSucceeded = true

      this.setCaretIndex(this.getCaretPos(this.$refs.input) - 1)

      const content = this.getContent()

      if (content.length > 0)
        this.hidePlaceholder()

      if (!this.applyLimitCheck(content)) return

      if (this.appliedRegex !== null)
        inputSucceeded = this.applyPatternMask(content)
      else
        this.setResponse(content)

      if (!inputSucceeded) return

      if (content.length == 0)
        this.showPlaceholder()

      // Save input value for future limit checks
      this.priorResponse = content

      // Notify parent that we have an update
      this.$parent.$emit('textEntryUpdate', {
          response: this.getResponse()
        })
    },

    /**
     * @description Handle paste.
     * @param event The paste event object
     */
    handlePaste (event) {
      event.preventDefault()

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
      
      if (content.length > 0)
        this.hidePlaceholder()

      if (content.length > this.maxlength) {
        this.showMaxlengthMessage()
        // Revert to the prior response
        this.setResponse(this.priorResponse, true)
        this.setCaretPos(this.$refs.input, startOffset)
        return
      }

      if (this.appliedRegex !== null)
        inputSucceeded = this.applyPatternMask(content)
      else
        this.setResponse(content, true)

      if (!inputSucceeded) return

      // Save off our new caret index
      this.setCaretIndex(startOffset + clipboardText.length)

      // Move the caret to the end of the pasted text
      this.setCaretPos(this.$refs.input, this.getCaretIndex())

      // Save input value for future limit checks
      this.priorResponse = content

      // Notify parent that we have an update
      this.$parent.$emit('textEntryUpdate', {
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
      this.setCaretIndex(this.getCaretPos(this.$refs.input))

      switch (event.code) {
        case 'ArrowUp':
          event.preventDefault()
          if (this.getCaretIndex() === 0) return

          if (event.shiftKey) {
            this.newUpRange(this.$refs.input)
          } else {
            this.setCaretPos(this.$refs.input, this.getCaretIndex()-1)
          }
          break

        case 'ArrowDown':
          event.preventDefault()
          if (this.getCaretIndex() === this.getContent().length) return

          if (event.shiftKey) {
            // Mark all chars down from current Caret
            this.newDownRange(this.$refs.input)
          } else {
            // Move Caret down one char
            this.setCaretPos(this.$refs.input, this.getCaretIndex()+1)
          }
          break

        case 'ArrowLeft':
          event.preventDefault()
          // Set Caret at bottom
          this.setCaretPos(this.$refs.input, this.getContent().length)
          break

        case 'ArrowRight':
          event.preventDefault()
          // Set Caret at top
          this.setCaretPos(this.$refs.input, 0)
          break

        case 'Enter':
          // Prevent Enter
          event.preventDefault()
          return

        case 'KeyI':
        case 'KeyB':
        case 'KeyU':
          // Prevent Ctrl+i,Ctrl+b,Ctrl+u
          if (event.ctrlKey) event.preventDefault()
          return

        default:
          break
      }
    },

    /**
     * @description This selects all characters down from 
     * the current caret position.
     * @param {DOMElement} input element 
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
     * @param {DOMElement} input element 
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


    showPlaceholder () {
      this.$refs.placeholder.classList.remove('text-entry-ph-hidden')
    },

    hidePlaceholder () {
      this.$refs.placeholder.classList.add('text-entry-ph-hidden')
    },

    /**
     * @description
     * Handle blur.
     * Main purpose is to remove the focus ring around the wrapper div.
     * @param event The keydown event object
     */
    handleBlur () {
      this.$refs.root.classList.remove('focused')
    },

    /**
     * @description
     * Handle focus.
     * Main purpose is to add the focus ring around the wrapper div.
     * @param event The keydown event object
     */
    handleFocus () {
      this.$refs.root.classList.add('focused')
    },

    getLength () {
      return this.response.length
    },

    applyLimitCheck (value) {
      if (value.length > this.maxlength) {
        this.showMaxlengthMessage()
        // Revert to the prior response
        this.setResponse(this.priorResponse, true)
        // Set the caret back to where it was
        // before the limit was exceeded.
        this.setCaretPos(this.$refs.input, this.getCaretIndex())
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
      this.setCaretPos(this.$refs.input, this.getCaretIndex())
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

    showMaxlengthMessage () {
      this.$refs.tooltipMaxlength.show()
      this.hideMaxlengthMessage()
    },

    hideMaxlengthMessage (timeout=1000) {
      setTimeout(() => {
          this.$refs.tooltipMaxlength.hide()
        }, timeout)
    },

    computeMaxlengthMessage () {
      this.maxlengthMessage = `Maximum of ${this.maxlength} character` + (this.maxlength === '1' ? '' : 's')
    }

  },

  created () {
    this.appliedRegex = qtiAttributeValidation.validatePattern('pattern-mask', this.patternMask)
    this.computeMaxlengthMessage()
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
div.qti-text-entry-interaction.qti-orientation-vertical {
  display: inline-block;
  position: relative;
  margin-top: .15rem;
  margin-bottom: .15rem;
  margin-right: -0.1rem;
  /* very important to get these lined up vertically */
  vertical-align: top;
  min-height: calc(1.6rem);
  line-height: 1.6rem;
  padding-top: .25rem;
  padding-bottom: .25rem;
  padding-right: 0.05rem;
}

div.text-entry-default-vert-wrapper {
  display: inline-block;
  position: relative;
  vertical-align: top;
  min-height: calc(1.6rem);
  line-height: 1.6rem;
  border: 1px solid;
  border-color: var(--choice-control-focus-border);
  border-radius: .25rem;
  transition: border-color .15s ease-in-out,box-shadow .15s ease-in-out;
}

div.text-entry-default-vert-wrapper.focused {
  border-color: var(--choice-control-focus-border);
  box-shadow: var(--choice-control-focus-shadow);
}

.text-entry-default-vert {
  display: inline-block;
  position: relative;
  margin-top: 0.25rem;
  padding-right: .125rem;
  vertical-align: top;
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.6rem;
  width: calc(1.6rem + .2rem);
  height: 8.25rem;
  color: var(--foreground);
  background-color: var(--background);
}

.text-entry-default-vert:focus {
  color: var(--foreground);
  background-color: var(--background);
  outline: 0;
}

.text-entry-default-vert[contenteditable='true'] {
    caret-color: var(--foreground);
}

.text-entry-default-vert-ph {
  display: inline-block;
  position: absolute;
  top: .5rem;
  right: .25rem;
  height: 8.25rem;
  width: calc(1.6rem + .2rem);
  color: var(--foreground);
  background: transparent;
  opacity: 0.6;
  font-style: italic;
  pointer-events: none;
  overflow: hidden;
}

.text-entry-ph-hidden {
  display: none;
}

.qti-input-width-1 .text-entry-default-vert,
.qti-input-width-1 .text-entry-default-vert-ph {
  height: 1.25rem;
}

.qti-input-width-2 .text-entry-default-vert,
.qti-input-width-2 .text-entry-default-vert-ph {
  height: 2.25rem;
}

.qti-input-width-3 .text-entry-default-vert,
.qti-input-width-3 .text-entry-default-vert-ph {
  height: 3.25rem;
}

.qti-input-width-4 .text-entry-default-vert,
.qti-input-width-4 .text-entry-default-vert-ph {
  height: 4.25rem;
}
.qti-input-width-5 .text-entry-default-vert,
.qti-input-width-5 .text-entry-default-vert-ph {
  height: 5.25rem;
}

.qti-input-width-6 .text-entry-default-vert,
.qti-input-width-6 .text-entry-default-vert-ph {
  height: 6.25rem;
}

.qti-input-width-10 .text-entry-default-vert,
.qti-input-width-10 .text-entry-default-vert-ph {
  height: 10.25rem;
}

.qti-input-width-15 .text-entry-default-vert,
.qti-input-width-15 .text-entry-default-vert-ph {
  height: 15.0rem;
}

.qti-input-width-20 .text-entry-default-vert,
.qti-input-width-20 .text-entry-default-vert-ph {
  width: 20.0rem;
}

.qti-input-width-25 .text-entry-default-vert,
.qti-input-width-25 .text-entry-default-vert-ph {
  height: 25.0rem;
}

.qti-input-width-30 .text-entry-default-vert,
.qti-input-width-30 .text-entry-default-vert-ph {
  height: 30.0rem;
}

.qti-input-width-35 .text-entry-default-vert,
.qti-input-width-35 .text-entry-default-vert-ph {
  height: 35.0rem;
}

.qti-input-width-40 .text-entry-default-vert,
.qti-input-width-40 .text-entry-default-vert-ph {
  height: 40.0rem;
}

.qti-input-width-45 .text-entry-default-vert,
.qti-input-width-45 .text-entry-default-vert-ph {
  height: 45.0rem;
}

.qti-input-width-50 .text-entry-default-vert,
.qti-input-width-50 .text-entry-default-vert-ph {
  height: 50.0rem;
}
</style>
