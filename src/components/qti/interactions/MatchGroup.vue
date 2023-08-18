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
import MatchInteractionTabularWidget from '@/components/qti/interactions/widgets/MatchInteractionTabularWidget'

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
     * When matchtabular subtype, it can be advantageous to hide the column headers.  This attribute enables 
     * this presentation.  Do not display the top row of the table where the column headers are displayed.
     */
    headerHidden: {
      required: false,
      type: String,
      default: 'false'
    },
    /*
     * NOT QTI SHARED INTERACTION VOCAB
     * When matchtabular subtype, rowCentric = true is used to invert the table's row and column headers.
     * When rowCentric = false (the default), the targets are displayed as column headers and the sources
     * are displayed as row headers.
     */
    rowCentric: {
      required: false,
      type: String,
      default: 'false'
    },
    /*
     * When matchtabular subtype, the custom text to be rendered in the top-left header cell 
     * of the table (headings must be visible - see headerHidden).
     */
    dataFirstColumnHeader: {
      required: false,
      type: String,
      default: null
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
      isHeaderHidden: null,
      isRowCentric: null,
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

      if (this.interactionSubType === 'default') {
        // Bind to the MatchInteraction widget.
        this.matchable = new MatchInteractionWidget(this.$refs.root, {
          interactionSubType: this.interactionSubType,
          cardinality: this.cardinality,
          maxAssociations: this.computedMaxAssociations,
          response: response,
          onReady: this.handleWidgetReady,
          onUpdate: this.handleWidgetUpdate,
          onAssociationsLimit: this.handleAssociationsLimit
        })
      } else if (this.interactionSubType === 'matchtabular') {
        // Bind to the MatchInteractionTabular widget.
        this.matchable = new MatchInteractionTabularWidget(this.$refs.root, {
          interactionSubType: this.interactionSubType,
          cardinality: this.cardinality,
          maxAssociations: this.computedMaxAssociations,
          isHeaderHidden: this.isHeaderHidden,
          isRowCentric: this.isRowCentric,
          firstColumnHeader: this.dataFirstColumnHeader,
          response: response,
          onReady: this.handleWidgetReady,
          onUpdate: this.handleWidgetUpdate,
          onAssociationsLimit: this.handleAssociationsLimit
        })        
      }
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
      this.isHeaderHidden = this.headerHidden === 'true' ? true : false
      this.isRowCentric = this.rowCentric === 'true' ? true : false
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
  },

  beforeDestroy () {
    if (this.matchable !== null) {
      this.matchable.destroy()
      this.matchable = null
    }
  }
}
</script>

<style>
.qti-match-interaction-wrapper {
  margin: .75rem 0;
  display: block;
  width: 100%;
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

ul.qti-match-source-wrapper.matchset-hidden,
ul.qti-match-target-wrapper.matchset-hidden {
  display: none;
}

ul.qti-match-source-wrapper.qti-choices-left {
  float: left;
  width: 50%;
  margin-top: .65rem;
  padding: 0 1rem;
  min-height: 5.25rem;
}

ul.qti-match-source-wrapper.qti-choices-right {
  float: right;
  width: 50%;
  margin-top: .65rem;
  padding: 0 1rem;
  min-height: 5.25rem;
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
  display: inline-block;
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

table.matchtabular .header-cell {
  text-align: center;
  vertical-align: middle;
  overflow-wrap: break-word;
}

table.matchtabular.row-centric .header-cell {
  overflow-wrap: anywhere;
}

table.matchtabular .row-header-cell {
  overflow-wrap: anywhere;
}

table.matchtabular.row-centric .row-header-cell {
  overflow-wrap: break-word;
}

table.matchtabular .table-cell {
  vertical-align: middle;
}

table.matchtabular [role="radio"].control-cell,
table.matchtabular [role="checkbox"].control-cell {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  margin: 0 auto;
  padding: 0;
  outline: none;
  border: 1px dashed transparent;
  width: 40px;
  height: 32px;
  cursor: pointer;

}

table.matchtabular [role="checkbox"].control-cell::before,
table.matchtabular [role="radio"].control-cell::before {
  width: 1rem;
  height: 1rem;
  /* Default inner color of the control */
  background-color: var(--choice-control-bgc);
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
  /* The pale gray border around the control */
  border: var(--choice-control-border);
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

table.matchtabular [role="checkbox"].control-cell::before,
table.matchtabular [role="checkbox"].control-cell::after,
table.matchtabular [role="radio"].control-cell::before,
table.matchtabular [role="radio"].control-cell::after {
  position: absolute;
  top: 15px;
  left: 19px;
  transform: translate(-50%, -50%);
  content: '';
}

table.matchtabular [role="radio"].control-cell::before {
  border-radius: 50%;
}

table.matchtabular [role="checkbox"].control-cell::before {
  border-radius: 0.25rem;
}

table.matchtabular [role="checkbox"].control-cell:active::before,
table.matchtabular [role="radio"].control-cell:active::before {
  filter: brightness(90%);
}

/* Choice focus */
table.matchtabular [role="checkbox"].control-cell:focus,
table.matchtabular [role="radio"].control-cell:focus {
  border: 1px solid transparent;
  border-radius: 0.15rem;
  border-color: var(--choice-focus-border);
}

/* Radio/Checkbox control focus */
table.matchtabular [role="checkbox"].control-cell:focus::before,
table.matchtabular [role="radio"].control-cell:focus::before {
  border-color: var(--choice-control-focus-border);
  outline: 0;
  /* Puts pale blue box shadow around the control */
  box-shadow: var(--choice-control-focus-shadow);
}

/* Radio/Checkbox control checked */
table.matchtabular [role="checkbox"][aria-checked="true"].control-cell::before,
table.matchtabular [role="radio"][aria-checked="true"].control-cell::before {
  background-color: var(--choice-control-checked-bg);
  border-color: var(--choice-control-checked-bc);
}

/* Radio control checked */
table.matchtabular [role="radio"][aria-checked="true"].control-cell::before {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='-4 -4 8 8'%3e%3ccircle r='2' fill='currentColor' /%3e%3c/svg%3e");
}
</style>
