<template>
  <span ref="gap"
    :data-identifier="identifier"
    :data-required="isRequired"
    data-match-max="1"
    class="gap-match-gap">
  </span>
</template>

<script>
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
//import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'

//const qtiAttributeValidation = new QtiAttributeValidation()

export default {
  name: 'QtiGap',

  props: {
    identifier: {
      required: true,
      type: String
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
    },
    /*
     * This is used to identify the set of entities that can be matched with this choice. This is used to 
     * enable the author to constrain the set of objects that can be matched with the target choice. This 
     * is a list of the identifiers for the objects that can be matched with this choice.
     */
    matchGroup: {
      required: false,
      type: String,
      default: ''
    },
    /*
     * If true then this gap must be filled by the candidate in order to form a valid response to the interaction.
     */
    required: {
      required: false,
      type: String,
      default: 'false'
    }
  },

  data () {
    return {
      id: null,
      isRequired: false,
      inputWidthClass: '',
      isQtiValid: true
    }
  },

  inheritAttrs: true,

  methods: {
  },

  created () {
    this.isRequired = this.required === 'false' ? false : true
  },

  mounted () {
    if (this.isQtiValid) {
      try {
        console.log('[' + this.$options.name + '][Identifier]', this.identifier)
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
.gap-match-gap {
  display: inline-block;
  vertical-align: middle;
  text-align: center;
  border: 1px solid;
  width: 100px;
  line-height: 28px;
  min-height: 29.6px;
  padding: 0;
}

.gap-match-gap.target-active {
  background-color: var(--order-target-active-bgc);
  border: 1px dashed var(--ea-button-secondary-bgc);
}

.gap-match-gap.target-active.active {
  background-color: var(--order-placeholder-color);
  border: 1px dashed var(--ea-button-secondary-bgc);
}
</style>
