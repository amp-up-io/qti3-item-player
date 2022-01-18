<template>
  <li ref="choice"
    role="option"
    :data-identifier="identifier"
    @mousedown="handleMousedown"
    class="qti-inline-choice">
    <slot></slot>
  </li>
</template>

<script>
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'

const qtiAttributeValidation = new QtiAttributeValidation()

export default {
  name: 'QtiInlineChoice',

  props: {
    identifier: {
      required: true,
      type: String
    },
    /*
     * If fixed is true for a choice then the position of this choice within the interaction must not be
     * changed by the delivery engine even if the immediately enclosing interaction supports the shuffling
     * of choices. If no value is specified then the choice is free to be shuffled. In Item Templates, the
     * visibility of choices can be controlled by setting the value(s) of an associated template variable
     * during template processing. For information about item templates see Item Templates.
     */
    fixed: {
      required: false,
      type: String,
      default: 'false'
    },
    /*
     * The identifier of a template variable that must have a base-type of identifier and be either single
     * of multiple cardinality. When the associated interaction is part of an Item Template the value of the
     * identified template variable is used to control the visibility of the choice. When a choice is hidden
     * it is not selectable and its content is not visible to the candidate unless otherwise stated.
     */
    templateIdentifier: {
      required: false,
      type: String
    },
    /*
     * The showHide characteristic determines how the visibility of the choice is controlled. If set
     * to 'show' then the choice is hidden by default and shown only if the associated template variable
     * matches, or contains, the identifier of the choice. If set to 'hide' then the choice is shown by
     * default and hidden if the associated template variable matches, or contains, the choice's identifier.
     */
    showHide: {
      required: false,
      type: String,
      default: 'show'
    }
  },

  data () {
    return {
      id: null
    }
  },

  inheritAttrs: true,

  methods: {

    handleMousedown (event) {
      // IMPORTANT to preventDefault here so this does not turn into a full Click event.
      event.preventDefault()
      // Pass this element to the parent component's optionClicked event handler.
      this.$parent.$emit('optionMousedown', { element: this.$refs.choice })
    },

    /**
     * @description Construct an id if the node has no defined id.
     * This is for accessibility.
     */
    createId () {
      if (this.$refs.choice.hasAttribute('id')) {
        // Node already has an authored id.  Use it.
        this.id = this.$refs.choice.getAttribute('id')
        return
      }

      // Node does not have an authored id.  Create one.
      this.id = 'inlinechoice_' + qtiAttributeValidation.randomString (5, 'a') + '_' + this.identifier
      this.$refs.choice.setAttribute('id', this.id)
    }

  },

  created () {
  },

  mounted () {
    this.createId()
  }
}
</script>

<style>
.qti-inline-choice {
  min-height: 1.6em;
}
</style>
