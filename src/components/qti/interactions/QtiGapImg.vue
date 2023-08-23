<template>
  <li ref="choiceimage"
    :data-identifier="identifier"
    :data-match-max="matchMax"
    :data-match-min="matchMin"
    class="qti-gap-choice qti-gap-img source">
    <div
      ref="image"
      class="gap-choice-img draggable">
      <slot></slot>
    </div>
  </li>
</template>

<script>
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
//import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'

//const qtiAttributeValidation = new QtiAttributeValidation()

export default {
  name: 'QtiGapImg',

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
     * The maximum number of choices this choice may be associated with. If match-max is 0 then there is 
     * no restriction.
     */
    matchMax: {
      required: true,
      type: String
    },
    /*
     * The minimum number of choices this choice must be associated with to form a valid response. 
     * If match-min is 0 then the candidate is not required to associate this choice with any others at 
     * all. match-min must be less than or equal to the limit imposed by match-max.
     */
    matchMin: {
      required: false,
      type: String,
      default: '0'
    },
    /*
     * An optional label for the image object to be inserted.
     */
    objectLabel: {
      required: false,
      type: String,
      default: null
    },
    /*
     * This is the 'Y' co-ordinate of the top left corner of the image i.e. the value for the top.
     */
    top: {
      required: false,
      type: String,
      default: null
    },
    /*
     * This is the 'X' co-ordinate of the top left corner of the image i.e. the value for the left.
     */
    left: {
      required: false,
      type: String,
      default: null
    }
  },

  data () {
    return {
      isQtiValid: true
    }
  },

  inheritAttrs: true,

  methods: {
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
</style>
