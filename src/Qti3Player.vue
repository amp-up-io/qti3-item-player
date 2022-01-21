<template>
  <div
    ref="player"
    v-bind:class="[cssContainerClass, cssColorClass]">
    <component
      ref="item"
      @itemReady="handleItemReady"
      @itemCompleted="handleItemCompleted"
      @itemSuspendAttemptReady="handleSuspendAttemptReady"
      @itemEndAttemptReady="handleEndAttemptReady"
      v-bind:is="processedXml">
    </component>
  </div>
</template>

<script>
import Vue from 'vue'
import { store } from '@/store/store'
import { XmlFilters } from '@/shared/helpers/XmlFilters'
import Swal from 'sweetalert2'
import QtiAssessmentItem from '@/components/qti/QtiAssessmentItem'

Vue.component('qti-assessment-item', QtiAssessmentItem)

export default {
  name: 'Qti3Player',

  props: {
    containerClass: {
      type: String,
      required: false,
      default: 'qti3-player-container-fluid'
    },
    colorClass: {
      type: String,
      required: false,
      default: 'qti3-player-color-default'
    },
    suppressAlertMessages: {
      type: Boolean,
      required: false,
      default: false
    },
    suppressInvalidResponseMessages: {
      type: Boolean,
      required: false,
      default: false
    }
  },

  data () {
    return {
      item: null,  // Set to the qti-assessment-item component
      itemXml: '', // QTI XML string injected into the qti-assessment-item component
      xmlFilters: null,
      cssContainerClass: this.containerClass,
      cssColorClass: this.colorClass
    }
  },

  watch: {
    // When XML changes, re-run the post processing function
    itemXml () {
      this.postProcessing()
    },
  },

  computed: {
    processedXml () {
      let xml = this.itemXml

      // Hack 1: Clean out CDATA (not html5)
      xml = this.xmlFilters.filterCdata(xml)
      // Hack 2: Replace <style> tags with <amp-style>
      xml = this.xmlFilters.filterStyle(xml)
      // Hack 3: Replace <audio> tags with <amp-audio>
      xml = this.xmlFilters.filterAudio(xml)

      return {
        template: '<div id="qti-item-container">' + xml + '</div>'
      }
    }
  },

  methods: {

    /**
     * @description Main item loading method for the Qti3Player.  Accepts
     * a raw QTI 3 xml string and a configuration object.
     * @param {String} xml - string of qti-assessment-item (QTI 3) xml
     * @param {Object} configuration - object of the following schema:
     * {
     *   guid: string (a tracking guid)
     *   pnp: a PnpFactory object
     *   sessionControl: a sessionControl object
     *   state: itemState object containing any prior state
     * }
     */
    loadItemFromXml (xml, configuration) {
      console.log('[Qti3Player][LoadItemFromXml][configuration]', configuration)
      // Step 1: clear out the existing store
      store.resetAll()
      // Step 2: initialize the built-in variables
      store.initializeBuiltInDeclarations()
      // Step 2: set item player context
      this.loadItemContextFromConfiguration(configuration)
      // Step 3: load the item xml
      this.itemXml = xml
    },

    /**
     * @description  Initiate an getEndAttempt request in the QtiAssessmentItem
     * component.  When the method completes the Item will trigger the
     * 'itemEndAttemptReady' event - handled by the 'handleEndAttemptReady' method.
     * @param {String} target - used for tracking the invoker of this method.
     */
    endAttempt (target) {
      console.log('[Qti3Player][EndAttempt][' + target + ']')
      this.item.getEndAttempt(target)
    },

    /**
     * @description Initiate a getSuspendAttempt request in the QtiAssessmentItem
     * component.  When the method completes the Item will trigger the
     * 'itemSuspendAttemptReady' event - handled by the 'handleSuspendAttemptReady' method.
     * @param {String} target - used for tracking the invoker of this method.
     */
    suspendAttempt (target) {
      console.log('[Qti3Player][SuspendAttempt][' + target + ']')
      this.item.getSuspendAttempt(target)
    },

    /**
     * @description Event handler for the itemReady Event triggered by
     * the qti-assessment-item component when the component is loaded.
     * @param {Object} param - contains an 'item' property (the qti-assessment-item component)
     */
    handleItemReady (param) {
      console.log('[Qti3Player][ItemReady]', param.item)
      // Keep a handle on the component.
      this.item = param.item
      // Notify the store
      store.NotifyItemReady({
          item: this.item
        })
      // Notify listener that the qti-assessment-item component is loaded and ready.
      this.$emit('notifyQti3ItemReady', param.item)
    },

    /**
    * @description Event handler for the itemCompleted Event triggered by
    * the qti-assessment-item component when an Attempt has reached completion.
    * This will occur when an adaptive item reaches completionStatus=completed.
    */
    handleItemCompleted () {
      console.log('[Qti3Player][ItemCompleted]')
      this.$emit('notifyQti3ItemCompleted')
    },

    /**
     * @description event handler for the suspendAttemptReady event.
     * @param {Object} itemState - object containing a 'state' property and a 'target' property.
     */
    handleSuspendAttemptReady (itemState) {
      // Display any response validation messages.
      this.displayInvalidResponseMessages(itemState.state.validationMessages)
      // Notify listener that an Item State object is ready.
      this.$emit('notifyQti3SuspendAttemptCompleted', itemState)
    },

    /**
     * @description event handler for the endAttemptReady event.
     * @param {Object} itemState - object containing a 'state' property and a 'target' property.
     */
    handleEndAttemptReady (itemState) {
      // Display any response validation messages.
      this.displayInvalidResponseMessages(itemState.state.validationMessages)
      // Notify listener that an Item State object is ready.
      this.$emit('notifyQti3EndAttemptCompleted', itemState)
    },

    /**
     * @description Method for controller to get a handle on the item component.
     * @return {Component} a qti-assessment-item component
     */
    getItem () {
      return this.item
    },

    loadItemContextFromConfiguration (configuration) {
      if (typeof configuration === 'undefined') return

      // If the configuration properties exist, Load ItemContext from the configuration.
      if ('guid' in configuration) this.setItemContextGuid(configuration.guid)
      if ('pnp' in configuration) this.setItemContextPnp(configuration.pnp)
      if ('sessionControl' in configuration) this.setItemContextSessionControl(configuration.sessionControl)
      if ('state' in configuration) {
        this.setItemContextState(configuration.state)
        // This sets QTI_CONTEXT - if provided - to override the built-in declaration.
        store.restoreContextVariables()
      }
    },

    /**
     * @description Method to inject a pnp.
     * @param {Object} pnp - a pnp object built from a PnpFactory
     */
    setItemContextPnp (pnp) {
      store.setItemContextPnp(pnp)

      // Update the UI if textAppearance.colorStyle modified.
      const colorStyle = store.getItemContextPnp().getColorStyle()
      if (this.cssColorClass !== colorStyle) this.cssColorClass = colorStyle
    },

    /**
     * @description Method to inject a session control object.
     * @param {Object} sessionControl - a session control object built
     *                                  from a SessionControlFactory
     */
    setItemContextSessionControl (sessionControl) {
      store.setItemContextSessionControl(sessionControl)
    },

    /**
     * @description Method to inject a test controller's item tracking guid.
     * @param {String} guid
     */
    setItemContextGuid (guid) {
      store.setItemContextGuid(guid)
    },

    /**
     * @description Method to inject a prior item state.
     * @param {Object} state - a state object built
     *                         from an ItemStateFactory
     */
    setItemContextState (state) {
      store.setItemContextState(state)
    },

    /**
     * @description Handler for QTI item messages such as max selections messages.
     * @param {Object} message - object containing an icon property and a message property
     */
    displayAlertMessage (message) {
      if (!this.suppressAlertMessages) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: message.icon,
          html: message.message,
          showConfirmButton: false,
          showCloseButton: true,
          timer: 3000,
          timerProgressBar: true
        })
      }
      // Always notify listener
      this.$emit('notifyQti3ItemAlertEvent', message)
    },

    /**
     * @description Display validation messages if validateResponses=true AND
     * ok to display the messages in the Player.
     * @param {Array} messages - messages to be displayed
     */
    displayInvalidResponseMessages (messages) {
      if (store.getItemContextSessionControl().getValidateResponses() && !this.suppressInvalidResponseMessages) {
        messages.forEach((message) => {
          Swal.fire({
              toast: true,
              position: 'top-end',
              icon: 'error',
              html: message.message,
              showConfirmButton: false,
              showCloseButton: true,
              timer: 3000,
              timerProgressBar: true
            })
        })
      }
    },

    /**
     * @description After an item is updated, we may need to do some cleanup of
     * the DOM or perform other post processing.
     */
    postProcessing () {
      this.$nextTick(() => {
        // Item XML should be rendered, run MathJax over just the Item Container
        if (window.MathJax) {
          window.MathJax.Hub.Config({
            messageStyle: 'none',
            showProcessingMessages: false,
            tex2jax: {
              preview: 'none'
            }
          })
          window.MathJax.Hub.Queue([
            'Typeset',
            window.MathJax.Hub,
            'qti-item-container'
          ])
        }
      })
    }

  },

  created () {
    // Set up the PnpFactory and the Session Control Factory
    store.initializeItemContextPnp()
    store.initializeItemContextSessionControl()
    // Load the filters once.
    this.xmlFilters = new XmlFilters()
  },

  mounted () {
    console.log('[Qti3Player][Ready]')
    store.NotifyPlayerReady({
        player: this
      })
    this.$emit('notifyQti3PlayerReady', this)
  }
}
</script>

<style>

*,
*::before,
*::after {
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
}

.qti3-player-container,
.qti3-player-container-fluid {
  --blue: #3d8ef8;
  --indigo: #564ab1;
  --purple: #6f42c1;
  --pink: #e83e8c;
  --red: #fb4d53;
  --orange: #f1734f;
  --yellow: #f1b44c;
  --green: #11c46e;
  --teal: #008080;
  --cyan: #0db4d6;
  --rose: #ffd0ff;
  --white: #fff;
  --gray: #7c8a96;
  --gray-dark: #343a40;
  --primary: #3d8ef8;
  --success: #11c46e;
  --info: #0db4d6;
  --warning: #f1b44c;
  --danger: #fb4d53;
  --light: #eff2f7;
  --dark: #343a40;
  --darker: #212529;
  --black: #000;
  --breakpoint-xs: 0;
  --breakpoint-sm: 576px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 992px;
  --breakpoint-xl: 1200px;
  --font-family-sans-serif: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "Liberation Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
  --font-family-monospace: SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  --foreground: var(--darker);
  --background: var(--white);
  --secondary: #dbdbdb;
  --secondary-complement: var(--darker);
  --hr-border: 1px solid var(--secondary);
  --table-border-color: var(--black);
  --well-bg: #f5f5f5;
  --well-border: 1px solid #e3e3e3;
  --well-box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.05);
  /* Overall choice focus border */
  --choice-focus-border: #86b7fe;
  /* Default inner background color of the control */
  --choice-control-bgc: var(--white);
  /* The pale gray border around the control */
  --choice-control-border: 1px solid rgba(0, 0, 0, 0.75);
  --choice-control-checked-bc: #0d6efd;
  --choice-control-checked-bg: #0d6efd;
  --choice-control-focus-border: #86b7fe;
  --choice-control-focus-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
  --choice-control-hover-bc: #86b7fe;
  /* Control Hidden colors */
  --choice-ctrlh-color: #2871bd;
  --choice-ctrlh-bgc: var(--light);
  --choice-ctrlh-checked-color: var(--white);
  --choice-ctrlh-checked-bgc: #2871bd;
  --choice-ctrlh-focus-bc: #2871bd;
  --choice-ctrlh-focus-checked-bc: var(--white);
  --choice-ctrlh-hover-brightness: brightness(95%);
  /* Inline Choice colors */
  --ic-focus-fc: var(--foreground);
  --ic-focus-bc: #bde4ff;
  /* End Attempt Button colors */
  --ea-button-secondary-color: var(--background);
  --ea-button-secondary-bgc: var(--gray);
  --ea-button-secondary-bc: var(--secondary-complement);
  --ea-button-secondary-hover-color: var(--gray-dark);
  --ea-button-secondary-hover-bgc: var(--background);
}

/* Default foreground / background colors */
.qti3-player-color-default {
  --foreground: var(--darker);
  --background: var(--white);
}

/* Default - reverse polarity */
.qti3-player-color-defaultreverse {
  --foreground: var(--white);
  --background: var(--darker);
  --table-border-color: var(--white);
  /* Overall choice focus border */
  --choice-focus-border: var(--white);
  /* Default inner background color of the control */
  --choice-control-bgc: var(--white);
  /* The pale gray border around the control */
  --choice-control-border: 1px solid var(--white);
  --choice-control-checked-bc: var(--white);
  --choice-control-checked-bg: var(--white);
  --choice-control-focus-border: var(--white);
  --choice-control-focus-shadow: 0 0 0 0.25rem rgba(255, 255, 255, 0.5);
  --choice-control-hover-bc: var(--white);
  /* Control Hidden colors */
  --choice-ctrlh-color: #2871bd;
  --choice-ctrlh-bgc: var(--light);
  --choice-ctrlh-checked-color: var(--white);
  --choice-ctrlh-checked-bgc: #2871bd;
  --choice-ctrlh-focus-bc: #2871bd;
  --choice-ctrlh-focus-checked-bc: var(--white);
  --choice-ctrlh-hover-brightness: brightness(95%);
  /* Inline Choice colors */
  --ic-focus-fc: var(--background);
  --ic-focus-bc: #bde4ff;
}

/* High Contrast */
.qti3-player-color-blackwhite {
  --foreground: var(--black);
  --background: var(--white);
  --secondary: var(--black);
  --secondary-complement: var(--white);
  --hr-border: 1px solid var(--black);
  --table-border-color: var(--black);
  /* Overall choice focus border */
  --choice-focus-border: #86b7fe;
  /* Default inner background color of the control */
  --choice-control-bgc: var(--white);
  /* The pale gray border around the control */
  --choice-control-border: 1px solid rgba(0, 0, 0, 1.0);
  --choice-control-checked-bc: var(--black);
  --choice-control-checked-bg: var(--white);
  --choice-control-focus-border: var(--black);
  --choice-control-focus-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
  --choice-control-hover-bc: rgba(0, 0, 0, 0.5);
  /* Control Hidden colors */
  --choice-ctrlh-color: var(--black);
  --choice-ctrlh-bgc: var(--white);
  --choice-ctrlh-checked-color: var(--white);
  --choice-ctrlh-checked-bgc: var(--black);
  --choice-ctrlh-focus-bc: var(--black);
  --choice-ctrlh-focus-checked-bc: var(--white);
  --choice-ctrlh-hover-brightness: brightness(95%);
  /* Inline Choice colors */
  --ic-focus-fc: var(--white);
  --ic-focus-bc: var(--black);
}

/* High Contrast - reverse polarity */
.qti3-player-color-whiteblack {
  --foreground: var(--white);
  --background: var(--black);
  --secondary: var(--white);
  --secondary-complement: var(--black);
  --hr-border: 1px solid var(--white);
  --table-border-color: var(--white);
  /* Overall choice focus border */
  --choice-focus-border: var(--white);
  /* Default inner background color of the control */
  --choice-control-bgc: var(--white);
  /* The pale gray border around the control */
  --choice-control-border: 1px solid var(--white);
  --choice-control-checked-bc: var(--white);
  --choice-control-checked-bg: var(--white);
  --choice-control-focus-border: var(--white);
  --choice-control-focus-shadow: 0 0 0 0.25rem rgba(255, 255, 255, 0.5);
  --choice-control-hover-bc: var(--white);
  /* Control Hidden colors */
  --choice-ctrlh-color: var(--white);
  --choice-ctrlh-bgc: var(--black);
  --choice-ctrlh-checked-color: var(--black);
  --choice-ctrlh-checked-bgc: var(--white);
  --choice-ctrlh-focus-bc: var(--white);
  --choice-ctrlh-focus-checked-bc: var(--white);
  --choice-ctrlh-hover-brightness: brightness(90%);
  /* Inline Choice colors */
  --ic-focus-fc: var(--secondary-complement);
  --ic-focus-bc: var(--secondary);
}

.qti3-player-color-blackrose {
  --foreground: var(--black);
  --background: var(--rose);
  --secondary: #c6bcf8;
  --secondary-complement: var(--black);
  --hr-border: 1px solid var(--secondary);
  --table-border-color: var(--black);
  /* Overall choice focus border */
  --choice-focus-border: #86b7fe;
  /* Default inner background color of the control */
  --choice-control-bgc: var(--rose);
  /* The pale gray border around the control */
  --choice-control-border: 1px solid rgba(0, 0, 0, 1.0);
  --choice-control-checked-bc: var(--black);
  --choice-control-checked-bg: var(--rose);
  --choice-control-focus-border: var(--black);
  --choice-control-focus-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
  --choice-control-hover-bc: rgba(0, 0, 0, 0.5);
  /* Control Hidden colors */
  --choice-ctrlh-color: var(--black);
  --choice-ctrlh-bgc: var(--rose);
  --choice-ctrlh-checked-color: var(--rose);
  --choice-ctrlh-checked-bgc: var(--black);
  --choice-ctrlh-focus-bc: var(--black);
  --choice-ctrlh-focus-checked-bc: var(--rose);
  --choice-ctrlh-hover-brightness: brightness(95%);
  /* Inline Choice colors */
  --ic-focus-fc: var(--secondary-complement);
  --ic-focus-bc: var(--secondary);
}

.qti3-player-color-roseblack {
  --foreground: var(--rose);
  --background: var(--black);
  --secondary: #c6bcf8;
  --secondary-complement: var(--black);
  --hr-border: 1px solid var(--secondary);
  --table-border-color: var(--rose);
  /* Overall choice focus border */
  --choice-focus-border: var(--rose);
  /* Default inner background color of the control */
  --choice-control-bgc: var(--rose);
  /* The pale gray border around the control */
  --choice-control-border: 1px solid var(--rose);
  --choice-control-checked-bc: var(--rose);
  --choice-control-checked-bg: var(--rose);
  --choice-control-focus-border: var(--rose);
  --choice-control-focus-shadow: 0 0 0 0.25rem rgba(255, 255, 255, 0.5);
  --choice-control-hover-bc: var(--rose);
  /* Control Hidden colors */
  --choice-ctrlh-color: var(--rose);
  --choice-ctrlh-bgc: var(--black);
  --choice-ctrlh-checked-color: var(--black);
  --choice-ctrlh-checked-bgc: var(--rose);
  --choice-ctrlh-focus-bc: var(--rose);
  --choice-ctrlh-focus-checked-bc: var(--rose);
  --choice-ctrlh-hover-brightness: brightness(90%);
  /* Inline Choice colors */
  --ic-focus-fc: var(--secondary-complement);
  --ic-focus-bc: var(--secondary);
}

.qti3-player-color-mgraydgray {
  --foreground: #e5e5e5;
  --background: #666;
  --secondary: #c8c8c8;
  --secondary-complement: var(--black);
  --hr-border: 1px solid var(--secondary);
  --table-border-color: var(--foreground);
  /* Overall choice focus border */
  --choice-focus-border: var(--foreground);
  /* Default inner background color of the control */
  --choice-control-bgc: var(--foreground);
  /* The pale gray border around the control */
  --choice-control-border: 1px solid var(--foreground);
  --choice-control-checked-bc: var(--foreground);
  --choice-control-checked-bg: var(--foreground);
  --choice-control-focus-border: var(--foreground);
  --choice-control-focus-shadow: 0 0 0 0.25rem rgba(255, 255, 255, 0.5);
  --choice-control-hover-bc: var(--foreground);
  /* Control Hidden colors */
  --choice-ctrlh-color: var(--foreground);
  --choice-ctrlh-bgc: var(--background);
  --choice-ctrlh-checked-color: var(--background);
  --choice-ctrlh-checked-bgc: var(--foreground);
  --choice-ctrlh-focus-bc: var(--foreground);
  --choice-ctrlh-focus-checked-bc: var(--foreground);
  --choice-ctrlh-hover-brightness: brightness(90%);
  /* Inline Choice colors */
  --ic-focus-fc: var(--secondary-complement);
  --ic-focus-bc: var(--secondary);
}

.qti3-player-color-dgraymgray {
  --foreground: #666;
  --background: #e5e5e5;
  --secondary: #c8c8c8;
  --secondary-complement: var(--black);
  --hr-border: 1px solid var(--secondary);
  --table-border-color: var(--foreground);
  /* Overall choice focus border */
  --choice-focus-border: var(--foreground);
  /* Default inner background color of the control */
  --choice-control-bgc: var(--foreground);
  /* The pale gray border around the control */
  --choice-control-border: 1px solid var(--foreground);
  --choice-control-checked-bc: var(--foreground);
  --choice-control-checked-bg: var(--foreground);
  --choice-control-focus-border: var(--foreground);
  --choice-control-focus-shadow: 0 0 0 0.25rem rgba(255, 255, 255, 0.5);
  --choice-control-hover-bc: var(--foreground);
  /* Control Hidden colors */
  --choice-ctrlh-color: var(--foreground);
  --choice-ctrlh-bgc: var(--background);
  --choice-ctrlh-checked-color: var(--background);
  --choice-ctrlh-checked-bgc: var(--foreground);
  --choice-ctrlh-focus-bc: var(--foreground);
  --choice-ctrlh-focus-checked-bc: var(--foreground);
  --choice-ctrlh-hover-brightness: brightness(90%);
  /* Inline Choice colors */
  --ic-focus-fc: var(--secondary-complement);
  --ic-focus-bc: var(--secondary);
}

.qti3-player-color-yellowblue {
  --foreground: #ffcc00;
  --background: #003398;
  --secondary: #dbdbdb;
  --secondary-complement: var(--black);
  --hr-border: 1px solid var(--secondary);
  --table-border-color: var(--foreground);
  /* Overall choice focus border */
  --choice-focus-border: var(--foreground);
  /* Default inner background color of the control */
  --choice-control-bgc: var(--foreground);
  /* The pale gray border around the control */
  --choice-control-border: 1px solid var(--foreground);
  --choice-control-checked-bc: var(--foreground);
  --choice-control-checked-bg: var(--foreground);
  --choice-control-focus-border: var(--foreground);
  --choice-control-focus-shadow: 0 0 0 0.25rem rgba(255, 255, 255, 0.5);
  --choice-control-hover-bc: var(--foreground);
  /* Control Hidden colors */
  --choice-ctrlh-color: var(--foreground);
  --choice-ctrlh-bgc: var(--background);
  --choice-ctrlh-checked-color: var(--background);
  --choice-ctrlh-checked-bgc: var(--foreground);
  --choice-ctrlh-focus-bc: var(--foreground);
  --choice-ctrlh-focus-checked-bc: var(--foreground);
  --choice-ctrlh-hover-brightness: brightness(90%);
  /* Inline Choice colors */
  --ic-focus-fc: var(--secondary-complement);
  --ic-focus-bc: var(--secondary);
}

.qti3-player-color-blueyellow {
  --foreground: #003398;
  --background: #ffcc00;
  --secondary: #dbdbdb;
  --secondary-complement: var(--black);
  --hr-border: 1px solid var(--secondary);
  --table-border-color: var(--foreground);
  /* Overall choice focus border */
  --choice-focus-border: var(--foreground);
  /* Default inner background color of the control */
  --choice-control-bgc: var(--foreground);
  /* The pale gray border around the control */
  --choice-control-border: 1px solid var(--foreground);
  --choice-control-checked-bc: var(--foreground);
  --choice-control-checked-bg: var(--foreground);
  --choice-control-focus-border: var(--foreground);
  --choice-control-focus-shadow: 0 0 0 0.25rem rgba(255, 255, 255, 0.5);
  --choice-control-hover-bc: var(--foreground);
  /* Control Hidden colors */
  --choice-ctrlh-color: var(--foreground);
  --choice-ctrlh-bgc: var(--background);
  --choice-ctrlh-checked-color: var(--background);
  --choice-ctrlh-checked-bgc: var(--foreground);
  --choice-ctrlh-focus-bc: var(--foreground);
  --choice-ctrlh-focus-checked-bc: var(--foreground);
  --choice-ctrlh-hover-brightness: brightness(90%);
  /* Inline Choice colors */
  --ic-focus-fc: var(--secondary-complement);
  --ic-focus-bc: var(--secondary);
}

.qti3-player-container,
.qti3-player-container-fluid {
  margin: 0;
  font-size: 16px;
  font-weight: 400;
  line-height: 1.6;
  font-family: "Roboto", sans-serif;
  color: var(--foreground);
  text-align: left;
  background-color: var(--background);
}

/* Set default non-fluid container to live nicely (plenty of whitespace/padding/margin) with
   screen resolution above 1024 pixels (iPad in landscape) and below 1200 pixels */
.qti3-player-container {
  width: 940px;
  margin-right: auto;
  margin-left: auto;
  *zoom:1;
}

.qti3-player-container-fluid {
  width: 100%;
  padding-right: 12px;
  padding-left: 12px;
  margin-right: auto;
  margin-left: auto;
}

.qti3-player-container:before,
.qti3-player-container:after,
.qti3-player-container-fluid:before,
.qti3-player-container-fluid:after {
  display: table;
  content: "";
  line-height: 0;
}

.qti3-player-container:after,
.qti3-player-container-fluid:after {
  clear: both;
}

/* narrower than iPad in portrait */
@media (max-width:767px){
  .qti3-player-container { width: auto; }
}

/* Between iPad in portrait and landscape */
@media (min-width:768px) and (max-width:979px) {
  .qti3-player-container { max-width: 724px; }
}

/* Typical desktop or chromebook */
@media (min-width:1200px) {
  .qti3-player-container { max-width: 1170px; }
}

/* Sweet Alert should use same font-family as player */
.swal2-popup {
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "Liberation Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
}
</style>
