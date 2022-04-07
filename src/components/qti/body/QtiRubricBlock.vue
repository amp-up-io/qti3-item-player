<template>
  <div ref="root" class="qti-rubric-block hidden">
    <slot></slot>
  </div>
</template>

<script>
/*
 * The container for the rubric block content. A rubric block identifies part of
 * the content that represents instructions to one or more of the actors that view
 * the item. Although rubric blocks are defined as simpleBlocks they must not contain
 * interactions. The visibility of nested rubricBlocks is determined by the outermost
 * element. In other words, if an element is determined to be hidden then all of its
 * content is hidden including conditionally visible elements for which the conditions
 * are satisfied and that therefore would otherwise be visible.
 */
import { store } from '@/store/store'
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'

const qtiAttributeValidation = new QtiAttributeValidation()

export default {
  name: 'QtiRubricBlock',

  props: {
    /*
     * [1] multiplicity
     * The views in which the rubric block's content are to be shown.
     *
     * A list from an enumerated value set of:
     * { author | candidate | proctor | scorer | testConstructor | tutor }
     *
     * If 'view' contains 'scorer', this rubric block will be hidden from
     * candidates.
     */
    view: {
      type: String,
      required: true
    },
    /*
     * [0..1] multiplicity
     * Denotes how the content contained within the rubric block is intended
     * to be used within sytems presenting the rubric block content.
     */
    use: {
      type: String,
      required: false
    }
  },

  data () {
    return {
      isQtiValid: true
    }
  },

  computed: {
    isScoringRubricBlock () {
      const views = this.view.split(' ')
      for (let i=0; i<views.length; i++) {
        if (views[i] === 'scorer') {
          return true
        }
      }
      return false
    }
  },

  methods: {

    validateChildren () {
      // TODO: ??
    },

    /**
     * @description When this is a scoring rubric block, remove it from the
     * DOM.  Otherwise display it.
     */
    evaluate () {
      if (!this.isScoringRubricBlock) {
        this.$refs.root.classList.remove('hidden')
        return
      }
      // It's a scoring rubric, smoke the DOM.
      this.$refs.root.innerHTML = ''
    }

  },

  created () {
    try {
      qtiAttributeValidation.validateRubricBlockViewAttribute(this.view)
    } catch (err) {
      this.isQtiValid = false
      if (err.name === 'QtiValidationException') {
        throw new QtiValidationException(err.message)
      } else {
        throw new Error(err.message)
      }
    }
  },

  mounted () {
    if (this.isQtiValid) {
      try {
        this.validateChildren()

        if (this.isScoringRubricBlock) {
          // Notify store of our new scoring rubric block
          store.defineScoringRubricBlock({
              view: this.view,
              html: this.$refs.root.innerHTML,
              node: this
            })
        }

        // Show/Hide the rubric block
        this.evaluate()

        console.log('[' + this.$options.name + '][View: ' + this.view + ']')
      } catch (err) {
        this.isQtiValid = false
        throw new QtiValidationException(err.message)
      }
    }
  }
}
</script>

<style>
div.qti-rubric-block.hidden {
  display: none;
}

div.qti-rubric-block {
  /* display:block */
}
</style>
