<template>
  <div ref="root" class="qti-match-interaction">

    <slot name="prompt" />

    <MatchGroup
      ref="matchgroup"
      :cardinality="cardinality"
      :shuffle="shuffle"
      :responseIdentifier="responseIdentifier"
      :maxAssociations="maxAssociations"
      :minAssociations="minAssociations"
      :interactionSubType="interactionSubType"
      :matchInteractionStaticClass="matchInteractionStaticClass"
      :headerHidden="headerHidden"
      :rowCentric="rowCentric"
      :dataFirstColumnHeader="dataFirstColumnHeader"
      :priorState="priorState"
      v-on:matchGroupReady="handleMatchGroupReady"
      @matchGroupUpdate="handleMatchGroupUpdate"
      @matchGroupAssociationsLimit="handleAssociationsLimit"
      v-bind="$attrs">
      <slot name="default" />
    </MatchGroup>
  </div>
</template>

<script>
/*
 * A match interaction is a blockInteraction that presents candidates with two sets of choices 
 * and allows them to create associates between pairs of choices in the two sets, but not between 
 * pairs of choices in the same set. Further restrictions can still be placed on the allowable 
 * associations using the match-max characteristic of the choices. The matchInteraction must be 
 * bound to a response variable with base-type 'directedPair' and either single or multiple cardinality.
 */
import Vue from 'vue'
import { store } from '@/store/store'
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiParseException from '@/components/qti/exceptions/QtiParseException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiPrompt from '@/components/qti/interactions/QtiPrompt'
import MatchGroup from '@/components/qti/interactions/MatchGroup'
import QtiSimpleMatchSet from '@/components/qti/interactions/QtiSimpleMatchSet'

Vue.component('qti-prompt', QtiPrompt)
Vue.component('MatchGroup', MatchGroup)
Vue.component('qti-simple-match-set', QtiSimpleMatchSet)

const qtiAttributeValidation = new QtiAttributeValidation()

export default {
  name: 'QtiMatchInteraction',

  props: {
    responseIdentifier: {
      required: true,
      type: String
    },
    /*
     * The minimum number of associations that the candidate is required to make to 
     * form a valid response. If min-associations is 0 then the candidate is not required 
     * to make any associations. min-associations must be less than or equal to the limit 
     * imposed by max-associations.
     */
    minAssociations: {
      required: false,
      type: String,
      default: '0'
    },
    /*
     * The maximum number of associations that the candidate is allowed to make. 
     * If max-associations is 0 then there is no restriction. If max-associations is 
     * greater than 1 (or 0) then the interaction must be bound to a response with 
     * multiple cardinality.
     */
    maxAssociations: {
      required: false,
      type: String,
      default: '1'
    },
    /*
     * If the shuffle characteristic is true then the delivery engine must randomize the order in which
     * the choices are initially presented, subject to the value of the fixed attribute of each choice.
     */
    shuffle: {
      required: false,
      type: String,
      default: 'false'
    },
    dataMaxSelectionsMessage: {
      required: false,
      type: String
    },
    dataMinSelectionsMessage: {
      required: false,
      type: String
    },
    /*
     * When qti-match-tabular presentation, the custom text to be rendered in the top-left header cell 
     * of the table (headings must be visible).
     */
    dataFirstColumnHeader: {
      required: false,
      type: String,
      default: null
    }
  },

  inheritAttrs: false,

  data () {
    return {
      response: null,
      state: null,
      isValidResponse: false,
      matchsets: [],
      orders: [],
      cardinality: 'single',
      minSelectionsMessage: '',
      maxSelectionsMessage: '',
      responseDeclaration: null,
      matchInteractionStaticClass: '',
      /*
       * May be one of 'default' | 'matchtabular'
       */
      interactionSubType: 'default',
      /*
       * For certain presentations, it can be advantageous to hide the column headers.  This class enables this presentation.  
       * Do not display the top row of the table where the column headers are displayed.
       */
      headerHidden: 'false',
      /*
       * NOT QTI SHARED INTERACTION VOCAB
       * When matchtabular subtype, rowCentric = true is used to invert the table's row and column headers.
       * When rowCentric = false (the default), the targets are displayed as column headers and the sources
       * are displayed as row headers.
       */
      rowCentric: 'false',
      isQtiValid: true,
      // If we are restoring, this is where we save the prior variable state
      priorState: null
    }
  },

  methods: {

    /**
     * @description Get this interaction's response.
     * @return {Array} response
     */
    getResponse () {
      return this.response
    },

    /**
     * @description Set this interaction's response
     * @param {Array} response -  containing choice identifiers.
     */
    setResponse (response) {
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

    setInteractionSubType (interactionSubType) {
      this.interactionSubType = interactionSubType
    },

    getInteractionSubType () {
      return this.interactionSubType
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
     * @return {String} minSelectionsMessage or custom message
     */
    getInvalidResponseMessage () {
      return this.minSelectionsMessage
    },

    disable () {
      this.$refs.matchgroup.disable()      
    },

    enable () {
      this.$refs.matchgroup.enable()
    },

    /**
     * @description Method to initialize this interaction's response, state,
     * and validity. This method is called upon receipt of an 'matchGroupReady'
     * event.
     * @param {Array} response
     */
    initializeValue (response) {
      this.setResponse(response)
      this.setState(this.computeState())
      this.updateValidity(this.computeIsValid())
    },

    /**
     * @description Reset this interaction's response and UI.  Typically, this
     * method is called when a new template is generated.
     */
    resetValue () {
      console.log('[ResetValue][identifier]', this.responseIdentifier)

      // Reset the response, state, priorState
      this.setResponse(null)
      this.setState(null)
      this.priorState = null

      // Call the MatchGroup component to rebuild the UI.
      // After the MatchGroup is rebuilt (it will be 'ready'), which triggers
      // the 'matchGroupReady' event, which in turn completes the
      // initialization process. See the handleMatchGroupReady method.
      this.$refs.matchgroup.resetGroupUI()
    },

    /**
     * @description Restores this interaction's response.  Also
     * restores this interaction's response validity.
     * @param {Array} response
     */
    restoreValue (response) {
      this.setResponse(response)
      this.setState(this.computeState())
      this.updateValidity(this.computeIsValid())
    },

    /**
     * @description Computes this interaction's cardinality (ordered).
     * Side effect: sets the model's cardinality property.
     * @return {String} - cardinality 'ordered'
     */
    getCardinality () {
      let rv = store.getResponseDeclaration(this.responseIdentifier)
      // Default to ordered if the response variable is not found
      this.cardinality = (typeof rv !== 'undefined' ? rv.cardinality : 'single')
      return this.cardinality
    },

    /**
     * @description Iterate through $slots. Finds the first (if any) qti-prompt component.
     * @param {Array} slots
     * @return {Array} prompt component(s)
     */
    getPrompt (slots) {
      let prompt = []

      if (!('default' in slots)) return prompt

      slots.default.forEach((vnode, index, defaultSlots) => {
        // Only check for qti-prompt, skipping text nodes.
        if (typeof vnode.componentOptions !== 'undefined') {
          if (vnode.componentOptions.tag === 'qti-prompt') {
            prompt.push(vnode)
            defaultSlots.splice(index, 1)
            return // bail out of loop
          }
        }
      })

      return prompt
    },

    /**
     * @description Handler called by MatchGroup component.
     * @param {Object} data - an object containing all matchset components
     *                          nested within the MatchGroup, plus a response.
     */
    handleMatchGroupReady (data) {
      this.matchsets = data.matchsets
      this.orders = data.orders
      this.initializeValue(data.response)
    },

    /**
     * @description Handler for when the MatchGroup component has an update.
     * @param {Object} data
     */
    handleMatchGroupUpdate (data) {
      this.setResponse(data.response)
      this.updateValidity(this.computeIsValid())
    },

    handleAssociationsLimit () {
      store.NotifyInteractionSelectionsLimit(this.maxSelectionsMessage)
    },

    /**
     * @description Compute a state object.
     * @return {Object} state object
     */
    computeState () {
      if (this.priorState !== null) return this.priorState.state

      // The state (orders) is the order of the choices in the matchsets
      const state = {
        orders: this.orders
      }

      return state
    },

    /**
     * @description This determines an interaction's validity status based
     * on the min-associations attribute.
     * @return {Boolean} (true if valid, false if invalid)
     */
    computeIsValid () {
      const response = this.getResponse()
      const minRequired = this.minAssociations*1

      if (minRequired === 0) return true

      if (response === null) return false

      // Response is not null, so cardinality single implies valid=true
      if (this.cardinality === 'single') return true

      // When cardinality is multiple, compare response length to minRequired
      if (response.length >= minRequired) return true

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
     * @description Update the interaction's validity in this component
     * and in the store.
     * @param {Boolean} isValid
     */
    updateValidity (isValid) {
      this.setIsValid(isValid)
      store.setInteractionIsValidResponse({
          identifier: this.responseIdentifier,
          isValidResponse: isValid
        })
    },

    computeMaxSelectionsMessage () {
      if (typeof this.dataMaxSelectionsMessage !== 'undefined') {
        this.maxSelectionsMessage = this.dataMaxSelectionsMessage
        return
      }
      this.maxSelectionsMessage = (this.maxAssociations*1 == 0) ? '' : 'You may make a maximum of ' + this.maxAssociations + ' match' + (this.maxAssociations*1 > 1 ? 'es' : '') + ' for this question.'
    },

    computeMinSelectionsMessage () {
      if (typeof this.dataMinSelectionsMessage !== 'undefined') {
        this.minSelectionsMessage = this.dataMinSelectionsMessage
        return
      }

      if ((this.minAssociations*1) != 0) {
        this.minSelectionsMessage = 'You must make at least ' + this.minAssociations + ' match' + (this.minAssociations*1 > 1 ? 'es' : '') + ' for this question.'
      }
    },

    /**
     * @description attempt to parse the interaction component
     * from the staticClass property of this $vnode.
     * @param staticClass property of the $vnode.data object
     */
    detectInteractionSubType (staticClass) {
      return this.getMatchInteractionSubType(staticClass)
    },

    /**
     * @description Order interactions have a considerable amount of shared
     * vocabulary that is expressed via the interaction's class attribute.
     * This determines whether nor not the interaction has choices separated
     * from targets.
     * @param {String} clazz - the interaction's class attribute
     * @return {String} one of 'default' | 'matchtabular'
     */
    getMatchInteractionSubType (clazz) {
      let subtype = 'default'

      if ((typeof clazz === 'undefined') || (clazz === null) || (clazz.length == 0)) {
        return subtype
      }

      this.matchInteractionStaticClass = clazz

      // Return the first supported subtype we find.
      const clazzTokens = clazz.split(' ')
      for (let index = 0; index < clazzTokens.length; index++) {
        switch (clazzTokens[index]) {
          case 'qti-match-tabular':
            subtype = 'matchtabular'
            break
          case 'qti-header-hidden':
            this.headerHidden = 'true'
            break
          case 'row-centric':
            this.rowCentric = 'true'
            break
          default:
        }
      }

      return subtype
    },

    /**
     * @description Retrieve this interaction's prior state.
     * When not null, has this schema:
     * {
     *   identifier: [String],
     *   value: [String or Array]
     *   state: {
     *     orders: [
     *       [MatchSet Order0 Array of Identifiers],
     *       [MatchSet Order1 Array of Identifiers]
     *     ]
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
        throw new QtiEvaluationException('Match Interaction State Invalid.  "value" property not found.')
      }
      if (!('state' in priorState)) {
        throw new QtiEvaluationException('Match Interaction State Invalid.  "state" property not found.')
      }
      if (!('orders' in priorState.state)) {
        throw new QtiEvaluationException('Match Interaction State Invalid.  "orders" property not found.')
      }

      return priorState
    }
  },

  created () {
    try {
      this.responseDeclaration = qtiAttributeValidation.validateResponseIdentifierAttribute(store, this.responseIdentifier)
      this.setInteractionSubType(this.detectInteractionSubType(this.$vnode.data.staticClass))

      // Pull any prior interaction state.
      this.priorState = this.getPriorState(this.responseIdentifier)

      this.cardinality = this.getCardinality()
      if ((this.cardinality !== 'single') && (this.cardinality !== 'multiple')) {
        throw new QtiValidationException('qti-match-interaction cardinality must be "single" or "multiple"')
      }

      if (((this.maxAssociations*1) != 1) && (this.cardinality !== 'multiple')) {
        throw new QtiValidationException('qti-match-interaction response variable must have "multiple" cardinality because max-associations is ' + this.maxAssociations)
      }

      if (((this.minAssociations*1) > 1) && (this.cardinality === 'single')) {
        throw new QtiValidationException('qti-match-interaction response variable must have "multiple" cardinality because min-associations is ' + this.minAssociations)
      }

      this.$slots.prompt = this.getPrompt(this.$slots)
      this.computeMinSelectionsMessage()
      this.computeMaxSelectionsMessage()
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

        // Notify store of our new interaction
        store.defineInteraction({
            identifier: this.responseIdentifier,
            interactionType: 'Match',
            interactionSubType: this.interactionSubType,
            node: this,
            resetValue: this.resetValue,
            isValidResponse: this.getIsValid(),
            invalidResponseMessage: this.getInvalidResponseMessage(),
            maxSelectionsMessage: this.maxSelectionsMessage
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
