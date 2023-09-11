<template>
  <div 
    ref="root" 
    class="qti-ggm-group-wrapper">
    <slot></slot>
  </div>
</template>

<script>
import Vue from 'vue'
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'
import GraphicGapMatchPresentationFactory from '@/components/qti/interactions/presentation/GraphicGapMatchInteractionPresentationFactory'
import GraphicGapMatchInteractionWidget from '@/components/qti/interactions/widgets/GraphicGapMatchInteractionWidget'
import QtiGapImg from '@/components/qti/interactions/QtiGapImg'
import QtiAssociableHotspot from '@/components/qti/interactions/QtiAssociableHotspot'

Vue.component('QtiGapImg', QtiGapImg)
Vue.component('QtiAssociableHotspot', QtiAssociableHotspot)

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
     * The maximum number of associations that the candidate may make
     * when responding to the interaction. Used in conjunction with minAssociations,
     * if specified, maxAssociations must be greater than or equal to minAssociations
     * and must not exceed the number of choices available. If unspecified,
     * all of the choices may be matched.
     */
    maxAssociations: {
      required: false,
      type: String,
      default: '1'
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
     * The graphic choices container width in pixels. Example: data-choices-container-width="100"
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
    interactionStaticClass: {
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
      image: null,
      choices: [],
      order: [],
      gaps: [],
      response: null,
      isShuffle: null,
      interactionClassAttribute: null,
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
          } else if (tag === 'qti-associable-hotspot') {
            if (gapChoiceCount == 0)
              throw new QtiValidationException('qti-associable-hotspot elements must come after qti-gap-text and qti-gap-img elements')
          } else {
            throw new QtiValidationException('Node is not one of qti-gap-text, qti-gap-img, or qti-associable-choice: "' + slot.componentOptions.tag + '"')
          }
        } else {
          // Search for an img, object, or picture element
          if ((slot.tag === 'img') || (slot.tag === 'object') || (slot.tag === 'picture')) {
            this.image = slot.elm
          }
          
        }
      }, this)

      // All good.  Save off our children.
      this.processChildren()
    },

    processChildren () {
      this.$children.forEach((node) => {
        const tag = node.$vnode.componentOptions.tag
        if ((tag === 'qti-gap-text') || (tag === 'qti-gap-img')) {
          this.choices.push(node)
        } else if (tag === 'qti-associable-hotspot') {
          this.gaps.push(node)
        }
      }, this)
    },

    insertAfter (newNode, referenceNode) {
        referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling)
    },

    /**
     * @description Main workhorse method to initialize this GGM Group's UI.
     * @param {Array} response - a prior response or null
     */
    processGroupUI (response) {
      let gapChoiceWrapperElement = this.createGapChoiceWrapper()

      if (gapChoiceWrapperElement == null) return

      let gapTargetWrapperElement = this.createGapTargetWrapper()

      let container = this.createContainer(this.priorState)
      this.processContainerChoices(container, gapChoiceWrapperElement)
      this.saveContainerOrder(container)

      // Other than shuffling, this handles all of the QTI presentation vocab.
      this.presentationFactory
        .initialize(
          this.$refs.root,
          gapChoiceWrapperElement,
          gapTargetWrapperElement,
          this.image,
          this.dataChoicesContainerWidth,
          this.choices,
          this.gaps)

      // Bind to the GraphicGapMatchInteraction widget.
      this.matchable = new GraphicGapMatchInteractionWidget(this.$refs.root, {
        interactionSubType: this.interactionSubType,
        cardinality: this.cardinality,
        maxAssociations: this.computedMaxAssociations,
        response: response,
        onReady: this.handleWidgetReady,
        onUpdate: this.handleWidgetUpdate,
        onAssociationsLimit: this.handleAssociationsLimit
      })
    },

    /**
     * @description Attempt to create and insert a ul element wrapper around the gap choices.
     * If successful return the ul.qti-ggm-source-wrapper.  If not, return null.
     */
    createGapChoiceWrapper () {
      // Find all the qti-gap-choice's
      let firstGapChoice = this.$refs.root.querySelector('.qti-gap-choice')

      // If there are no qti-gap-choice's, bail.
      if (firstGapChoice === null) return null

      // We have qti-gap-choices, wrap them.
      let gapChoiceWrapper = document.createElement('ul')
      gapChoiceWrapper.classList.add('qti-ggm-source-wrapper')
      this.$refs.root.insertBefore(gapChoiceWrapper, firstGapChoice)

      // Return the wrapper
      return gapChoiceWrapper
    },

    createGapTargetWrapper () {
      let gapTargetWrapper = document.createElement('div')
      gapTargetWrapper.classList.add('qti-ggm-target-wrapper')

      gapTargetWrapper.append(this.image)

      for (let i=0; i < this.gaps.length; i++) {
        gapTargetWrapper.append(this.gaps[i].$el)
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
      // from the order array in priorState.state
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
     * @description Utility method for selecting a choice by identifier
     * @param {String} identifier - the identifier of the choice
     * @param {Array} choices - array of qti-gap-choice nodes
     * @return {Component} choice or an exception if not found
     */
    findChoiceByIdentifier (identifier, choices) {
      for (let i = 0; i < choices.length; i++) {
        if (choices[i].$el.getAttribute('data-identifier') === identifier) {
          return choices[i]
        }
      }

      throw new QtiEvaluationException('Gap Match Interaction State Invalid.  Choice identifier "' + identifier + '" not found.')
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
     * @description Callback function that is part of the GraphicGapMatchInteraction
     * widget lifecycle when an interaction has completed its initialization.
     * A response is computed and passed in the data parameter.
     * @param {Object} data - object containing a 'response' property
     */
    handleWidgetReady (data) {
      this.setResponse(data.response)

      // Important: Notify parent qti-gap-match-interaction component
      // that our gapMatchGroup is ready
      this.$emit('ggmGroupReady', {
        response: this.getResponse(),
        order: this.order
      })
    },

    /**
     * @description Callback function that is part of the GraphicGapMatchInteraction
     * widget lifecylce.  A response is computed and passed in the data parameter.
     * @param {Object} data - object containing a 'response' property
     */
    handleWidgetUpdate (data) {
      this.setResponse(data.response)

      // Notify parent that we have an update
      this.$emit('ggmGroupUpdate', {
          response: this.getResponse()
        })
    },

    handleAssociationsLimit () {
      this.$emit('ggmGroupAssociationsLimit')
    },

    initializeGraphicGapMatchGroup () {
      // Set up a presentation factory
      this.presentationFactory = new GraphicGapMatchPresentationFactory(this.interactionStaticClass)
    }
  },

  created () {
    try {
      if (typeof this.cardinality === 'undefined') {
        throw new QtiValidationException('Undefined qti-graphic-gap-match-interaction cardinality')
      }

      if (this.cardinality !== 'multiple') {
        throw new QtiValidationException('qti-graphic-gap-match-interaction cardinality must be "multiple"')
      }

      this.setIsShuffle(this.shuffle === 'true' ? true : false)
      this.initializeGraphicGapMatchGroup()
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

        // Build a UI - triggers a 'ggmGroupReady' event upon completion.
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
.qti-ggm-group-wrapper {
  margin: 1rem 0;
  display: block;
  width: 100%;
}

/* 
 * For qti-choices-left and right, use a two-column
 * layout with a 2rem gap separator.
 */
.qti-ggm-group-wrapper.qti-choices-left,
.qti-ggm-group-wrapper.qti-choices-right {
    display: flex;
    column-gap: 2rem;
}

.qti-ggm-group-wrapper.qti-choices-left > *,
.qti-ggm-group-wrapper.qti-choices-right > * {
    width:calc(50% - 1rem);
}

ul.qti-ggm-source-wrapper {
  list-style: none;
  margin: 0 auto;
  padding: 8px 6px 0;
  width: 100%;
  text-align: center;
  background-color: var(--well-bg);
  border: 1px solid;
  border-color: var(--background);
  border-radius: .25rem;
  min-height: 3.4rem;
}

ul.qti-ggm-source-wrapper.qti-choices-top,
ul.qti-ggm-source-wrapper.qti-choices-bottom {
  text-align: left;
}

ul.qti-ggm-source-wrapper.qti-choices-top {
  margin-bottom: .5rem;
}

ul.qti-ggm-source-wrapper.qti-choices-bottom {
  margin-top: .5rem;
}

ul.qti-ggm-source-wrapper.target-active {
  background-color: var(--well-bg);
  border: 1px dashed;
  border-color: var(--ea-button-secondary-bgc);
}

/* Hide sources when not containing a dragger */
ul.qti-ggm-source-wrapper > li.source {
  display: none;
}

ul.qti-ggm-source-wrapper > li.source.full {
  display: inline-block;
  padding: 0;
  margin: 0 4px 8px;
  vertical-align: top;
}

div.qti-ggm-target-wrapper {
  position: relative;
  margin: 0 auto;
  padding: 0;
}

div.qti-ggm-target-wrapper.qti-choices-top,
div.qti-ggm-target-wrapper.qti-choices-bottom {
  display: block;
}

.qti-ggm-group-wrapper .gap-choice-img.ggm-dragger-placeholder {
  cursor: none;
	vertical-align: top;
	text-decoration: none;
  border: 0;
  border-radius: 0;
  padding: 0;
  line-height: 0;
}

.gap-choice-img.draggable {
  cursor: move;
	vertical-align: top;
	text-decoration: none;
  border: 0;
  border-radius: 0;
  padding: 0;
  line-height: 0;
  user-select: none;
}

.gap-choice-img.draggable.dragging {
  position: fixed;
  left: 0;
  top: 0;
  will-change: transform;
}

.gap-choice-text.draggable {
  display: inline-block;
  position: relative;
  font-weight:400;
  font-size: 16px;
  line-height: 26px;
  cursor: move;
  padding: 0 .25rem;
  margin: 0;
  vertical-align: top;
  color: var(--choice-ctrlh-color);
  background-color: var(--choice-ctrlh-bgc);
  border: 1px solid var(--choice-ctrlh-color);
  text-decoration: none;
  border-radius: .25rem;
  min-height: 26px;
}

.gap-choice-text.draggable.ggm-dragger-placeholder {
  cursor: none;
}
</style>
