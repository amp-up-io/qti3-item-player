<template>
  <div ref="root" class="qti-order-interaction">

    <slot name="prompt" />

    <OrderGroup
      ref="ordergroup"
      :cardinality="cardinality"
      :shuffle="shuffle"
      :responseIdentifier="responseIdentifier"
      :orientation="orientation"
      :maxChoices="maxChoices"
      :minChoices="minChoices"
      :interactionSubType="interactionSubType"
      :dataChoicesContainerWidth="dataChoicesContainerWidth"
      :priorState="priorState"
      @orderGroupReady="handleOrderGroupReady"
      @orderGroupUpdate="handleOrderGroupUpdate"
      @orderGroupSelectionsLimit="handleSelectionsLimit"
      v-bind="$attrs">
      <slot name="default" />
    </OrderGroup>
  </div>
</template>

<script>
/*
 * In an Order Interaction the candidate's task is to reorder the choices,
 * the order in which the choices are displayed initially is significant.
 * By default the candidate's task is to order all of the choices but a
 * subset of the choices can be requested using the maxChoices and minChoices
 * attributes. When specified the candidate must select a subset of the
 * choices and impose an ordering on them.
 */
import Vue from 'vue'
import { store } from '@/store/store'
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiParseException from '@/components/qti/exceptions/QtiParseException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiPrompt from '@/components/qti/interactions/QtiPrompt'
import QtiSimpleChoice from '@/components/qti/interactions/QtiSimpleChoice'
import OrderGroup from '@/components/qti/interactions/OrderGroup'

Vue.component('qti-prompt', QtiPrompt)
Vue.component('qti-simple-choice', QtiSimpleChoice)
Vue.component('OrderGroup', OrderGroup)

const qtiAttributeValidation = new QtiAttributeValidation()

export default {
  name: 'QtiOrderInteraction',

  props: {
    responseIdentifier: {
      required: true,
      type: String
    },
    /*
     * The minimum number of choices that the candidate must select and order
     * to form a valid response to the interaction. If specified, minChoices
     * must be '1' or greater but must not exceed the number of choices available.
     * If unspecified, all of the choices must be ordered and maxChoices is ignored.
     */
    minChoices: {
      required: false,
      type: String,
      default: '0'
    },
    /*
     * The maximum number of choices that the candidate may select and order
     * when responding to the interaction. Used in conjunction with minChoices,
     * if specified, maxChoices must be greater than or equal to minChoices
     * and must not exceed the number of choices available. If unspecified,
     * all of the choices may be ordered.
     */
    maxChoices: {
      required: false,
      type: String,
      default: '0'
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
    /*
     * Default to vertical although spec does not specify a default.
     */
    orientation: {
      required: false,
      type: String,
      default: 'horizontal'
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
     * The choices container width in pixels. Example: data-choices-container-width="100"
     */
    dataChoicesContainerWidth: {
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
      cardinality: 'ordered',
      minSelectionsMessage: '',
      maxSelectionsMessage: '',
      responseDeclaration: null,
      /*
       * May be one of 'default' | 'ordermatch'
       */
      interactionSubType: 'default',
      choices: [],
      isShuffle: false,
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

    /**
     * @description Method to initialize this interaction's response, state,
     * and validity. This method is called upon receipt of an 'orderGroupReady'
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

      // Call the OrderGroup component to rebuild the UI.
      // After the OrderGroup is rebuilt (it will be 'ready'), which triggers
      // the 'orderGroupReady' event, which in turn completes the
      // initialization process. See the handleOrderGroupReady method.
      this.$refs.ordergroup.resetGroupUI()
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
      this.cardinality = (typeof rv !== 'undefined' ? rv.cardinality : 'ordered')
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
     * @description Handler called by OrderGroup component.
     * @param {Object} data - an object containing all choice components
     *                          nested within the ChoiceGroup, plus a response.
     */
    handleOrderGroupReady (data) {
      this.choices = data.choices
      this.initializeValue(data.response)
    },

    /**
     * @description Handler for when the OrderGroup component has an update.
     * @param {Object} data
     */
    handleOrderGroupUpdate (data) {
      this.setResponse(data.response)
      this.updateValidity(this.computeIsValid())
    },

    handleSelectionsLimit () {
      store.NotifyInteractionSelectionsLimit(this.maxSelectionsMessage)
    },

    /**
     * @description Build a response from the array of choices.
     * Response is an array of identifier strings
     * @return {Array} response
     */
    computeResponse () {
      let response = []

      this.choices.forEach((choice) => {
        response.push(choice.identifier)
      })

      return response
    },

    /**
     * @description Compute a state object.
     * @return {Object} state object
     */
    computeState () {
      if (this.priorState !== null) return this.priorState.state

      // The state (order) is the order of the choices
      const state = {
        order: this.computeResponse()
      }

      return state
    },

    /**
     * @description This determines an interaction's validity status based
     * on the min-choices attribute.
     * @return {Boolean} (true if valid, false if invalid)
     */
    computeIsValid () {
      const state = this.getState()
      const response = this.getResponse()
      const minRequired = this.minChoices*1

      // First, completely null responses are not valid.
      if (response === null) return false

      // Second, do a sanity check on the response by comparing
      // the response length to the original order length.
      if (response.length != state.order.length) return false

      let changeCount = 0

      // Depending on the interactionSubType, we count changes differently.
      switch (this.interactionSubType) {
        case 'default':
          // Compare state.order vs current response order
          for (let i = 0; i < response.length; i++) {
            // If state.order and response do not match then increment count
            if (response[i] !== state.order[i]) {
              changeCount += 1
            }
          }

          // minChoices is not explicitly specified.
          if (minRequired === 0) {
            if (changeCount > 0) return true
            return false
          }

          // minChoices is explicitly specified.
          if (changeCount >= minRequired) return true
          return false

        case 'ordermatch':
          // Look for any response elements that are not null
          for (let i = 0; i < response.length; i++) {
            if (response[i] !== null) {
              changeCount += 1
            }
          }

          // minChoices is not explicitly specified.
          if (minRequired === 0) {
            if (changeCount === response.length) return true
            return false
          }

          if (changeCount >= minRequired) return true
          return false

      }

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
      this.maxSelectionsMessage = (this.maxChoices == 0) ? '' : 'You may set an order for a maximum of ' + this.maxChoices + ' choice' + (this.maxChoices > 1 ? 's' : '') + ' for this question.'
    },

    computeMinSelectionsMessage () {
      if (typeof this.dataMinSelectionsMessage !== 'undefined') {
        this.minSelectionsMessage = this.dataMinSelectionsMessage
        return
      }

      // With default, we are ordering choices in place.  In this case,
      // when minChoices is unspecified, we look for at least one change.
      if (this.interactionSubType === 'default') {
        // minChoices is not explicitly specified.
        if ((this.minChoices*1) == 0) {
          this.minSelectionsMessage = 'You must set the order for at least 1 choice for this question.'
        } else {
          this.minSelectionsMessage = 'You must set the order for at least ' + this.minChoices + ' choice' + (this.minChoices > 1 ? 's' : '') + ' for this question.'
        }
      } else if (this.interactionSubType === 'ordermatch') {
        // minChoices is not explicitly specified.
        if ((this.minChoices*1) == 0) {
          this.minSelectionsMessage = 'You must set the order for all choices for this question.'
        } else {
          this.minSelectionsMessage = 'You must set the order for at least ' + this.minChoices + ' choice' + (this.minChoices > 1 ? 's' : '') + ' for this question.'
        }
      }
    },

    /**
     * @description attempt to parse the interaction component
     * from the staticClass property of this $vnode.
     * @param staticClass property of the $vnode.data object
     */
    detectInteractionSubType (staticClass) {
      return this.getOrderInteractionSubType(staticClass)
    },

    /**
     * @description Order interactions have a considerable amount of shared
     * vocabulary that is expressed via the interaction's class attribute.
     * This determines whether nor not the interaction has choices separated
     * from targets.
     * @param {String} clazz - the interaction's class attribute
     * @return {String} one of 'default' | 'ordermatch'
     */
    getOrderInteractionSubType (clazz) {
      if ((typeof clazz === 'undefined') || (clazz === null) || (clazz.length == 0)) {
        return 'default'
      }

      // Return the first supported subtype we find.
      const clazzTokens = clazz.split(' ')
      for (let index = 0; index < clazzTokens.length; index++) {
        switch (clazzTokens[index]) {
          case 'qti-choices-top':
          case 'qti-choices-bottom':
          case 'qti-choices-left':
          case 'qti-choices-right':
            return 'ordermatch'
          default:
        }
      }

      return 'default'
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
        throw new QtiEvaluationException('Order Interaction State Invalid.  "value" property not found.')
      }
      if (!('state' in priorState)) {
        throw new QtiEvaluationException('Order Interaction State Invalid.  "state" property not found.')
      }
      if (!('order' in priorState.state)) {
        throw new QtiEvaluationException('Order Interaction State Invalid.  "order" property not found.')
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
      if (this.cardinality !== 'ordered') {
        throw new QtiValidationException('qti-order-interaction cardinality must be "ordered"')
      }

      this.isShuffle = (this.shuffle === 'true' ? true : false)
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
            interactionType: 'Order',
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
