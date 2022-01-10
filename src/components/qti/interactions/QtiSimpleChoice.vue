<template>
  <li
    ref="choice"
    :role="role"
    :aria-checked="checked"
    :tabindex="tabIndex"
    :data-identifier="identifier"
    @focus="handleFocus"
    @blur="handleBlur"
    @click="handleClick"
    @keydown="handleKeydown"
    class="qti-simple-choice">
    <div style="width:100%;">
      <div
        ref="label"
        class="qti-choice-label">
      </div>
      <div
        ref="description"
        class="qti-choice-description">
        <slot></slot>
      </div>
    </div>
  </li>
</template>

<script>
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'

const qtiAttributeValidation = new QtiAttributeValidation()

export default {
  name: 'QtiSimpleChoice',

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
      id: null,
      checked: 'false',
      isRadio: true,
      role: 'radio',
      tabIndex: '-1',
      hasMath: false
    }
  },

  inheritAttrs: true,

  methods: {

    handleClick () {
      if (this.isRadio) {
        this.$parent.$emit('setChecked', { 'identifier': this.identifier, 'checked': 'true' })
      } else {
        this.toggleChecked()
        this.$parent.$emit('setChecked', { 'identifier': this.identifier, 'checked': this.checked })
      }
    },

    handleKeydown (event) {
      let flag = false

      switch (event.code) {
        case 'Space':
          this.toggleChecked()
          this.$parent.$emit('setChecked', { 'identifier': this.identifier, 'checked': this.checked })
          flag = true
          break

        case 'Enter':
          this.toggleChecked()
          this.$parent.$emit('setChecked', { 'identifier': this.identifier, 'checked': this.checked })
          flag = true
          break

        case 'ArrowUp':
        case 'ArrowLeft':
          // Handle these keys if this is a radio button
          if (this.isRadio) {
            this.$parent.$emit('setFocusPreviousChoice', this.identifier)
            flag = true
          }
          break

        case 'ArrowDown':
        case 'ArrowRight':
          // Handle these keys if this is a radio button.
          if (this.isRadio) {
            this.$parent.$emit('setFocusNextChoice', this.identifier)
            flag = true
          }
          break

        default:
          break
      }

      if (flag) {
        event.stopPropagation()
        event.preventDefault()
      }
    },

    handleFocus () {
      // Notify parent that this choice has the focus.
      // In turn, this should set the aria-activedescendant attribute
      // on the choice container to this.id
      this.$parent.$emit('setActiveDescendant', this.id)
    },

    handleBlur () {
      // NOOP
    },

    setChecked (checked) {
      this.checked = (checked ? 'true' : 'false')
    },

    isChecked () {
      return (this.checked === 'true')
    },

    setTabIndex (tabIndex) {
      this.tabIndex = tabIndex
    },

    setFocus () {
      this.$refs.choice.focus()
    },

    setBlur () {
      this.$refs.choice.blur()
    },

    toggleChecked () {
      this.checked = this.checked === 'true' ? 'false' : 'true'
    },

    setLabel (label) {
      this.$refs.label.innerText = label
    },

    hideLabel () {
      this.$refs.label.classList.add('qti-hidden')
    },

    showLabel () {
      this.$refs.label.classList.remove('qti-hidden')
    },

    hideControl () {
      this.$refs.choice.classList.add('control-hidden')
    },

    initializeChoice () {
      switch (this.$parent.cardinality) {
        case 'multiple':
          this.role = 'checkbox'
          this.isRadio = false
          this.tabIndex = 0
          break
        default:
          // Default to radio.
          this.role = 'radio'
          this.isRadio = true
          this.tabIndex = -1
          break
      }
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
      this.id = 'choice_' + qtiAttributeValidation.randomString (5, 'a') + '_' + this.identifier
      this.$refs.choice.setAttribute('id', this.id)
    }

  },

  created () {
    this.initializeChoice()
  },

  mounted () {
    this.createId()
  }
}
</script>

<style>
[role="radio"],
[role="checkbox"] {
  display: inline-block;
  position: relative;
  padding: 4px 4px 4px 32px;
  outline: none;
  border: 1px dashed transparent;
  /* IMPORTANT: Must have following in order to work around Chrome-only column wrapping bug */
  -webkit-column-break-inside: avoid;
  cursor: pointer;
}

[role="radio"].control-hidden,
[role="checkbox"].control-hidden {
  padding-left: 2px;
  color: #2871BD;
  background-color: #F6F6F6;
  border: 1px solid #2871BD;
  border-radius: 3px;
}

[role="radio"][aria-checked="true"].control-hidden,
[role="checkbox"][aria-checked="true"].control-hidden {
  color: #FFF;
  background-color: #2873BA;
}

[role="radio"]::before,
[role="radio"]::after {
  position: absolute;
  top: 17px;
  left: 12px;
  transform: translate(-50%, -50%);
  content: '';
}

[role="radio"]:not(.control-hidden)::before {
  width: 16px;
  height: 16px;
  border: var(--rb-default-border);
  border-radius: 100%;
  background-image: var(--rb-default-bg-image);
}

[role="radio"]:not(.control-hidden):active::before {
  background-image: var(--rb-default-bg-image-active)
}

[role="radio"][aria-checked="true"]:not(.control-hidden)::before {
  border-color: var(--rb-default-border-color-checked);
  background: var(--rb-default-bg-checked);
  background-image: var(--rb-default-bg-image-checked);
}

[role="radio"][aria-checked="true"]:not(.control-hidden)::after {
  display: block;
  border: var(--rb-default-border-checked);
  border-radius: 100%;
  transform: translateY(-50%) translateX(-50%);
}

[role="radio"][aria-checked="mixed"]:not(.control-hidden):active::before,
[role="radio"][aria-checked="true"]:not(.control-hidden):active::before {
  background-image: var(--rb-default-bg-image-checked-active);
}

[role="radio"]:not(.control-hidden):hover::before {
  border-color: var(--rb-default-hover);
}

[role="checkbox"]:not(.control-hidden):focus,
[role="radio"]:not(.control-hidden):focus {
  border: 1px solid transparent;
  border-radius: 2px;
  border-color: var(--choice-default-border-focus);
  /*
  IMPORTANT:  causing problems with vertical stacking column wrapping.
  Try a less-prominent inset.
  -webkit-box-shadow:inset 0 1px 1px rgba(0,0,0,.075), 0 0 2px rgba(82,168,236,.6);
  -moz-box-shadow:inset 0 1px 1px rgba(0,0,0,.075), 0 0 2px rgba(82,168,236,.6);
  box-shadow:inset 0 1px 1px rgba(0,0,0,.075), 0 0 2px rgba(82,168,236,.6);
  */
}

[role="checkbox"].control-hidden:focus,
[role="radio"].control-hidden:focus {
  border: 1px dashed transparent;
  border-radius: 3px;
  border-color: #2871BD;
}

[role="checkbox"][aria-checked="true"].control-hidden:focus,
[role="radio"][aria-checked="true"].control-hidden:focus {
  border: 1px dashed transparent;
  border-radius: 3px;
  border-color: #FFF;
}

[role="radio"]:not(.control-hidden):focus::before {
  width: 16px;
  height: 16px;
  box-sizing: content-box;
  border-color: var(--rb-default-border-focus);
  border-width: 3px;
  border-radius: 100%;
  box-shadow: var(--rb-default-border-focus-inset);
}

[role="checkbox"]::before,
[role="checkbox"]::after {
  position: absolute;
  top: 17px;
  left: 12px;
  transform: translate(-50%, -50%);
  content: '';
}

[role="checkbox"]:not(.control-hidden)::before {
  width: 16px;
  height: 16px;
  border: var(--rb-default-border);
  border-radius: 0.2em;
  background-image: var(--rb-default-bg-image);
}

[role="checkbox"]:not(.control-hidden):active::before {
  background-image: var(--cb-default-bg-image-active);
}

[role="checkbox"][aria-checked="mixed"]:not(.control-hidden)::before,
[role="checkbox"][aria-checked="true"]:not(.control-hidden)::before {
  border-color: var(--rb-default-border-color-checked);
  background: var(--rb-default-bg-checked);
  background-image: var(--cb-default-bg-image-checked);
}

[role="checkbox"][aria-checked="mixed"]:not(.control-hidden)::after {
  display: block;
  width: 8px;
  border-bottom: 0.125em solid var(--foreground);
  transform: translate(-50%, -50%) rotateZ(45deg);
  transform-origin: center center;
}

[role="checkbox"][aria-checked="mixed"]:not(.control-hidden):active::after,
[role="checkbox"][aria-checked="true"]:not(.control-hidden)::after {
  display: block;
  width: 0.25em;
  height: 0.4em;
  border: solid var(--background);
  border-width: 0 0.125em 0.125em 0;
  transform: translateY(-65%) translateX(-50%) rotate(45deg);
}

[role="checkbox"][aria-checked="mixed"]:not(.control-hidden):active::before,
[role="checkbox"][aria-checked="true"]:not(.control-hidden):active::before {
  background-image: var(--cb-default-bg-image-checked-active);
}

[role="checkbox"]:focus {
  outline: none;
}

[role="checkbox"]:not(.control-hidden):focus::before {
  width: 16px;
  height: 16px;
  box-sizing: content-box;
  border-color: var(--rb-default-border-focus);
  border-width: 3px;
  border-radius: calc(0.2em + 3px);
  box-shadow: var(--rb-default-border-focus-inset);
}

.qti-choice-label {
  display: inline-block;
  vertical-align: top;
  width: 20px;
}
.qti-choice-label.qti-hidden {
    display: none;
    width: 0px;
}
.qti-choice-description {
  display: inline-block;
  vertical-align: top;
  padding-left: 2px;
  width: 80%;
}
.control-hidden .qti-choice-label,
.control-hidden .qti-choice-description {
  padding-left: 4px;
}
</style>
