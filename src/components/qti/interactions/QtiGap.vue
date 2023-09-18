<template>
  <span ref="gap"
    :data-identifier="identifier"
    :data-required="isRequired"
    data-match-max="1"
    :data-match-group="matchGroup"
    class="gap-match-gap">
  </span>
</template>

<script>
/*
 * This defines the gap structure that must only appear within a qti-gap-match-interaction.
 */
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'

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

/* dragger-placeholder has default .15rem bottom margin.
   Remove the margin-bottom when inside a gap. */
.gap-match-gap .dragger-placeholder {
  margin-bottom: 0;
}

.gap-match-gap.qti-input-width-1 {
  width: 1.7rem;
}

.gap-match-gap.qti-input-width-2 {
  width: 2.7rem;
}

.gap-match-gap.qti-input-width-3 {
  width: 3.7rem;
}

.gap-match-gap.qti-input-width-4 {
  width: 4.7rem;
}

.gap-match-gap.qti-input-width-5 {
  width: 5.6rem;
}

.gap-match-gap.qti-input-width-6 {
  width: 6.6rem;
}

.gap-match-gap.qti-input-width-10 {
  width: 10.4rem;
}

.gap-match-gap.qti-input-width-15 {
  width: 15.2rem;
}

.gap-match-gap.qti-input-width-20 {
  width: 20.0rem;
}

.gap-match-gap.qti-input-width-25 {
  width: 25.0rem;
}

.gap-match-gap.qti-input-width-30 {
  width: 30.0rem;
}

.gap-match-gap.qti-input-width-35 {
  width: 35.0rem;
}

.gap-match-gap.qti-input-width-40 {
  width: 40.0rem;
}

.gap-match-gap.qti-input-width-45 {
  width: 45.0rem;
}

.gap-match-gap.qti-input-width-50 {
  width: 50.0rem;
}

.gap-match-gap.qti-input-width-72 {
  width: 100%;
}
</style>
