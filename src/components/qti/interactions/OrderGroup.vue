<template>
  <div ref="root" class="qti-order-interaction-wrapper">
    <ul
      ref="ordergroup"
      class="qti-order-source-wrapper">
      <slot></slot>
    </ul>
  </div>
</template>

<script>
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'
import OrderPresentationFactory from '@/components/qti/interactions/presentation/OrderInteractionPresentationFactory'
import OrderInteractionWidget from '@/components/qti/interactions/widgets/OrderInteractionWidget'

const qtiAttributeValidation = new QtiAttributeValidation()
const qtiProcessing = new QtiProcessing()

export default {

  props: {
    /*
     * Computed by the parent component by examining the parent interaction's response declaration.
     */
    responseIdentifier: {
      required: true,
      type: String
    },
    /*
     * Computed by the parent component by examining the parent interaction's response declaration.
     */
    cardinality: {
      required: true,
      type: String
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
     * Default to horizontal although spec does not specify a default.
     */
    orientation: {
      required: false,
      type: String,
      default: 'horizontal'
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
     * NOT A QTI ATTRIBUTE - Determined by the QtiOrderInteraction component.
     * May be one of 'default' | 'ordermatch'
     */
    interactionSubType: {
      required: true,
      type: String
    },
    /*
     * NOT A QTI ATTRIBUTE
     * Parent QtiOrderInteraction component passed the
     * choice interaction state into this OrderGroup component.
     * Used for re-establishing a prior choice order on shuffled interactions.
     * When not null, has this schema:
     * {
     *   identifier: [String],
     *   value: [Array]
     *   state: {
     *     order: [Array of Strings]
     *   }
     * }
     */
    priorState: {
      required: false,
      type: Object,
      default: null
    }
  },

  data () {
    return {
      choices: [],
      response: null,
      role: null,
      isRadio: null,
      isShuffle: null,
      orderInteractionClassAttribute: null,
      isOrientationVertical: false,
      presentationFactory: null,
      sortable: null,
      isQtiValid: true
    }
  },

  computed: {

    computedMaxChoices () {
      return this.maxChoices*1
    }

  },

  methods: {

    /**
     * @description Get this interaction's response.
     * @return {Array} response, or null if no response
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

    validateChildren () {
      this.$slots.default.forEach((slot) => {
        if (qtiAttributeValidation.isValidSlot(slot)) {
          // Only qti-simple-choice's permitted
          if (slot.componentOptions.tag !== 'qti-simple-choice') {
            throw new QtiValidationException('Node is not a qti-simple-choice: "' + slot.componentOptions.tag + '"')
          }
        }
      })

      // All good.  Save off our children.
      this.processChildren()
    },

    processChildren () {
      this.$children.forEach((node) => {
        this.choices.push(node)
      }, this)
    },

    /**
     * @description Main workhorse method to initialize this Order Group's UI.
     * @param {Array} response - a prior response or null
     */
    processGroupUI (response) {
      const container = this.createContainer(this.choices, this.priorState)
      this.processContainerChoices(container)

      // Other than shuffling, this handles all of the QTI presentation vocab.
      this.presentationFactory.initialize(this.$refs.root, this)

      // Bind to the OrderMatchInteraction widget.
      // 1) handeWidgetReady is called upon completion of instantiation.
      // 2) handleWidgetUpdate is called any time the candidate changes
      //    the order of the choices.
      this.sortable = new OrderInteractionWidget(this.$refs.root, {
        interactionSubType: this.interactionSubType,
        maxChoices: this.computedMaxChoices,
        response: response,
        onReady: this.handleWidgetReady,
        onUpdate: this.handleWidgetUpdate,
        onSelectionsLimit: this.handleSelectionsLimit
      })
    },

    /**
     * @description Utility method used when generating a new template - in
     * which case we unbind the sortable widget and then call processGroupUI
     * all over again.
     */
    resetGroupUI () {
      // Clean up the current sortable
      if (this.sortable === null) return
      // Place any draggers in targets back in their sources
      this.sortable.reset()
      this.sortable = null
      // Reprocess the entire UI
      this.processGroupUI(null)
    },

    /**
     * @description Callback function that is part of the OrderMatchInteraction
     * widget lifecylce when an interaction has completed its initialization.
     * A response is computed and passed in the data parameter.
     * @param {Object} data - object containing a 'response' property
     */
    handleWidgetReady (data) {
      this.setResponse(data.response)

      // Notify parent component that our choices are ready.
      this.$emit('orderGroupReady', {
        choices: this.choices,
        response: this.getResponse()
      })
    },

    /**
     * @description Callback function that is part of the OrderMatchInteraction
     * widget lifecylce.  A response is computed and passed in the data parameter.
     * @param {Object} data - object containing a 'response' property
     */
    handleWidgetUpdate (data) {
      this.setResponse(data.response)

      // Notify parent that we have an update
      this.$emit('orderGroupUpdate', {
          response: this.getResponse()
        })
    },

    handleSelectionsLimit () {
      this.$emit('orderGroupSelectionsLimit')
    },

    /**
     * @description Builds a new dom and choices
     * array from the choices array.
     * @param {Array} container - Array of ordered choices
     */
    processContainerChoices (container) {
      // Clean out the dom and the original choices array
      this.choices.splice(0, this.choices.length)
      this.$refs.ordergroup.innerHTML = ''

      // Rebuild the dom and the choices array
      container.forEach((choice) => {
        this.$refs.ordergroup.appendChild(choice.node.$el)
        this.choices.push(choice.node)
      }, this)
    },

    /**
     * @description This builds an ordered array of choice nodes from
     * a prior state (if one exists) or from the original QTI order.
     * @return {Array} container - Array of choices in the proper order.
     */
    createContainer (choices, priorState) {
      let container = []

      // If priorState is null, create a container of Choices
      // in their QTI order.
      if (priorState === null) {
        choices.forEach((choice) => {
          container.push({
            fixed: (choice.fixed === 'true'),
            node: choice
          })
        })

        if (this.isShuffle) {
          // Shuffle the container in place.
          qtiProcessing.shuffleArrayFixed(container)
        }

        return container
      }

      // priorState is not null...so...
      this.getPriorValue(this.interactionSubType).forEach((identifier) => {
        container.push({
          node: this.findChoiceByIdentifier(identifier, choices)
        })
      }, this)

      return container
    },

    /**
     * @description Utility method for extracting the proper response/value
     * from a prior state.
     * @param {String} subtype - this interaction's subtype
     * @return {Array} response/value
     */
    getPriorValue (subtype) {
      if (this.priorState === null) return []

      // If interactionSubType is 'default'
      // The priotValue property is in priorState.value
      if (subtype === 'default') return this.priorState.value

      // If interactionSubType is 'ordermatch'
      // The priorValue property is in priorState.state.order
      return this.priorState.state.order
    },

    /**
     * @description Utility method for selecting a choice by identifier
     * @param {String} identifier - the identifier of the choice
     * @param {Array} choices - array of qti-simple-choice nodes
     * @return {Component} choice or an exception if not found
     */
    findChoiceByIdentifier (identifier, choices) {
      for (let i = 0; i < choices.length; i++) {
        if (choices[i].$el.getAttribute('data-identifier') === identifier) {
          return choices[i]
        }
      }

      throw new QtiEvaluationException('Order Interaction State Invalid.  Choice identifier "' + identifier + '" not found.')
    },

    initializeOrderGroup () {
      // compute shuffle
      this.isShuffle = (this.shuffle === 'true' ? true : false)
      // compute orientation - default vertical
      this.isOrientationVertical = (this.orientation === 'vertical' ? true : false)
      // Set up a presentation factory
      this.presentationFactory = new OrderPresentationFactory()
    }
  },

  created () {
    try {
      if (typeof this.cardinality === 'undefined') {
        throw new QtiValidationException('Undefined qti-order-interaction cardinality')
      }

      if (this.cardinality !== 'ordered') {
        throw new QtiValidationException('qti-order-interaction cardinality must be "ordered"')
      }

      this.initializeOrderGroup()

    } catch (err) {
      this.isQtiValid = false
      console.log('[QtiOrderInteraction][ValidationError]', err.name, err.message)
      throw new QtiValidationException(err.message)
    }
  },

  mounted () {
    if (this.isQtiValid) {
      try {
        // Get a handle on the parent interaction.
        // Use this to inspect the parent's class attribute.
        this.orderInteractionClassAttribute = this.$parent.$refs.root.classList

        // Validate and process the prompt (if any) and the choices.
        this.validateChildren()

        // Build a UI - triggers an 'orderGroupReady' event upon completion.
        this.processGroupUI(this.priorState === null ? null : this.priorState.value)
      } catch (err) {
        this.isQtiValid = false
        if (err.name === 'QtiValidationException') {
          console.log('[QtiOrderInteraction][ValidationException]', err.message)
          throw new QtiValidationException(err.message)
        } else if (err.name === 'QtiEvaluationException') {
          console.log('[QtiOrderInteraction][EvaluationException]', err.message)
          throw new QtiEvaluationException(err.message)
        }
      }
    }
  },

  beforeDestroy () {
    this.sortable.destroy()
    this.sortable = null
  }
}
</script>

<style>
.qti-order-interaction-wrapper {
  margin: .75rem auto;
}

ul.qti-order-source-wrapper {
  list-style: none;
  display: inline-block;
  margin: .5rem auto;
  padding: 0;
  width: 100%;
  min-height: 3rem;
  text-align: center;
  border: 1px solid;
  border-color: var(--background);
  border-radius: .25rem;
}

ul.qti-order-source-wrapper.qti-choices-left {
  float: left;
  width: 50%;
  padding: 0 1rem;
}

ul.qti-order-source-wrapper.qti-choices-right {
  float: right;
  width: 50%;
  padding: 0 1rem;
}

ul.qti-order-source-wrapper.target-active {
  background-color: var(--well-bg);
  border: 1px dashed;
  border-color: var(--ea-button-secondary-bgc);
}

ul.qti-order-source-wrapper.qti-choices-inline > li.source {
  display: inline-block;
  padding: .75rem .25rem;
  margin: 0 .15rem .15rem;
  vertical-align: top;
}

/* Hide sources when not containing a dragger */
ul.qti-order-source-wrapper.qti-choices-left > li.source,
ul.qti-order-source-wrapper.qti-choices-right > li.source,
ul.qti-order-source-wrapper.qti-choices-top > li.source,
ul.qti-order-source-wrapper.qti-choices-bottom > li.source {
  display: none;
}

ul.qti-order-source-wrapper > li.source.full {
  display: inline-block;
  padding: .75rem .25rem;
  margin: 0 .15rem .15rem;
  vertical-align: top;
}

ul.qti-order-source-wrapper.qti-choices-left > li.source,
ul.qti-order-source-wrapper.qti-choices-right > li.source {
  padding: .25rem;
}

ul.qti-order-source-wrapper.qti-orientation-vertical > li.source {
  width: 60%;
  padding: .25rem;
}

ul.qti-order-target-wrapper {
  list-style: none;
  display: inline-block;
  margin: .5rem auto;
  padding: 0;
  text-align: center;
  width: 100%;
}

ul.qti-order-target-wrapper.qti-choices-left,
ul.qti-order-target-wrapper.qti-choices-right {
  margin: .75rem auto;
  width: 50%;
}

ul.qti-order-target-wrapper > li.target {
  display: inline-block;
  padding: .25rem .25rem;
  margin: 0 .15rem .25rem;
  vertical-align: top;
  text-decoration: none;
  font-weight: bold;
  color: var(--foreground);
  background: var(--well-bg);
  border: 1px solid var(--ea-button-secondary-bgc);
  -webkit-border-radius: .25rem;
  -moz-border-radius: .25rem;
  border-radius: .25rem;
  min-height: 5.5rem;
  width: 150px;
}

/* Add a little more padding on qti-labels-none, smaller min-height */
ul.qti-order-target-wrapper > li.target.qti-labels-none {
  padding: .5rem .25rem;
  min-height: 3.5rem;
}

ul.qti-order-target-wrapper > li.target.target-active {
  color: var(--order-target-active-color);
  background-color: var(--order-target-active-bgc);
  border: 1px dashed var(--ea-button-secondary-bgc);
}

ul.qti-order-target-wrapper > li.target.target-active.active {
  color: var(--order-target-active-color);
  background-color: var(--order-placeholder-color);
  border: 1px dashed var(--ea-button-secondary-bgc);
}

ul.qti-order-target-wrapper > li.target.full > .draggable {
  cursor: move;
  width: 100%;
  /* Make sure long draggables wrap and fit in the target */
  overflow-wrap: break-word;
  margin: 0;
}

ul.qti-order-target-wrapper.qti-orientation-vertical > li.target {
  width: 65%;
}

.draggable.dragging {
  position: fixed;
  left: 0;
  top: 0;
  will-change: transform;
  z-index: 1;
}

.dragger-placeholder {
  border: 1px solid var(--order-placeholder-color);
  background-color: var(--order-placeholder-color);
  border-radius: .25rem;
}

.target-label {
  display: inline-block;
  line-height: 1.6rem;
  text-align: center;
  margin: 0 0 .5rem;
}
</style>
