<template>
  <ul ref="matchset" class="qti-simple-match-set">
    <slot></slot>
  </ul>
</template>

<script>
/*
 * This is the ordered set of choices for the match set.
 */
import Vue from 'vue'
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'
import QtiSimpleAssociableChoice from '@/components/qti/interactions/QtiSimpleAssociableChoice'

Vue.component('qti-simple-associable-choice', QtiSimpleAssociableChoice)

const qtiAttributeValidation = new QtiAttributeValidation()
const qtiProcessing = new QtiProcessing()

export default {
  name: 'QtiSimpleMatchSet',

  data() {
    return {
      choices: [],
      isShuffle: false,
      isQtiValid: true
    }
  },

  methods: {

    getChoices () {
        return this.choices
    },

    setIsShuffle (isShuffle) {
        this.isShuffle = isShuffle
    },

    /**
     * @description This builds an array of choice nodes from
     * a prior state (if one exists) or from the original QTI order.
     * @return {Array} container - Array of choices in the proper order.
     */
    createContainer (priorState, index) {
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
      const order = priorState.state.orders[index]
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
     */
    processContainerChoices (container) {
      // Clean out the dom and the original choices array
      this.choices.splice(0, this.choices.length)
      this.$refs.matchset.innerHTML = ''

      // Rebuild the dom and the choices array
      container.forEach((choice) => {
        this.$refs.matchset.appendChild(choice.node.$el)
        this.choices.push(choice.node)
      }, this)
    },

    validateChildren () {
      this.$slots.default.forEach((slot) => {
        if (qtiAttributeValidation.isValidSlot(slot)) {
          // Detect an expression
          if (slot.componentOptions.tag !== 'qti-simple-associable-choice') {
            throw new QtiValidationException('Node is not a qti-simple-associable-choice: "' + slot.componentOptions.tag + '"')
          }
        }
      })

      // All good.  Save off our children.
      this.processChildren()
    },

    processChildren () {
      this.$children.forEach((node) => {
        this.choices.push(node)
      })
    },

    /**
     * @description Utility method for selecting a choice by identifier
     * @param {String} identifier - the identifier of the choice
     * @param {Array} choices - array of qti-simple-associable-choice nodes
     * @return {Component} choice or an exception if not found
     */
    findChoiceByIdentifier (identifier, choices) {
      for (let i = 0; i < choices.length; i++) {
        if (choices[i].$el.getAttribute('data-identifier') === identifier) {
          return choices[i]
        }
      }

      throw new QtiEvaluationException('Match Interaction State Invalid.  Choice identifier "' + identifier + '" not found.')
    }

  },

  created () {
  },

  mounted () {
    if (this.isQtiValid) {
      try {
        this.validateChildren()

        console.log('[' + this.$options.name + ']')
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
</style>