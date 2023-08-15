<template>
  <div 
    ref="root" 
    class="qti-match-group-wrapper">
    <slot></slot>
  </div>
</template>

<script>
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import MatchPresentationFactory from '@/components/qti/interactions/presentation/MatchInteractionPresentationFactory'
import MatchInteractionWidget from '@/components/qti/interactions/widgets/MatchInteractionWidget'

const qtiAttributeValidation = new QtiAttributeValidation()

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
     * The maximum number of choices that the candidate may select and order
     * when responding to the interaction. Used in conjunction with minChoices,
     * if specified, maxChoices must be greater than or equal to minChoices
     * and must not exceed the number of choices available. If unspecified,
     * all of the choices may be ordered.
     */
    maxAssociations: {
      required: false,
      type: String,
      default: '0'
    },
    /*
     * The minimum number of associations that the candidate is required to make to form a valid response. 
     * If min-associations is 0 then the candidate is not required to make any associations. min-associations 
     * must be less than or equal to the limit imposed by max-associations.
     */
    minAssociations: {
      required: false,
      type: String,
      default: '0'
    },
    /*
     * NOT A QTI ATTRIBUTE - Determined by the QtiMatchInteraction component.
     * May be one of 'default' | 'matchtabular'
     */
    interactionSubType: {
      required: false,
      type: String,
      default: 'default'
    },
    /*
     * NOT A QTI ATTRIBUTE
     */
    matchInteractionStaticClass: {
      required: false,
      type: String,
      default: ''
    },
    /*
     * When matchtabular subtype, the custom text to be rendered in the top-left header cell 
     * of the table (headings must be visible).
     */
    dataFirstColumnHeader: {
      required: false,
      type: String,
      default: ''
    },
    /*
     * NOT A QTI ATTRIBUTE
     * Parent QtiMatchInteraction component passed the
     * interaction state into this MatchGroup component.
     * Used for re-establishing a prior choice order on shuffled interactions.
     * When not null, has this schema:
     * {
     *   identifier: [String],
     *   value: [directedPair, or Array of directedPairs, depending on cardinality]
     *   state: {
     *     orders: [
     *       [Array of Identifiers],
     *       [Array of Identifiers]
     *     ]
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
      matchsets: [],
      orders: [],
      response: null,
      isShuffle: null,
      matchInteractionClassAttribute: null,
      presentationFactory: null,
      matchable: null,
      isQtiValid: true
    }
  },

  computed: {

    computedMaxAssociations () {
      return this.maxAssociations*1
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
     * @param {Array} response - null if no response
     */
    setResponse (response) {
      this.response = response
    },

    validateChildren () {
      let matchSetCount = 0

      this.$slots.default.forEach((slot) => {
        if (qtiAttributeValidation.isValidSlot(slot)) {
          // Only qti-simple-match-set's permitted
          if (slot.componentOptions.tag !== 'qti-simple-match-set') {
            throw new QtiValidationException('Node is not a qti-simple-match-set: "' + slot.componentOptions.tag + '"')
          } else {
            matchSetCount += 1
          }
        }
      })

      if (matchSetCount != 2) {
        throw new QtiValidationException('qti-match-interaction must contain exactly 2 qti-simple-match-sets.  Found: ' + matchSetCount)        
      }

      // All good.  Save off our children.
      this.processChildren()
    },

    processChildren () {
      this.$children.forEach((node) => {
        // Stamp shuffle onto the matchset node
        node.setIsShuffle(this.isShuffle)
        this.matchsets.push(node)
      }, this)
    },

    /**
     * @description Main workhorse method to initialize this Match Group's UI.
     * @param {Array} response - a prior response or null
     */
    processGroupUI (response) {
      let container0 = this.matchsets[0].createContainer(this.priorState, 0)
      this.matchsets[0].processContainerChoices(container0)
      
      let container1 = this.matchsets[1].createContainer(this.priorState, 1)
      this.matchsets[1].processContainerChoices(container1)

      this.saveContainerOrders(container0, container1)

      // Other than shuffling, this handles all of the QTI presentation vocab.
      this.presentationFactory.initialize(this.interactionSubType, this.$refs.root, this, this.matchsets[0], this.matchsets[1])

      // Bind to the MatchInteraction widget.
      // 1) handeWidgetReady is called upon completion of instantiation.
      // 2) handleWidgetUpdate is called any time the candidate changes
      //    the matching of the choices.
      this.matchable = new MatchInteractionWidget(this.$refs.root, {
        interactionSubType: this.interactionSubType,
        cardinality: this.cardinality,
        maxAssociations: this.computedMaxAssociations,
        response: response,
        onReady: this.handleWidgetReady,
        onUpdate: this.handleWidgetUpdate,
        onAssociationsLimit: this.handleAssociationsLimit
      })
    },

    saveContainerOrders (container0, container1) {
      const order0 = []
      container0.forEach((choice) => {
        order0.push(choice.node.identifier)
      })

      const order1 = []
      container1.forEach((choice) => {
        order1.push(choice.node.identifier)
      })

      this.orders = [ order0, order1 ]
    },

    /**
     * @description Utility method used when generating a new template - in
     * which case we unbind the sortable widget and then call processGroupUI
     * all over again.
     */
    resetGroupUI () {
      // Reprocess the entire UI
      this.processGroupUI(null)
    },

    /**
     * @description Callback function that is part of the MatchInteraction
     * widget lifecycle when an interaction has completed its initialization.
     * A response is computed and passed in the data parameter.
     * @param {Object} data - object containing a 'response' property
     */
     handleWidgetReady (data) {
      this.setResponse(data.response)

      // Important: Notify parent qti-match-interaction component
      // that our qti-simple-match-sets are ready
      this.$emit('matchGroupReady', {
        response: this.getResponse(),
        matchsets: this.matchsets,
        orders: this.orders
      })
    },

    /**
     * @description Callback function that is part of the MatchInteraction
     * widget lifecylce.  A response is computed and passed in the data parameter.
     * @param {Object} data - object containing a 'response' property
     */
    handleWidgetUpdate (data) {
      this.setResponse(data.response)

      // Notify parent that we have an update
      this.$emit('matchGroupUpdate', {
          response: this.getResponse()
        })
    },

    handleAssociationsLimit () {
      this.$emit('matchGroupAssociationsLimit')
    },

    initializeMatchGroup () {
      // Set up a presentation factory
      this.presentationFactory = new MatchPresentationFactory()
    }
  },

  created () {
    try {
      if (typeof this.cardinality === 'undefined') {
        throw new QtiValidationException('Undefined qti-match-interaction cardinality')
      }

      if ((this.cardinality !== 'single') && (this.cardinality !== 'multiple')) {
        throw new QtiValidationException('qti-match-interaction cardinality must be "single" or "multiple"')
      }

      this.isShuffle = this.shuffle === 'true' ? true : false
      this.initializeMatchGroup()
    } catch (err) {
      this.isQtiValid = false
      console.log('[QtiMatchInteraction][ValidationError]', err.name, err.message)
      throw new QtiValidationException(err.message)
    }
  },

  mounted () {
    if (this.isQtiValid) {
      try {
        // Validate and process the qti-simple-match-sets
        this.validateChildren()

        // Build a UI - triggers a 'matchGroupReady' event upon completion.
        this.processGroupUI(this.priorState === null ? null : this.priorState.value)
      } catch (err) {
        this.isQtiValid = false
        if (err.name === 'QtiValidationException') {
          console.log('[QtiMatchInteraction][ValidationException]', err.message)
          throw new QtiValidationException(err.message)
        } else if (err.name === 'QtiEvaluationException') {
          console.log('[QtiMatchInteraction][EvaluationException]', err.message)
          throw new QtiEvaluationException(err.message)
        }
      }
    }
  }
}
</script>

<style>
.qti-match-interaction-wrapper {
  margin: .75rem 0;
}

ul.qti-match-source-wrapper {
  list-style: none;
  margin: 1rem auto;
  padding: 0;
  width: 100%;
  text-align: center;
  border: 1px solid;
  border-color: var(--background);
  border-radius: .25rem;
}

ul.qti-match-source-wrapper.qti-choices-left {
  float: left;
  width: 50%;
  padding: 0 1rem;
}

ul.qti-match-source-wrapper.qti-choices-right {
  float: right;
  width: 50%;
  padding: 0 1rem;
}

ul.qti-match-source-wrapper.qti-choices-top,
ul.qti-match-source-wrapper.qti-choices-bottom {
  display: block;
  min-height: 4.15rem;
}

ul.qti-match-source-wrapper.target-active {
  background-color: var(--well-bg);
  border: 1px dashed;
  border-color: var(--ea-button-secondary-bgc);
}

/* Hide sources when not containing a dragger */
ul.qti-match-source-wrapper.qti-choices-left > li.source,
ul.qti-match-source-wrapper.qti-choices-right > li.source,
ul.qti-match-source-wrapper.qti-choices-top > li.source,
ul.qti-match-source-wrapper.qti-choices-bottom > li.source {
  display: none;
}

ul.qti-match-source-wrapper > li.source.full {
    display: inline-block;
    padding: .75rem .25rem;
    margin: 0 .15rem .15rem;
    vertical-align: top;
}

ul.qti-match-source-wrapper.qti-choices-left > li.source,
ul.qti-match-source-wrapper.qti-choices-right > li.source {
  padding: .25rem;
}

ul.qti-match-target-wrapper {
  list-style: none;
  margin: .5rem auto;
  padding: 0;
  text-align: center;
  width: 100%;
}

ul.qti-match-target-wrapper.qti-choices-left,
ul.qti-match-target-wrapper.qti-choices-right {
  margin: .75rem auto;
  width: 50%;
}

ul.qti-match-target-wrapper.qti-choices-top,
ul.qti-match-target-wrapper.qti-choices-bottom {
  display: block;
}

ul.qti-match-target-wrapper > li.target {
  display: inline-block;
  padding: .25rem .25rem 0;
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
  min-height: 5.25rem;
  width: 150px;
}

ul.qti-match-target-wrapper > li.target.target-active {
  color: var(--order-target-active-color);
  background-color: var(--order-target-active-bgc);
  border: 1px dashed var(--ea-button-secondary-bgc);
}

ul.qti-match-target-wrapper > li.target.target-active.active {
  color: var(--order-target-active-color);
  background-color: var(--order-placeholder-color);
  border: 1px dashed var(--ea-button-secondary-bgc);
}

ul.qti-match-target-wrapper > li.target > .draggable {
  cursor: move;
  width: 100%;
  /* Make sure long draggables wrap and fit in the target */
  overflow-wrap: break-word;
  margin: 0 0 .25rem;
}

.choice-description.draggable.dragging {
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

ul.qti-match-target-wrapper > li.target > .dragger-placeholder {
  margin-bottom: .25rem;
}

.match-target-label {
  display: inline-block;
  line-height: 1.6rem;
  text-align: center;
  margin: 0 0 .5rem;
}

/* Used for default match interaction */
.choice-description.draggable {
  display: inline-block;
  position: relative;
  font-weight: 400;
  cursor: move;
  padding: .25rem;
  margin: 0;
  vertical-align: top;
  color: var(--choice-ctrlh-color);
  background-color: var(--choice-ctrlh-bgc);
  border: 1px solid var(--choice-ctrlh-color);
  overflow: hidden;
  text-decoration: none;
  border-radius: .25rem;
}
</style>
