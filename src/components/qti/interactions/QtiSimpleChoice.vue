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
  padding: 0.25rem 0.25rem 0.25rem 1.8rem;
  outline: none;
  border: 1px dashed transparent;
  /* IMPORTANT: Must have following in order to work
     around Chrome-only column wrapping bug */
  -webkit-column-break-inside: avoid;
  cursor: pointer;
}

[role="checkbox"]::before,
[role="checkbox"]::after,
[role="radio"]::before,
[role="radio"]::after {
  position: absolute;
  top: 1.05rem;
  left: .70rem;
  transform: translate(-50%, -50%);
  content: '';
}

[role="checkbox"]:not(.control-hidden)::before,
[role="radio"]:not(.control-hidden)::before {
  width: 1rem;
  height: 1rem;
  margin-top: 0;
  vertical-align: top;
  /* Default inner color of the control */
  background-color: var(--choice-control-bgc);
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
  /* The pale gray border around the control */
  border: var(--choice-control-border);
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  -webkit-print-color-adjust: exact;
  color-adjust: exact;
}

/* ============================================
   Overrides for narrower than iPad in portrait
   ============================================ */
@media (max-width:767px) {

  [role="radio"],
  [role="checkbox"] {
    padding: 0.25rem 0.25rem 0.25rem 1.5rem;
  }

}

[role="radio"]:not(.control-hidden)::before {
  border-radius: 50%;
}

[role="checkbox"]:not(.control-hidden)::before {
  border-radius: 0.25rem;
}

[role="checkbox"]:not(.control-hidden):active::before,
[role="radio"]:not(.control-hidden):active::before {
  filter: brightness(90%);
}

/* Choice focus */
[role="checkbox"]:not(.control-hidden):focus,
[role="radio"]:not(.control-hidden):focus {
  border: 1px solid transparent;
  border-radius: 0.15rem;
  border-color: var(--choice-focus-border);
}

/* Radio/Checkbox control focus */
[role="checkbox"]:not(.control-hidden):focus::before,
[role="radio"]:not(.control-hidden):focus::before {
  border-color: var(--choice-control-focus-border);
  outline: 0;
  /* Puts pale blue box shadow around the control */
  box-shadow: var(--choice-control-focus-shadow);
}

/* Radio/Checkbox control checked */
[role="checkbox"][aria-checked="true"]:not(.control-hidden)::before,
[role="radio"][aria-checked="true"]:not(.control-hidden)::before {
  background-color: var(--choice-control-checked-bg);
  border-color: var(--choice-control-checked-bc);
}

/* Radio control checked */
[role="radio"][aria-checked="true"]:not(.control-hidden)::before {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='-4 -4 8 8'%3e%3ccircle r='2' fill='currentColor' /%3e%3c/svg%3e");
}

/* Radio control checked for default color scheme */
.qti3-player-color-default [role="radio"][aria-checked="true"]:not(.control-hidden)::before,
.qti3-player-color-dgraymgray [role="radio"][aria-checked="true"]:not(.control-hidden)::before {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='-4 -4 8 8'%3e%3ccircle r='2' fill='%23fff' /%3e%3c/svg%3e");
}

.qti3-player-color-blueyellow [role="radio"][aria-checked="true"]:not(.control-hidden)::before {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='-4 -4 8 8'%3e%3ccircle r='2' fill='%23ffcc00' /%3e%3c/svg%3e");
}

.qti3-player-color-yellowblue [role="radio"][aria-checked="true"]:not(.control-hidden)::before {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='-4 -4 8 8'%3e%3ccircle r='2' fill='%23003398' /%3e%3c/svg%3e");
}

/* Checkbox control checked */
[role="checkbox"][aria-checked="true"]:not(.control-hidden)::before {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3e%3cpath fill='none' stroke='currentColor' stroke-linecap='round' stroke-linejoin='round' stroke-width='3' d='M6 10l3 3l6-6'/%3e%3c/svg%3e");
}

/* Checkbox control checked for default color scheme */
.qti3-player-color-default [role="checkbox"][aria-checked="true"]:not(.control-hidden)::before,
.qti3-player-color-dgraymgray [role="checkbox"][aria-checked="true"]:not(.control-hidden)::before {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3e%3cpath fill='none' stroke='%23fff' stroke-linecap='round' stroke-linejoin='round' stroke-width='3' d='M6 10l3 3l6-6'/%3e%3c/svg%3e");
}

.qti3-player-color-blueyellow [role="checkbox"][aria-checked="true"]:not(.control-hidden)::before {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3e%3cpath fill='none' stroke='%23ffcc00' stroke-linecap='round' stroke-linejoin='round' stroke-width='3' d='M6 10l3 3l6-6'/%3e%3c/svg%3e");
}

.qti3-player-color-yellowblue [role="checkbox"][aria-checked="true"]:not(.control-hidden)::before {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3e%3cpath fill='none' stroke='%23003398' stroke-linecap='round' stroke-linejoin='round' stroke-width='3' d='M6 10l3 3l6-6'/%3e%3c/svg%3e");
}

/* Radio/Checkbox control hover */
[role="checkbox"]:not(.control-hidden):hover::before,
[role="radio"]:not(.control-hidden):hover::before {
  /* border: 1px solid var(--choice-control-hover-bc); */
}

/* =====================
   Control Hidden styles
   ===================== */

[role="radio"].control-hidden,
[role="checkbox"].control-hidden {
  color: var(--choice-ctrlh-color);
  background-color: var(--choice-ctrlh-bgc);
  border: 1px solid var(--choice-ctrlh-color);
  border-radius: .25rem;
  margin-bottom: .5rem;
  padding-left: .2rem;
}

[role="radio"][aria-checked="true"].control-hidden,
[role="checkbox"][aria-checked="true"].control-hidden {
  color: var(--choice-ctrlh-checked-color);
  background-color: var(--choice-ctrlh-checked-bgc);
  border: 1px solid var(--choice-ctrlh-checked-bgc);
}

[role="checkbox"].control-hidden:focus,
[role="radio"].control-hidden:focus {
  border: 1px solid transparent;
  border-color: var(--choice-ctrlh-focus-bc);
  color: var(--choice-ctrlh-color);
  box-shadow: var(--choice-control-focus-shadow);
}

[role="checkbox"][aria-checked="true"].control-hidden:focus,
[role="radio"][aria-checked="true"].control-hidden:focus {
  border: 1px solid transparent;
  border-color: var(--choice-ctrlh-checked-color);
  color: var(--choice-ctrlh-checked-color);
}

[role="checkbox"].control-hidden:hover,
[role="radio"].control-hidden:hover {
  filter: var(--choice-ctrlh-hover-brightness);
}

/* ===============
   Disabled styles
   ===============*/

[role="radio"].disabled,
[role="checkbox"].disabled {
  pointer-events: none;
  filter: none;
  opacity: 0.6;
}

[role="radio"].control-hidden.disabled,
[role="checkbox"].control-hidden.disabled {
  pointer-events: none;
  filter: none;
  opacity: 0.75;
}

/* ============================
   Label and Description styles
   ============================ */

.qti-choice-label {
  display: inline-block;
  vertical-align: top;
  width: 1.25rem;
}

.qti-choice-label.qti-hidden {
  display: none;
  width: 0px;
}

.qti-choice-description {
  display: inline-block;
  vertical-align: top;
  width: 80%;
}

.control-hidden .qti-choice-label,
.control-hidden .qti-choice-description {
  padding-left: 0.25rem;
}
</style>
