<template>
  <div 
    ref="root" 
    class="qti-gap-match-group-wrapper qti-choices-left">
    <slot></slot>
  </div>
</template>

<script>
import Vue from 'vue'
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'
import GapMatchPresentationFactory from '@/components/qti/interactions/presentation/GapMatchInteractionPresentationFactory'
import QtiGapText from '@/components/qti/interactions/QtiGapText'
import QtiGapImg from '@/components/qti/interactions/QtiGapImg'
import QtiGap from '@/components/qti/interactions/QtiGap'

Vue.component('QtiGapText', QtiGapText)
Vue.component('QtiGapImg', QtiGapImg)
Vue.component('QtiGap', QtiGap)

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
     * The gap choices container width in pixels. Example: data-choices-container-width="100"
     */
    dataChoicesContainerWidth: {
      required: false,
      type: String,
      default: null
    },
    /*
     * NOT A QTI ATTRIBUTE - Determined by the QtiGapMatchInteraction component.
     * May be one of 'default'
     */
    interactionSubType: {
      required: false,
      type: String,
      default: 'default'
    },
    /*
     * NOT A QTI ATTRIBUTE
     */
     gapMatchInteractionStaticClass: {
      required: true,
      type: String
    },
    /*
     * NOT A QTI ATTRIBUTE
     * Parent QtiGapMatchInteraction component passed the
     * interaction state into this GapMatchGroup component.
     * Used for re-establishing a prior choice order on shuffled interactions.
     * When not null, has this schema:
     * {
     *   identifier: [String],
     *   value: [directedPair, or Array of directedPairs, depending on cardinality]
     *   state: {
     *     order: [Array of Identifiers]
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
      order: [],
      gaps: [],
      response: null,
      isShuffle: null,
      gapMatchInteractionClassAttribute: null,
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

    getChoices () {
        return this.choices
    },

    setIsShuffle (isShuffle) {
        this.isShuffle = isShuffle
    },

    validateChildren () {
      let gapChoiceCount = 0

      this.$slots.default.forEach((slot) => {
        if (qtiAttributeValidation.isValidSlot(slot)) {
          const tag = slot.componentOptions.tag
          if ((tag === 'qti-gap-text') || (tag === 'qti-gap-img')) {
            gapChoiceCount += 1
          } else if (tag === 'qti-gap') {
            if (gapChoiceCount == 0)
              throw new QtiValidationException('qti-gap elements must come after qti-gap-text and qti-gap-img elements')
          } else {
            throw new QtiValidationException('Node is not one of qti-gap-text, qti-gap-img, or qti-gap: "' + slot.componentOptions.tag + '"')
          }
        }
      })

      // All good.  Save off our children.
      this.processChildren()
    },

    processChildren () {
      this.$children.forEach((node) => {
        const tag = node.$vnode.componentOptions.tag
        if ((tag === 'qti-gap-text') || (tag === 'qti-gap-img')) {
          this.choices.push(node)
        } else if (tag === 'qti-gap') {
          this.gaps.push(node)
        }
      }, this)
    },

    insertAfter (newNode, referenceNode) {
        referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling)
    },

    /**
     * @description Main workhorse method to initialize this Match Group's UI.
     * @param {Array} response - a prior response or null
     */
    processGroupUI (/*response*/) {
      let gapChoiceWrapperElement = this.createGapChoiceWrapper()

      if (gapChoiceWrapperElement == null) return

      let gapTargetWrapperElement = this.createGapTargetWrapper(gapChoiceWrapperElement)

      let container = this.createContainer(this.priorState)
      this.processContainerChoices(container, gapChoiceWrapperElement)
      this.saveContainerOrder(container)

      // Other than shuffling, this handles all of the QTI presentation vocab.
      this.presentationFactory
        .initialize(
          this.$refs.root,
          gapChoiceWrapperElement,
          gapTargetWrapperElement,
          this.choices,
          this.gaps)

      /*
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
      */
    },

    /**
     * @description Attempt to create and insert a ul element wrapper around the gap choices.
     * If successful return the ul.qti-gap-match-source-wrapper.  If not, return null.
     */
    createGapChoiceWrapper () {
      // Find all the qti-gap-choice's
      let firstGapChoice = this.$refs.root.querySelector('.qti-gap-choice')

      // If there are no qti-gap-choice's, bail.
      if (firstGapChoice === null) return null

      // We have qti-gap-choices, wrap them.
      let gapChoiceWrapper = document.createElement('ul')
      gapChoiceWrapper.classList.add('qti-gap-match-source-wrapper')
      this.$refs.root.insertBefore(gapChoiceWrapper, firstGapChoice)

      // Return the wrapper
      return gapChoiceWrapper
    },

    createGapTargetWrapper (gapChoiceWrapperElement) {
      let children = this.$refs.root.childNodes
      
      let gapTargetWrapper = document.createElement('div')
      gapTargetWrapper.classList.add('qti-gap-match-target-wrapper')

      for (let i=0; i < children.length; i++) {
        // Only append element nodes not equal to the gapChoiceWrapperElement
        if (children[i].nodeType === 1 && children[i] !== gapChoiceWrapperElement) {
          gapTargetWrapper.append(children[i])
        }
      }

      // Append the target wrapper
      this.$refs.root.append(gapTargetWrapper)

      return gapTargetWrapper
    },

    /**
     * @description This builds an array of gap choice nodes from
     * a prior state (if one exists) or from the original QTI order.
     * @return {Array} container - Array of choices in the proper order.
     */
    createContainer (priorState) {
      let container = []

      // If priorState is null, create a container of Choices
      // in their QTI order.
      if (priorState === null) {
        this.choices.forEach((choice) => {
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

      // If priorState is not null, rebuild a container of Choices
      // from the orders[index] in priorState.state
      const order = priorState.state.order
      order.forEach((identifier) => {
        const choice = this.findChoiceByIdentifier(identifier, this.choices)
        if (choice !== null) {
          container.push({
            fixed: (choice.fixed === 'true'),
            node: choice
          })
        }
      }, this)

      return container
    },

    /**
     * @description Builds a new dom and choices
     * array from the choices array.
     * @param {Array} container - Array of ordered choices
     * @param {DomElement} wrapper - wrapper element for the choices
     */
    processContainerChoices (container, wrapper) {
      // Clean out the dom and the original choices array
      this.choices.splice(0, this.choices.length)
      wrapper.innerHTML = ''

      // Rebuild the dom and the choices array
      container.forEach((choice) => {
        wrapper.appendChild(choice.node.$el)
        this.choices.push(choice.node)
      }, this)
    },

    /**
     * @description Iterate through the given container, create and persist the
     * order in state.
     * @param {Array} container - a container or choices
     */
    saveContainerOrder (container) {
      const order = []
      container.forEach((choice) => {
        order.push(choice.node.identifier)
      })

      this.order = order
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
     * @description Callback function that is part of the GapMatchInteraction
     * widget lifecycle when an interaction has completed its initialization.
     * A response is computed and passed in the data parameter.
     * @param {Object} data - object containing a 'response' property
     */
     handleWidgetReady (data) {
      this.setResponse(data.response)

      // Important: Notify parent qti-gap-match-interaction component
      // that our gapMatchGroup is ready
      this.$emit('gapMatchGroupReady', {
        response: this.getResponse(),
        //matchsets: this.matchsets,
        order: this.order
      })
    },

    /**
     * @description Callback function that is part of the GapMatchInteraction
     * widget lifecylce.  A response is computed and passed in the data parameter.
     * @param {Object} data - object containing a 'response' property
     */
    handleWidgetUpdate (data) {
      this.setResponse(data.response)

      // Notify parent that we have an update
      this.$emit('gapMatchGroupUpdate', {
          response: this.getResponse()
        })
    },

    handleAssociationsLimit () {
      this.$emit('gapMatchGroupAssociationsLimit')
    },

    initializeGapMatchGroup () {
      // Set up a presentation factory
      this.presentationFactory = new GapMatchPresentationFactory(this.gapMatchInteractionStaticClass)
    }
  },

  created () {
    try {
      if (typeof this.cardinality === 'undefined') {
        throw new QtiValidationException('Undefined qti-gap-match-interaction cardinality')
      }

      if ((this.cardinality !== 'single') && (this.cardinality !== 'multiple')) {
        throw new QtiValidationException('qti-gap-match-interaction cardinality must be "single" or "multiple"')
      }

      this.setIsShuffle(this.shuffle === 'true' ? true : false)
      this.initializeGapMatchGroup()
    } catch (err) {
      this.isQtiValid = false
      console.log('[QtiGapMatchInteraction][ValidationError]', err.name, err.message)
      throw new QtiValidationException(err.message)
    }
  },

  mounted () {
    if (this.isQtiValid) {
      try {
        // Validate and process the choices and targets
        this.validateChildren()

        // Build a UI - triggers a 'gapMatchGroupReady' event upon completion.
        this.processGroupUI(this.priorState === null ? null : this.priorState.value)
      } catch (err) {
        this.isQtiValid = false
        if (err.name === 'QtiValidationException') {
          console.log('[QtiGapMatchInteraction][ValidationException]', err.message)
          throw new QtiValidationException(err.message)
        } else if (err.name === 'QtiEvaluationException') {
          console.log('[QtiGapMatchInteraction][EvaluationException]', err.message)
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
.qti-gap-match-group-wrapper {
  margin: .75rem 0;
  display: block;
  width: 100%;
}

.qti-gap-match-group-wrapper.qti-choices-left,
.qti-gap-match-group-wrapper.qti-choices-right {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
}

ul.qti-gap-match-source-wrapper {
  list-style: none;
  margin: 1rem auto;
  padding: 0;
  width: 100%;
  text-align: center;
  border: 1px solid;
  border-color: var(--background);
  border-radius: .25rem;
}

ul.qti-gap-match-source-wrapper.qti-choices-left,
ul.qti-gap-match-source-wrapper.qti-choices-right {
  display: flex;
  flex-direction: column;
  flex-basis: 100%;
  flex: 1;
  width: 50%;
  margin-top: .65rem;
  padding: 0 1rem;
  min-height: 5.25rem;
}

ul.qti-gap-match-source-wrapper.qti-choices-top,
ul.qti-gap-match-source-wrapper.qti-choices-bottom {
  display: block;
  min-height: 4.15rem;
}

ul.qti-gap-match-source-wrapper.target-active {
  background-color: var(--well-bg);
  border: 1px dashed;
  border-color: var(--ea-button-secondary-bgc);
}

/* Hide sources when not containing a dragger */
ul.qti-gap-match-source-wrapper.qti-choices-left > li.source,
ul.qti-gap-match-source-wrapper.qti-choices-right > li.source,
ul.qti-gap-match-source-wrapper.qti-choices-top > li.source,
ul.qti-gap-match-source-wrapper.qti-choices-bottom > li.source {
  display: none;
}

ul.qti-gap-match-source-wrapper > li.source.full {
    display: inline-block;
    padding: .75rem .25rem;
    margin: 0 .15rem .15rem;
    vertical-align: top;
}

ul.qti-gap-match-source-wrapper.qti-choices-left > li.source,
ul.qti-gap-match-source-wrapper.qti-choices-right > li.source {
  padding: .25rem;
}

div.qti-gap-match-target-wrapper {
  margin-top: .5rem;
  margin-bottom: .5rem;
  padding: 0;
  width: 100%;
}

div.qti-match-target-wrapper.qti-choices-left,
div.qti-match-target-wrapper.qti-choices-right {
  margin: .75rem auto;
  width: 50%;
  display: inline-block;
}

div.qti-match-target-wrapper.qti-choices-top,
div.qti-match-target-wrapper.qti-choices-bottom {
  display: block;
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
