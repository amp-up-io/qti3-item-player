<template>
  <button
    ref="root"
    class="qti-end-attempt-interaction"
    @click.prevent="handleEndAttempt"
    type="button">
    {{ title }}
  </button>
</template>

<script>
export default {
  name: 'EndAttemptGeneric',

  props: {
    title: {
      required: true,
      type: String
    }
  },

  data () {
    return {
      step: 1,
      isBtnDisabled: false
    }
  },

  methods: {

    getIsBtnDisabled () {
      return this.isBtnDisabled
    },

    setIsBtnDisabled (isBtnDisabled) {
      this.isBtnDisabled = isBtnDisabled
    },

    /**
     * @description Handle the end attempt click.
     */
    handleEndAttempt () {
      // The end attempt is handled by the
      // parent of this component.
      // Always pass true for the response.
      this.$parent.$emit('endAttempt', {
          response: true
        })
    },

    enable () {
      this.toggleButtonDisabled(false)
    },

    disable () {
      this.toggleButtonDisabled(true)
    },

    toggleButtonDisabled (disable) {
      if (disable)
        this.$refs.root.setAttribute('disabled', '')
      else
        this.$refs.root.removeAttribute('disabled')

      this.setIsBtnDisabled(disable)
    }

  },

  created () {
  },

  mounted () {
    // Notify parent that we are ready.
    // Pass ourselves to parent.
    this.$parent.$emit('endAttemptReady', {
        node: this
      })
  }
}
</script>

<style>
button.qti-end-attempt-interaction {
  display: inline-block;
  font-weight: 400;
  color: #505d69;
  text-align: center;
  vertical-align: middle;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  outline: 0!important;
  background-color: transparent;
  border: 1px solid transparent;
  padding: .47rem .75rem;
  font-size: .875rem;
  line-height: 1.5;
  border-radius: 30px;
  -webkit-transition: color .15s ease-in-out,background-color .15s ease-in-out,border-color .15s ease-in-out,-webkit-box-shadow .15s ease-in-out;
  transition: color .15s ease-in-out,background-color .15s ease-in-out,border-color .15s ease-in-out,-webkit-box-shadow .15s ease-in-out;
  transition: color .15s ease-in-out,background-color .15s ease-in-out,border-color .15s ease-in-out,box-shadow .15s ease-in-out;
  transition: color .15s ease-in-out,background-color .15s ease-in-out,border-color .15s ease-in-out,box-shadow .15s ease-in-out,-webkit-box-shadow .15s ease-in-out;
}

button.qti-end-attempt-interaction {
  color: var(--ea-button-secondary-color);
  background-color: var(--ea-button-secondary-bgc);
  border-color: var(--ea-button-secondary-bc);
}

button.qti-end-attempt-interaction:focus {
  color: var(--ea-button-secondary-focus-color);
  background-color: var(--ea-button-secondary-focus-bgc);
  border-color: var(--ea-button-secondary-focus-bc);
  -webkit-box-shadow: var(--choice-control-focus-shadow);
  box-shadow: var(--choice-control-focus-shadow);
}

button.qti-end-attempt-interaction:hover {
  filter: var(--ea-button-hover-brightness);
}

button.qti-end-attempt-interaction:not(:disabled) {
  cursor: pointer;
}

button.qti-end-attempt-interaction:disabled {
  pointer-events: none;
}
</style>
