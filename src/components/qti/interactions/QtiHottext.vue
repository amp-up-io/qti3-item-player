<template>
  <span ref="hottext"
    :data-identifier="identifier"
    :aria-checked="checked"
    :tabindex="tabIndex"
    @click="handleClick"
    @keydown="handleKeydown"
    class="qti-hottext">
    <slot></slot>
  </span>
</template>

<script>
/*
 * A HotText area is used within the content of an hotTextInteraction to provide the individual choices. 
 * It must not contain any nested interactions or other hottext areas. When a hottext choice is hidden 
 * (by the value of an associated template variable) the content of the choice must still be presented 
 * to the candidate as if it were simply part of the surrounding material. In the case of hottext, the 
 * effect of hiding the choice is simply to make the run of text unselectable by the candidate.
 */
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'

const qtiAttributeValidation = new QtiAttributeValidation()

export default {
  name: 'QtiHottext',

  props: {
    identifier: {
      required: true,
      type: String
    },
    /*
     * The identifier of a template variable that must have a base-type of identifier and be either 
     * single of multiple cardinality. When the associated interaction is part of an Item Template the 
     * value of the identified template variable is used to control the visibility of the choice. When 
     * a choice is hidden it is not selectable and its content is not visible to the candidate unless 
     * otherwise stated.
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
      id: null,
      checked: 'false',
      isRadio: true,
      isDisabled: false,
      isQtiValid: true
    }
  },

  inheritAttrs: true,

  methods: {

    handleClick (event) {
      event.preventDefault()

      if (this.isDisabled) return

      if (this.isRadio) {
        this.triggerChecked(this.identifier, 'true')
      } else {
        this.toggleChecked()
        this.triggerChecked(this.identifier, this.checked)
      }
    },

    handleKeydown (event) {
      switch (event.code) {

        // Enable toggle with Space and Enter keys
        case 'Space':
        case 'Enter':

          event.stopPropagation()
          event.preventDefault()

          if (this.isDisabled) return

          this.toggleChecked()
          this.triggerChecked(this.identifier, this.checked)
          break

        default:
          break
      }
    },

    triggerChecked (identifier, checked) {
      const eventSetChecked = new CustomEvent('setChecked', {
          bubbles: true,
          cancelable: true,
          detail: { 'identifier': identifier, 'checked': checked }
        })

      this.$refs.hottext.dispatchEvent(eventSetChecked)
    },

    setChecked (checked) {
      this.checked = (checked ? 'true' : 'false')
    },

    isChecked () {
      return (this.checked === 'true')
    },

    toggleChecked () {
      this.checked = this.checked === 'true' ? 'false' : 'true'
    },

    setFocus () {
      this.$refs.hottext.focus()
    },

    setIsDisabled (isDisabled) {
      this.isDisabled = isDisabled
    },

    initialize () {
      switch (this.$parent.cardinality) {
        case 'multiple':
          this.isRadio = false
          this.tabIndex = 0
          break
        default:
          // Default to radio.
          this.isRadio = true
          this.tabIndex = 0
          break
      }
    },

    /**
     * @description Construct an id if the node has no defined id.
     * This is for accessibility.
     */
    createId () {
      if (this.$refs.hottext.hasAttribute('id')) {
        // Node already has an authored id.  Use it.
        this.id = this.$refs.hottext.getAttribute('id')
        return
      }

      // Node does not have an authored id.  Create one.
      this.id = 'hottext_' + qtiAttributeValidation.randomString (5, 'a') + '_' + this.identifier
      this.$refs.hottext.setAttribute('id', this.id)
    }

  },

  created () {
    this.initialize()
  },

  mounted () {
    if (this.isQtiValid) {
      try {
        this.createId()

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
.qti-hottext[aria-checked="false"] {
  color: var(--choice-ctrlh-color);
  background-color: var(--choice-ctrlh-bgc);
  border: 1px solid var(--choice-ctrlh-color);
  border-radius: .25rem;
  padding: 1px 3px;
  cursor: pointer;
}

.qti-unselected-hidden .qti-hottext[aria-checked="false"] {
  color: inherit;
  background-color: inherit;
  border: 0 solid var(--choice-ctrlh-color);
  border-radius: .25rem;
  padding: 1px 3px;
  cursor: pointer;
}

.qti-hottext[aria-checked="true"] {
  color: var(--choice-ctrlh-checked-color);
  background-color: var(--choice-ctrlh-checked-bgc);
  border: 1px solid var(--choice-ctrlh-checked-bgc);
  border-radius: .25rem;
  padding: 1px 3px;
  cursor: pointer;
}

.qti-unselected-hidden .qti-hottext[aria-checked="true"] {
  color: var(--choice-ctrlh-checked-color);
  background-color: var(--choice-ctrlh-checked-bgc);
  border: 0 solid var(--choice-ctrlh-checked-bgc);
  border-radius: .25rem;
  padding: 1px 3px;
  cursor: pointer;
}

.qti-hottext[aria-checked="false"]:focus {
  border: 1px solid transparent;
  border-color: var(--choice-ctrlh-focus-bc);
  color: var(--choice-ctrlh-color);
  box-shadow: var(--choice-control-focus-shadow);
}

.qti-unselected-hidden .qti-hottext[aria-checked="false"]:focus {
  border: 0 solid transparent;
  color: inherit;
  box-shadow: var(--choice-control-focus-shadow);
}

.qti-hottext[aria-checked="true"]:focus {
  border: 1px solid transparent;
  border-color: var(--choice-ctrlh-checked-color);
  color: var(--choice-ctrlh-checked-color);
  box-shadow: var(--choice-control-focus-shadow);
}

.qti-unselected-hidden .qti-hottext[aria-checked="true"]:focus {
  border: 0 solid transparent;
  border-color: var(--choice-ctrlh-checked-color);
  color: var(--choice-ctrlh-checked-color);
  box-shadow: var(--choice-control-focus-shadow);
}

.qti-hottext[aria-checked="false"]:focus-visible {
  border: 1px solid var(--choice-ctrlh-color);
  box-shadow: var(--choice-control-focus-shadow);
  outline: 0;
}

.qti-hottext[aria-checked="true"]:focus-visible {
  border: 1px solid var(--choice-ctrlh-checked-bgc);
  box-shadow: var(--choice-control-focus-shadow);
  outline: 0;
}

.qti-hottext:hover {
  filter: var(--choice-ctrlh-hover-brightness);
  padding: 1px 3px;
  cursor: pointer;
}

.qti-unselected-hidden .qti-hottext:hover {
  filter: none;
  border: 0 solid transparent;
  box-shadow: var(--choice-control-focus-shadow);
}
</style>
