<template>
  <ul
    ref="choicegroup"
    :role="role"
    class="qti-choice-list">
    <slot></slot>
  </ul>
</template>

<script>
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'
import ChoicePresentationFactory from '@/components/qti/interactions/presentation/ChoiceInteractionPresentationFactory'

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
     * The maximum number of choices that can be selected.
     * A value of 0 means unlimited choices.
     */
    maxChoices: {
      required: false,
      type: String,
      default: '1'
    }
  },

  data () {
    return {
      choices: [],
      firstChoice: null,
      lastChoice: null,
      role: null,
      isRadio: null,
      isShuffle: null,
      choiceInteractionClassAttribute: null,
      presentationFactory: null,
      isQtiValid: true,
      priorState: null
    }
  },

  methods: {

    /**
     * @description Get this ChoiceGroup's priorState.
     * @return {Object} priorState
     */
    getPriorState () {
      return this.priorState
    },

    /**
     * @description Set this ChoiceGroup's priorState.
     * @param {Object} priorState
     */
    setPriorState (priorState) {
      this.priorState = priorState
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

      // Init priorState in case there is a shuffle order and a restore
      this.setPriorState(this.$parent.priorState)

      // Build a UI
      this.processGroupUI()
    },

    processChildren () {
      this.$children.forEach((node) => {
        this.choices.push(node)
      }, this)
    },

    /**
     * @description Main workhorse method to initialize this Choice Group's UI.
     */
    processGroupUI () {
      if (this.isShuffle) {
        // If this is a new rendering, shuffle the choices.
        // If this is a restore, rebuild the old shuffled order from state.
        this.processShuffle()
      }

      // Other than shuffling, this handles all of the QTI presentation vocab.
      this.presentationFactory.initialize(this)

      // Initialize aria-active-descendant
      this.setActiveDescendant('')

      // If this is a radio group, get a handle on the first and last
      // choices in the group for keyboard operations.
      if (this.isRadio) {
        this.processFirstAndLastChoices()
      }
    },

    /**
     * @description Utility method used when generating a new template - in
     * which case we reset priorState then call processGroupUI
     * all over again.
     */
    resetGroupUI () {
      // Clear out any prior ordering in case shuffle is true
      this.setPriorState(null)

      // Reprocess the entire UI
      this.processGroupUI()

      // Important: Notify parent qti-choice-interaction component
      // that our choices are ready
      this.$emit('choiceGroupReady', {
        choices: this.choices,
        firstChoice: this.firstChoice,
        lastChoice: this.lastChoice
      })
    },

    /**
     * @description This builds a new dom and choices
     * array from the choices array
     */
    processShuffle () {
      // Load all nodes into a container to be shuffled.
      let container = this.createShuffleContainer(this.choices, this.getPriorState())

      // Clean out the dom and the original choices array
      this.choices.splice(0, this.choices.length)
      this.$refs.choicegroup.innerHTML = ''

      // Rebuild the dom and the choices array
      container.forEach((choice) => {
        this.$refs.choicegroup.appendChild(choice.node.$el)
        this.choices.push(choice.node)
      }, this)
    },

    /**
     * @description When shuffle is true, this builds an ordered array of choice nodes from
     * a prior state (if one exists) or from the shuffleArrayFixed method in the qtiProcessing
     * library.
     * @return {Array} Array of choices in the proper order.
     */
    createShuffleContainer (choices, priorState) {
      let container = []

      // If priorState is null, we create a container of Choices
      // in their QTI order.  Then shuffle that container in place.
      if (priorState === null) {
        choices.forEach((choice) => {
          container.push({
            fixed: (choice.fixed === 'true'),
            node: choice
          })
        })
        // Shuffle the container
        qtiProcessing.shuffleArrayFixed(container)
        return container
      }

      // priorState is not null...so...
      // The order property is in priorState.state.order
      // Build the container according to the order property.
      priorState.state.order.forEach((identifier) => {
        container.push({
          node: this.findChoiceByIdentifier(identifier, choices)
        })
      }, this)
      return container
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

      throw new QtiEvaluationException('Choice Interaction State Invalid.  Choice identifier "' + identifier + '" not found.')
    },

    /**
     * @description - Utility method for identifying the first and last choices
     * in a collection of choices.
     */
    processFirstAndLastChoices () {
      if (this.choices.length === 0) return

      this.firstChoice = this.choices[0]
      this.lastChoice = this.choices[this.choices.length-1]
    },

    /**
     * @description For screen readers, set the choice group's aria-activedescendant
     * @param {String} id - the dom id of the currently focused choice
     */
    setActiveDescendant (id) {
      this.$refs.choicegroup.setAttribute('aria-activedescendant', id)
    },

    initializeChoiceGroup () {
      switch (this.cardinality) {
        case 'single':
          this.role = 'radiogroup'
          this.isRadio = true
          break
        case 'multiple':
          this.role = 'group'
          this.isRadio = false
          break
        default:
          // If this is somehow undefined then default to radio.
          this.role = 'radiogroup'
          this.isRadio = true
          break
      }
      // compute shuffle
      this.isShuffle = (this.shuffle === 'true' ? true : false)
      // Set up a presentation factory
      this.presentationFactory = new ChoicePresentationFactory()
    }
  },

  created () {
    try {
      if (typeof this.cardinality === 'undefined') {
        throw new QtiValidationException('Undefined qti-choice-interaction cardinality')
      }

      // Adjust behaviors to multiple choice or multiple select.
      this.initializeChoiceGroup()

    } catch (err) {
      this.isQtiValid = false
      console.log('[QtiChoiceInteraction][ValidationError]', err.name, err.message)
      throw new QtiValidationException(err.message)
    }
  },

  mounted () {
    if (this.isQtiValid) {
      try {
        // Get a handle on the parent interaction.
        // Use this to inspect the parent's class attribute.
        this.choiceInteractionClassAttribute = this.$parent.$refs.root.classList

        // Validate and process the prompt (if any) and the choices.
        this.validateChildren()

        // Important: Notify parent qti-choice-interaction component
        // that our choices are ready
        this.$emit('choiceGroupReady', {
          choices: this.choices,
          firstChoice: this.firstChoice,
          lastChoice: this.lastChoice
        })

      } catch (err) {
        this.isQtiValid = false
        if (err.name === 'QtiValidationException') {
          console.log('[QtiChoiceInteraction][ValidationException]', err.message)
          throw new QtiValidationException(err.message)
        } else if (err.name === 'QtiEvaluationException') {
          console.log('[QtiChoiceInteraction][EvaluationException]', err.message)
          throw new QtiEvaluationException(err.message)
        }
      }
    }
  }
}
</script>

<style>
[role="group"],
[role="radiogroup"] {
  display: block;
  padding: 0;
  margin: .5rem 0;
  list-style: none;
  width: 100%;
}

.qti3-player-writing-mode-vertical-rl [role="group"],
.qti3-player-writing-mode-vertical-rl [role="radiogroup"] {
  display: block;
  padding: 0;
  margin: 0 .5rem;
  list-style: none;
  height: 100%;
}

.qti-choice-interaction.lrn [role="group"],
.qti-choice-interaction.lrn [role="radiogroup"] {
  margin-bottom: 1.5rem;
}

[role="group"],
[role="radiogroup"]:focus {
  outline: none;
}

[role="group"] > li,
[role="radiogroup"] > li {
  display: inline-block;
  width: 100%;
  margin: 0 0 .25rem;
  overflow-wrap: break-word;
}

/*
  Stacking CSS
  No need for a qti-choices-stacking-1 style definition because
  default is vertical orientation with stacking-1
*/
.qti-choice-list.qti-orientation-vertical.qti-choices-stacking-2 {
  column-count: 2;
  gap: 1rem;
  align-items: start;
}

.qti-choice-list.qti-orientation-horizontal.qti-choices-stacking-2 > li {
  display:inline-block;
  width: 48%;
  margin-right: 0.25%;
  vertical-align: top;
}

.qti3-player-writing-mode-vertical-rl .qti-choice-list.qti-orientation-horizontal.qti-choices-stacking-2 > li {
  display:inline-block;
  height: 48%;
  margin-bottom: 1.0%;
  padding-left: 0.25rem;
  padding-right: 0.25rem;
  margin-left: 0.5rem;
}

.qti-choice-list.qti-orientation-horizontal.qti-choices-stacking-2 > li:nth-child(2n) {
  margin-right: 0;
}

.qti-choice-list.qti-orientation-vertical.qti-choices-stacking-3 {
  column-count: 3;
  grid-column-gap: 1rem;
  align-items: start;
}

.qti-choice-list.qti-orientation-horizontal.qti-choices-stacking-3 > li {
  display:inline-block;
  width: 32.4%;
  margin-right: 0.25%;
  vertical-align: top;
}

.qti3-player-writing-mode-vertical-rl .qti-choice-list.qti-orientation-horizontal.qti-choices-stacking-3 > li {
  display:inline-block;
  height: 31.0%;
  margin-bottom: 1.0%;
  padding-left: 0.25rem;
  padding-right: 0.25rem;
  margin-left: 0.5rem;
}

.qti-choice-list.qti-orientation-horizontal.qti-choices-stacking-3 > li:nth-child(3n) {
  margin-right: 0;
}

.qti-choice-list.qti-orientation-vertical.qti-choices-stacking-4 {
  column-count: 4;
  grid-column-gap: 1rem;
  align-items: start;
}

.qti-choice-list.qti-orientation-horizontal.qti-choices-stacking-4 > li {
  display:inline-block;
  width: 24.4%;
  margin-right: 0.25%;
  vertical-align: top;
}

.qti3-player-writing-mode-vertical-rl .qti-choice-list.qti-orientation-horizontal.qti-choices-stacking-4 > li {
  display:inline-block;
  height: 23.0%;
  margin-bottom: 1.0%;
  padding-left: 0.25rem;
  padding-right: 0.25rem;
  margin-left: 0.5rem;
}

.qti-choice-list.qti-orientation-horizontal.qti-choices-stacking-4 > li:nth-child(4n) {
  margin-right: 0;
}

.qti-choice-list.qti-orientation-vertical.qti-choices-stacking-5 {
  column-count: 5;
  grid-column-gap: 1rem;
  align-items: start;
}

.qti-choice-list.qti-orientation-horizontal.qti-choices-stacking-5 > li {
  display:inline-block;
  width: 19.4%;
  margin-right: 0.25%;
  vertical-align: top;
}

.qti3-player-writing-mode-vertical-rl .qti-choice-list.qti-orientation-horizontal.qti-choices-stacking-5 > li {
  display:inline-block;
  height: 18.0%;
  margin-bottom: 1.0%;
  padding-left: 0.25rem;
  padding-right: 0.25rem;
  margin-left: 0.5rem;
}

.qti-choice-list.qti-orientation-horizontal.qti-choices-stacking-5 > li:nth-child(5n) {
  margin-right: 0;
}

/* ============================================
   Overrides for narrower than iPad in portrait
   ============================================ */
@media (max-width:767px) {

  .qti-choice-list.qti-orientation-horizontal.qti-choices-stacking-3 > li {
    width: 31.8%;
    margin-right: 0.1%;
  }

  .qti-choice-list.qti-orientation-horizontal.qti-choices-stacking-4 > li {
    width: 23.3%;
    margin-right: 0.1%;
  }

  .qti-choice-list.qti-orientation-horizontal.qti-choices-stacking-5 > li {
    width: 18.4%;
    margin-right: 0.1%;
  }

}

/* ====================================================
   Overrides for between iPad in portrait and landscape
   ==================================================== */
@media (min-width:768px) and (max-width:979px) {

  .qti-choice-list.qti-orientation-horizontal.qti-choices-stacking-3 > li {
    width: 32.5%;
    margin-right: 0.1%;
  }

  .qti-choice-list.qti-orientation-horizontal.qti-choices-stacking-4 > li {
    width: 23.5%;
    margin-right: 0.1%;
  }

  .qti-choice-list.qti-orientation-horizontal.qti-choices-stacking-5 > li {
    width: 19.4%;
    margin-right: 0.1%;
  }

}
</style>
