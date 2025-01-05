<template>
  <div ref="root" class="qti-media-interaction">

    <div ref="prompt" class="qti-prompt-wrapper"></div>

    <MediaGroup
      ref="mediagroup"
      @mediaMounted="handleMediaMounted"
      @mediaLoaded="handleMediaLoaded"
      @mediaEnded="handleMediaEnded">
      <slot></slot>
    </MediaGroup>

  </div>
</template>

<script>
/*
 * A media interaction allows more control over the way the candidate interacts with a 
 * time-based media object and allows the number of times the media object was experienced 
 * to be reported in the value of the associated response variable, which must be of base-type 
 * integer and single cardinality.
 */
import Vue from 'vue'
import { store } from '@/store/store'
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiParseException from '@/components/qti/exceptions/QtiParseException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiPrompt from '@/components/qti/interactions/QtiPrompt'
import MediaGroup from '@/components/qti/interactions/MediaGroup'

Vue.component('qti-prompt', QtiPrompt)
Vue.component('MediaGroup', MediaGroup)

const qtiAttributeValidation = new QtiAttributeValidation()

export default {
  name: 'QtiMediaInteraction',

  props: {
    responseIdentifier: {
      required: true,
      type: String
    },
    /*
     * The autostart characteristic determines if the media object should begin as soon as 
     * the candidate starts the attempt (true) or if the media object should be started under 
     * the control of the candidate (false).
     */
    autostart: {
      required: false,
      type: String,
      default: 'false'
    },
    /*
     * The min-plays attribute indicates that the media object should be played a minimum 
     * number of times by the candidate. The techniques required to enforce this will vary 
     * from system to system, in some systems it may not be possible at all. By default there 
     * is no minimum. Failure to play the media object the minimum number of times constitutes 
     * an invalid response.
     */
    minPlays: {
      required: false,
      type: String,
      default: '0'
    },
    /*
     * The max-plays attribute indicates that the media object can be played at most max-plays 
     * times - it must not be possible for the candidate to play the media object more than 
     * max-play times. A value of 0 (the default) indicates that there is no limit.
     */
    maxPlays: {
      required: false,
      type: String,
      default: '0'
    },
    /*
     * The loop attribute is used to set continuous play mode. In continuous play mode, once 
     * the media object has started to play it should play continuously (subject to max-plays).
     */
    loop: {
      required: false,
      type: String,
      default: 'false'
    },
    /*
     * This provides the coordinates that determine the size and location of an area defined 
     * by a corresponding rectange as defined by: left-x, top-y, right-x, bottom-y.
     */
    coords: {
      required: false,
      type: String
    },
    dataMaxPlaysMessage: {
      required: false,
      type: String
    },
    dataMinPlaysMessage: {
      required: false,
      type: String
    }
  },

  data () {
    return {
      response: null,
      state: null,
      isValidResponse: false,
      cardinality: 'single',
      minPlaysMessage: '',
      maxPlaysMessage: '',
      responseDeclaration: null,
      mediaType: 'media',
      isAutostart: false,
      isLoop: false,
      isDisabled: false,
      isQtiValid: true,
      hasPrompts: false,
      /*
       * Reference to the media sub-component
       */
      node: null,
      // If we are restoring, this is where we save the prior variable state
      priorState: null
    }
  },

  methods: {

    /**
     * @description Get this interaction's response.
     * @return {String or Array} response - depending on cardinality
     */
    getResponse () {
      return this.response
    },

    /**
     * @description Set this interaction's response
     * @param {Integer} response - (null or integer)
     */
    setResponse (response) {
      this.response = response
    },

    incrementPlays () {
      let response = this.getResponse()
      this.setResponse((response === null) ? 1 : response+1)
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

    disable () {
      if (this.node === null) return
      this.node.disable()
    },

    enable () {
      if (this.node === null) return
      this.node.enable()
    },

    /**
     * @description Get this interaction's invalid response message.
     * @return {String} minPlaysMessage or custom message
     */
    getInvalidResponseMessage () {
      this.computeMinPlaysMessage()
      return this.minPlaysMessage
    },

    /**
     * @description Reset this interaction's response and UI.
     */
    resetValue () {
      console.log('[ResetValue][identifier]', this.responseIdentifier)

      // When a new template, smoke the priorState
      this.priorState = null
      this.setResponse(null)
      this.setState(this.computeState())
      this.updateValidity(this.computeIsValid())
    },

    /**
     * @description Restores this interaction's response.  Also
     * restores this interaction's response validity.
     * @param {String or Array} response
     */
    restoreValue (response) {
      if (response === null) return

      this.setResponse(response)
      this.setState(this.computeState())
      this.updateValidity(this.computeIsValid())
      
      // Disable the media player if we are at Max Plays
      this.evaluateMaxPlays()
    },

    /**
     * @description Computes this interaction's cardinality: single.
     * @return {String} - cardinality 'single'
     */
    getCardinality () {
      return this.cardinality
    },

    /**
     * @description Iterate through $slots. Finds the first (if any) qti-prompt component.
     * @param {Array} slots
     * @return {Array} prompt component(s)
     */
     getPrompts (slots) {
      let prompts = []

      if (!('default' in slots)) return prompts

      slots.default.forEach((vnode) => {
        // Only check for qti-prompt, skipping text nodes.
        if (typeof vnode.componentOptions !== 'undefined') {
          if (vnode.componentOptions.tag === 'qti-prompt') {
            prompts.push(vnode)
          }
        }
      })

      return prompts
    },

    /**
     * @description Move the first qti-prompt DOM element into the prompt-wrapper
     * in the template.
     */
    movePrompt () {
      if (!this.hasPrompts) return
      // Only select and move the first prompt
      const node = this.$refs.root.querySelector('.qti-prompt')
      if (node !== null) {
        this.$refs.prompt.appendChild(node)
      }
    },

    handleMediaMounted (node) {
      this.node = node.node
      this.mediaType = node.mediaType
      if (node.mediaType === 'audio') {
        this.node.setAudioSubType('audioprogress')
      }
      this.evaluateMaxPlays()
    },

    handleMediaLoaded (node) {
      this.node = node.node
      this.evaluateMaxPlays()
      this.evaluateAutostart()
    },

    handleMediaEnded () {
      this.incrementPlays()
      this.evaluateValidity()
      this.evaluateMaxPlays()
      // Check loop="true"...restart the media if there is 
      // no maxPlays constraint.
      this.evaluateLoop()
    },

    /**
     * @description Return an empty object as we do not track any other 
     * state properties as of 1/5/1023.
     * @return {Object} state object
     */
    computeState () {
      const state = {}
      return state
    },

    /**
     * @description Determines validity status
     * based on the min-plays attribute.
     * @return {Boolean} (true if valid, false if invalid)
     */
    computeIsValid () {
      const minPlaysValue = this.minPlays*1
      // If minPlays is 0, there are no constraints
      if (minPlaysValue === 0) return true

      const response = this.getResponse()

      // A null response is invalid
      if (response === null) return false

      // MinPlays is > 0.  There are constraints.

      // A media interaction that is non-null must have
      // at least minPlays attempts in order to be valid.
      if (response >= minPlaysValue) return true

      // Must be invalid
      return false
    },

    /**
     * @description Evaluate the interaction's response validity.
     * Update the interaction's validity if there is a change.
     */
    evaluateValidity () {
      // Save old validity value
      const priorValidity = this.getIsValid()
      // Compute new validity value
      const currentValidity = this.computeIsValid()
      // Bail if no change
      if (priorValidity === currentValidity) return
      // There is a change.
      this.updateValidity(currentValidity)
    },

    /**
     * @description Update the interaction's validity.
     * @param {Boolean} isValid
     */
    updateValidity (isValid) {
      this.setIsValid(isValid)
      store.setInteractionIsValidResponse({
          identifier: this.responseIdentifier,
          isValidResponse: isValid
        })
    },

    evaluateMaxPlays () {
      if (this.checkMaxPlaysLimit())
        this.disable()
      else
        this.enable()
    },

    evaluateLoop () {
      if (!this.isLoop) return
      if (this.checkMaxPlaysLimit()) return
      if (this.isDisabled) return
      this.playMedia()
    },

    evaluateAutostart () {
      if (!this.isAutostart) return
      if (this.checkMaxPlaysLimit()) return
      if (this.isDisabled) return
      console.log(`[${this.$options.name}][Identifier=${this.responseIdentifier}][AutoStart]`)
      this.playMedia()
    },

    playMedia () {
      if (this.node == null) return
      if (this.mediaType === 'audio') return this.node.playAudio()
      this.node.playVideo()
    },

    /**
     * @description This method should be called prior to playing the video.
     * @return {Boolean} (true if exceeding max-plays, false if not)
     */
    checkMaxPlaysLimit () {
      // max-plays = 0 means no limit.
      if ((this.maxPlays*1) === 0) return false

      const response = this.getResponse()
      if ((response !== null) && (response == (this.maxPlays*1))) {
        // Do not notify.
        //store.NotifyInteractionSelectionsLimit(this.maxPlaysMessage)
        return true
      }

      return false
    },

    computeMaxPlaysMessage () {
      if (typeof this.dataMaxPlaysMessage !== 'undefined') {
        this.maxPlaysMessage = this.dataMaxPlaysMessage
        return
      }

      const numericMaxPlays = this.maxPlays*1
      this.maxPlaysMessage = 
        (numericMaxPlays === 0) 
          ? '' 
          : `You are permitted a maximum of ${this.maxPlays} play${numericMaxPlays > 1 ? 's' : ''} for this ${this.mediaType}.`
    },

    computeMinPlaysMessage () {
      if (typeof this.dataMinPlaysMessage !== 'undefined') {
        this.minPlaysMessage = this.dataMinPlaysMessage
        return
      }

      const numericMinPlays = this.minPlays*1
      this.minPlaysMessage = 
        (numericMinPlays === 0) 
          ? '' 
          : `You must play this ${this.mediaType} to the end at least ${this.minPlays} time${numericMinPlays > 1 ? 's' : ''}.`
    },

    /**
     * @description Basic validation of the children.
     */
    validateChildren () {
      // NOOP
    },

    processChildren () {
      this.processMedia()

      this.setIsValid(this.computeIsValid())

      // Restore priorState - if any
      if (this.priorState !== null) {
        this.restoreValue(this.priorState.value)
      }
    },

    processMedia () {
      // <object> is valid QTI 3, but unsupported in QTI 3 Item Player
      let mediaElement = this.$refs.mediagroup.$el.getElementsByTagName('object')
      if (mediaElement.length !== 0) {
        throw new QtiValidationException('Unsupported Media Interaction element.  The <object> elemnt is deprecated.  Use <video> or <audio> instead.')
      }

      // Sniff for <video> or <audio>
      mediaElement = this.$refs.mediagroup.$el.getElementsByTagName('video')

      if (mediaElement.length === 0) {
        mediaElement = this.$refs.mediagroup.$el.getElementsByTagName('audio')
      }

      if (mediaElement.length !== 1) {
        throw new QtiValidationException('Media Interaction must have exactly one <video> or <audio> node.')
      }
    },

    /**
     * @description Retrieve this interaction's prior state.
     * When not null, has this schema:
     * {
     *   identifier: [String],
     *   value: [String or Array]
     *   state: {
     *     order: [Array of Strings]
     *   }
     * }
     * @param {String} identifier - of a response variable
     * @return {Object} - a prior state or null
     */
    getPriorState (identifier) {
      const priorState = store.getItemContextStateVariable(identifier)

      // If priorState is null, we are not restoring anything
      if (priorState === null) return null

      // Perform basic consistency checking on this priorState
      if (!('value' in priorState)) {
        throw new QtiEvaluationException('Media Interaction State Invalid.  "value" property not found.')
      }
      if (!('state' in priorState)) {
        throw new QtiEvaluationException('Media Interaction State Invalid.  "state" property not found.')
      }

      return priorState
    }
  },

  created () {
    try {
      this.responseDeclaration = qtiAttributeValidation.validateResponseIdentifierAttribute(store, this.responseIdentifier)

      this.validateChildren()

      // Pull any prior interaction state.
      this.priorState = this.getPriorState(this.responseIdentifier)

      qtiAttributeValidation.validateMaxMinPlays(this.maxPlays, this.minPlays)

      this.hasPrompts = (this.getPrompts(this.$slots).length > 0 ? true : false)
      this.isAutostart = (this.autostart === 'true' ? true : false)
      this.isLoop = (this.loop === 'true' ? true : false)

      this.computeMaxPlaysMessage()
    } catch (err) {
      this.isQtiValid = false
      if (err.name === 'QtiValidationException') {
        throw new QtiValidationException(err.message)
      } else if (err.name === 'QtiParseException') {
        throw new QtiParseException(err.message)
      } else {
        throw new Error(err.message)
      }
    }
  },

  mounted () {
    if (this.isQtiValid) {
      try {
        this.movePrompt()

        this.processChildren()

        // Notify store of our new interaction
        store.defineInteraction({
            identifier: this.responseIdentifier,
            interactionType: 'Media',
            node: this,
            resetValue: this.resetValue,
            disable: this.disable,
            isValidResponse: this.getIsValid(),
            invalidResponseMessage: this.getInvalidResponseMessage(),
            maxSelectionsMessage: this.maxPlaysMessage
          })

        console.log('[' + this.$options.name + '][Identifier]', this.responseIdentifier)
      } catch (err) {
        this.isQtiValid = false
        console.log('[' + this.$options.name + '][ValidationError]', err.name, err.message)
        throw new QtiValidationException(err.message)
      }
    }
  }
  
}
</script>

<style>
div.qti-media-interaction {
  display: block;
  padding: 0;
  margin: 0 0 .5rem 0;
}

/* Set width to 100% when there is no qti-width- class override */
div.qti-media-interaction:not[class*=" qti-width-"] {
  width: 100%;
}
</style>
