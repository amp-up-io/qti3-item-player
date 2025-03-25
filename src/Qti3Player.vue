<template>
  <div
    ref="player"
    v-bind:class="[cssContainerClass, cssContainerPaddingClass, cssColorClass]">
    <component
      ref="item"
      @itemReady="handleItemReady"
      @itemCompleted="handleItemCompleted"
      @itemSuspendAttemptReady="handleSuspendAttemptReady"
      @itemEndAttemptReady="handleEndAttemptReady"
      @itemScoreAttemptReady="handleScoreAttemptReady"
      @itemCatalogEvent="handleCatalogEvent"
      @itemNewTemplate="handleNewTemplate"
      @itemNewTemplateCompleted="handleNewTemplateCompleted"
      v-bind:is="processedXml">
    </component>
    <catalog-dialog ref="catalogdialog" />
  </div>
</template>

<script>
import Vue from 'vue'
import { store } from '@/store/store'
import { XmlFilters } from '@/shared/helpers/XmlFilters'
import Swal from 'sweetalert2'
import CatalogDialog from '@/shared/components/catalog/CatalogDialog'
import QtiAssessmentItem from '@/components/qti/QtiAssessmentItem'
import AmpAudio from '@/components/qti/html/AmpAudio.vue'
import AmpVideo from '@/components/qti/html/AmpVideo.vue'

Vue.component('catalog-dialog', CatalogDialog)
Vue.component('qti-assessment-item', QtiAssessmentItem)
Vue.component('amp-audio', AmpAudio)
Vue.component('amp-video', AmpVideo)

export default {
  name: 'Qti3Player',

  props: {
    containerClass: {
      type: String,
      required: false,
      default: 'qti3-player-container-fluid'
    },
    containerPaddingClass: {
      type: String,
      required: false,
      default: 'qti3-player-container-padding-0'
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
    },
    suppressCatalogMessages: {
      type:Boolean,
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
      cssContainerPaddingClass: this.containerPaddingClass,
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
      // Hack 3: Replace <audio> tags with <amp-audio>, <video> tags with <amp-video>
      xml = this.xmlFilters.filterMedia(xml)

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
      // Step 2: reset (close, re-center, etc) Catalog Dialog
      this.resetCatalogComponents()
      // Step 3: initialize the built-in variables
      store.initializeBuiltInDeclarations()
      // Step 4: set item player context
      this.loadItemContextFromConfiguration(configuration)
      // Step 5: load the item xml
      this.itemXml = xml
    },

    /**
     * @description  Initiate a getEndAttempt request in the QtiAssessmentItem
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
    * @description Initiate a getScoreAttempt request in the QtiAssessmentItem
     * component.  This executes response processing and reports the 
     * serialized state of the variables. When the method completes the Item will
     *  trigger the 'itemScoreAttemptReady' event - handled by the 
     * 'handleScoreAttemptReady' method.
     * @param {String} target - used for tracking the invoker of this method.
     */
    scoreAttempt (target) {
      console.log('[Qti3Player][ScoreAttempt][' + target + ']')
      this.item.getScoreAttempt(target)
    },

    newTemplate () {
      console.log('[Qti3Player][NewTemplate][Started]')
      this.item.newTemplate()
    },

    /**
     * @description Event handler for the itemReady Event triggered by
     * the qti-assessment-item component when the component is loaded.
     * @param {Object} param - contains an 'item' property (the qti-assessment-item component)
     */
    handleItemReady (param) {
      console.log('[Qti3Player][ItemReady]')
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
      // Notify listener that completionStatus=completed
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
     * @description event handler for the scoreAttemptReady event.
     * @param {Object} itemState - object containing a 'state' property and a 'target' property.
     */
     handleScoreAttemptReady (itemState) {
      // Notify listener that an Item State object is ready.
      this.$emit('notifyQti3ScoreAttemptCompleted', itemState)
    },

    /**
     * @description event handler initially developed for handling Catalog
     * Glossary events.  In turn, this takes appropriate action based on
     * the type of the catalogEvent.
     * @param {Object} catalogEvent - the event payload
     */
    handleCatalogEvent (catalogEvent) {
      // Display catalog events of type 'glossary'
      this.displayCatalogEvent(catalogEvent)
      // Notify listener that a catalog event occured
      this.$emit('notifyQti3ItemCatalogEvent', catalogEvent)
    },

    /**
     * @description event handler for any actions the Player may want
     * to take when the QtiAssessmentItem component is generating a new
     * template.
     */
    handleNewTemplate () {
      // Close/reset Catalog components
      this.resetCatalogComponents()
    },

    /**
     * @description event handler for completion of a new template.
     */
    handleNewTemplateCompleted () {
      console.log('[Qti3Player][NewTemplate][Completed]')
      // Notify listener that we are finished generating a new template
      this.$emit('itemNewTemplateCompleted')
    },

    /**
     * @description Method for controller to get a handle on the item component.
     * @return {Component} a qti-assessment-item component
     */
    getItem () {
      return this.item
    },

    /**
     * @description Method to empty the item's XML and reset the store.
     */
    resetItem () {
      // Step 1: clear out the existing store
      store.resetAll()
      // Step 2: reset (close, re-center, etc) Catalog Dialog
      this.resetCatalogComponents()
      // Step 3: load empty xml
      this.itemXml = ''
    },

    loadItemContextFromConfiguration (configuration) {
      if (typeof configuration === 'undefined') return

      // If the configuration properties exist, Load ItemContext from the configuration.
      if ('guid' in configuration) this.setItemContextGuid(configuration.guid)
      if ('pnp' in configuration) this.setItemContextPnp(configuration.pnp)
      if ('sessionControl' in configuration) this.setItemContextSessionControl(configuration.sessionControl)
      if ('status' in configuration) this.setItemLifecycleStatus(configuration.status)
      if ('state' in configuration) {
        this.setItemContextState(configuration.state)
        // This sets QTI_CONTEXT - if provided - to override the built-in declaration.
        store.restoreContextVariables()
      }

      // Pull the pciContext if it exists in the configuration.
      if ('pciContext' in configuration) {
        store.setPciContext(configuration.pciContext)
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
     * @description Method to inject a test controller's item lifecycle status.
     * @param {String} status - String from the set of:
     *                         { null | 'initial' | 'interacting' |
     *                           'closed' | 'review' | 'solution' }
     */
    setItemLifecycleStatus (status) {
      store.setItemLifecycleStatus(status)
    },

    /**
     * @description Method to bind (or rebind) the item to the PNP/Catalog.
     * This effectively clears out all current Catalog bindings
     * and rebinds any catalog-idref's with current PNP settings.
     */
    bindCatalog () {
      console.log('[Qti3Player][BindCatalog]')
      this.resetCatalogComponents()
      this.item.bindCatalog()
    },

    resetCatalogComponents () {
      // Reset (close, re-center, etc) Catalog Dialog
      this.$refs.catalogdialog.reset()
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
     * @description Display catalog event messages if ok to display the
     * messages in the Player.
     * @param {Object} catalogEvent - catalog content to be displayed
     */
    displayCatalogEvent (catalogEvent) {
      if (!this.suppressCatalogMessages) {
        // Only Catalog 'glossary' events handled.
        // Display CatalogDialog.
        if (catalogEvent.type === 'glossary') {
          this.$refs.catalogdialog.setContent(catalogEvent)
          this.$refs.catalogdialog.show()
        }
      }
    },

    /**
     * @description Utility method to dynamically update all item PCI 
     * rendering properties.
     */
    pciSetRenderingProperties () {
      // Force PCI setRenderingProperties
      store.pciSetRenderingProperties()
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
            menuSettings: {
              inTabOrder: false
            },
            tex2jax: {
              inlineMath: [
                ['$$','$$'],
                ["\\(","\\)"]
              ],
              displayMath: [
                ['\\[','\\]']
              ],
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
    // Set up the PciMessageListener
    store.initializePciMessageListener()
    // Load the filters once.
    this.xmlFilters = new XmlFilters()
  },

  mounted () {
    console.log('[Qti3Player][Ready]')
    store.NotifyPlayerReady({
        player: this
      })
    this.$emit('notifyQti3PlayerReady', this)
  },

  beforeDestroy () {
    // Tear down the PciMessageListener
    store.removePciMessageListener()
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
  --lblue: #add8e6;
  --lchiffon: #fffacd;
  --white: #fff;
  --gray: #7c8a96;
  --gray-dark: #343a40;
  --primary: #3d8ef8;
  --success: #11c46e;
  --info: #0db4d6;
  --warning: #f1b44c;
  --danger: #fb4d53;
  --light: #eff2f7;
  --lighter: #f5f5f5;
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
  --hr-border: 1px solid var(--black);
  --table-border-color: var(--black);
  --well-bg: #f5f5f5;
  --well-border: 1px solid #e3e3e3;
  --well-box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.05);
  /* Item Card */
  --item-card-panel-bgc: rgba(0,0,0,.05);
  --item-card-panel-bc: rgba(0,0,0,.3);
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
  /* Sbac colors */
  --choice-sbac-checked-color: var(--background);
  --choice-sbac-unchecked-color: var(--foreground);
  --choice-sbac-control-checked-bc: #0d6efd;
  --choice-sbac-control-checked-bg: #0d6efd;
  --choice-sbac-control-unchecked-bg: var(--white);
  /* Control Hidden colors */
  --choice-ctrlh-color: #2871bd;
  --choice-ctrlh-bgc: var(--lighter);
  --choice-ctrlh-lblbgc: var(--white);
  --choice-ctrlh-desccolor: var(--foreground);
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
  --ea-button-secondary-bgc: #6c757d;
  --ea-button-secondary-bc: #6c757d;
  --ea-button-secondary-focus-color: var(--white);
  --ea-button-secondary-focus-bgc: #697783;
  --ea-button-secondary-focus-bc: #63707c;
  --ea-button-hover-brightness: brightness(95%);
  /* Editor colors */
  --ed-bc: var(--gray-dark);
  --ed-bq-color: #ccc;
  /* Order colors */
  --order-target-active-color: var(--foreground);
  --order-target-active-bgc: #bbcef1;
  --order-placeholder-color: #d3d5d7;
  /* Audio/Video slider */
  --slider-track: var(--gray);
  --slider-focus-track: #86b7fe;
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
  --hr-border: 1px solid var(--white);
  --table-border-color: var(--white);
  --well-bg: #444;
  --well-border: 1px solid #222;
  --well-box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.5);
  /* Item Card */
  --item-card-panel-bgc: rgba(255, 255, 255, .05);
  --item-card-panel-bc: rgba(255, 255, 255, .3);
  /* Overall choice focus border */
  --choice-focus-border: var(--white);
  /* Default inner background color of the control */
  --choice-control-bgc: var(--darker);
  /* The pale gray border around the control */
  --choice-control-border: 1px solid var(--white);
  --choice-control-checked-bc: #0d6efd;
  --choice-control-checked-bg: #0d6efd;
  --choice-control-focus-border: var(--white);
  --choice-control-focus-shadow: 0 0 0 0.25rem rgba(255, 255, 255, 0.5);
  --choice-control-hover-bc: var(--white);
  /* Sbac colors */
  --choice-sbac-checked-color: var(--foreground);
  --choice-sbac-unchecked-color: var(--background);
  --choice-sbac-control-checked-bc: #0d6efd;
  --choice-sbac-control-checked-bg: #0d6efd;
  --choice-sbac-control-unchecked-bg: var(--darker);
  /* Control Hidden colors */
  --choice-ctrlh-color: #2871bd;
  --choice-ctrlh-bgc: var(--lighter);
  --choice-ctrlh-lblbgc: var(--white);
  --choice-ctrlh-desccolor: var(--background);
  --choice-ctrlh-checked-color: var(--white);
  --choice-ctrlh-checked-bgc: #2871bd;
  --choice-ctrlh-focus-bc: #2871bd;
  --choice-ctrlh-focus-checked-bc: var(--white);
  --choice-ctrlh-hover-brightness: brightness(95%);
  /* Inline Choice colors */
  --ic-focus-fc: var(--background);
  --ic-focus-bc: #bde4ff;
  /* End Attempt Button colors */
  --ea-button-secondary-color: var(--foreground);
  --ea-button-secondary-bgc: #6c757d;
  --ea-button-secondary-bc: #6c757d;
  --ea-button-secondary-focus-color: var(--foreground);
  --ea-button-secondary-focus-bgc: #697783;
  --ea-button-secondary-focus-bc: #63707c;
  /* Editor colors */
  --ed-bc: #ddd;
  --ed-bq-color: #ccc;
  /* Order colors */
  --order-target-active-color: var(--darker);
  --order-target-active-bgc: #bbcef1;
  --order-placeholder-color: #d3d5d7;
}

/* High Contrast */
.qti3-player-color-blackwhite {
  --foreground: var(--black);
  --background: var(--white);
  --secondary: var(--black);
  --secondary-complement: var(--white);
  --hr-border: 1px solid var(--black);
  --table-border-color: var(--black);
  --well-bg: #eee;
  --well-border: 1px solid #ddd;
  --well-box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.1);
  /* Overall choice focus border */
  --choice-focus-border: #86b7fe;
  /* Default inner background color of the control */
  --choice-control-bgc: var(--white);
  /* The pale gray border around the control */
  --choice-control-border: 1px solid rgba(0, 0, 0, 1.0);
  --choice-control-checked-bc: var(--black);
  --choice-control-checked-bg: var(--black);
  --choice-control-focus-border: var(--black);
  --choice-control-focus-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
  --choice-control-hover-bc: rgba(0, 0, 0, 0.5);
  /* Sbac colors */
  --choice-sbac-checked-color: var(--white);
  --choice-sbac-unchecked-color: var(--foreground);
  --choice-sbac-control-checked-bc: var(--black);
  --choice-sbac-control-checked-bg: var(--black);
  --choice-sbac-control-unchecked-bc: var(--black);
  --choice-sbac-control-unchecked-bg: var(--white);
  /* Control Hidden colors */
  --choice-ctrlh-color: #2871bd;
  --choice-ctrlh-bgc: var(--white);
  --choice-ctrlh-lblbgc: var(--white);
  --choice-ctrlh-desccolor: var(--foreground);
  --choice-ctrlh-checked-color: var(--white);
  --choice-ctrlh-checked-bgc: #2871bd;
  --choice-ctrlh-focus-bc: #2871bd;
  --choice-ctrlh-focus-checked-bc: var(--white);
  --choice-ctrlh-hover-brightness: brightness(95%);
  /* Inline Choice colors */
  --ic-focus-fc: var(--white);
  --ic-focus-bc: var(--black);
  /* End Attempt Button colors */
  --ea-button-secondary-color: var(--background);
  --ea-button-secondary-bgc: var(--foreground);
  --ea-button-secondary-bc: var(--secondary-complement);
  --ea-button-secondary-focus-color: var(--background);
  --ea-button-secondary-focus-bgc: var(--foreground);
  --ea-button-secondary-focus-bc: var(--foreground);
  /* Editor colors */
  --ed-bc: #222;
  --ed-bq-color: #bbb;
  /* Order colors */
  --order-target-active-color: var(--foreground);
  --order-target-active-bgc: #bbcef1;
  --order-placeholder-color: #d3d5d7;
}

/* High Contrast - reverse polarity */
.qti3-player-color-whiteblack {
  --foreground: var(--white);
  --background: var(--black);
  --secondary: var(--white);
  --secondary-complement: var(--black);
  --hr-border: 1px solid var(--white);
  --table-border-color: var(--white);
  --well-bg: var(--darker);
  --well-border: 1px solid #111;
  --well-box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.5);
  /* Item Card */
  --item-card-panel-bgc: rgba(255, 255, 255, .25);
  --item-card-panel-bc: rgba(255, 255, 255, .25);
  /* Overall choice focus border */
  --choice-focus-border: var(--white);
  /* Default inner background color of the control */
  --choice-control-bgc: var(--black);
  /* The pale gray border around the control */
  --choice-control-border: 1px solid var(--white);
  --choice-control-checked-bc: var(--white);
  --choice-control-checked-bg: var(--white);
  --choice-control-focus-border: var(--white);
  --choice-control-focus-shadow: 0 0 0 0.25rem rgba(255, 255, 255, 0.5);
  --choice-control-hover-bc: var(--white);
  /* Sbac colors */
  --choice-sbac-checked-color: var(--black);
  --choice-sbac-unchecked-color: var(--white);
  --choice-sbac-control-checked-bc: var(--white);
  --choice-sbac-control-checked-bg: var(--white);
  --choice-sbac-control-unchecked-bc: var(--white);
  --choice-sbac-control-unchecked-bg: var(--black);
  /* Control Hidden colors */
  --choice-ctrlh-color: #2871bd;
  --choice-ctrlh-bgc: var(--white);
  --choice-ctrlh-lblbgc: var(--white);
  --choice-ctrlh-desccolor: var(--background);
  --choice-ctrlh-checked-color: var(--white);
  --choice-ctrlh-checked-bgc: #2871bd;
  --choice-ctrlh-focus-bc: #2871bd;
  --choice-ctrlh-focus-checked-bc: var(--white);
  --choice-ctrlh-hover-brightness: brightness(90%);
  /* Inline Choice colors */
  --ic-focus-fc: var(--secondary-complement);
  --ic-focus-bc: var(--secondary);
  /* End Attempt Button colors */
  --ea-button-secondary-color: var(--background);
  --ea-button-secondary-bgc: var(--foreground);
  --ea-button-secondary-bc: var(--secondary-complement);
  --ea-button-secondary-focus-color: var(--background);
  --ea-button-secondary-focus-bgc: var(--foreground);
  --ea-button-secondary-focus-bc: var(--foreground);
  /* Editor colors */
  --ed-bc: var(--lighter);
  --ed-bq-color: #ccc;
  /* Order colors */
  --order-target-active-color: var(--darker);
  --order-target-active-bgc: #bbcef1;
  --order-placeholder-color: var(--foreground);
}

.qti3-player-color-blackrose {
  --foreground: var(--black);
  --background: var(--rose);
  --secondary: #c6bcf8;
  --secondary-complement: var(--black);
  --hr-border: 1px solid var(--gray-dark);
  --table-border-color: var(--black);
  --well-bg: #ffc0ff;
  --well-border: 1px solid #da70d6; /* orchid */
  --well-box-shadow: inset 0 1px 1px rgba(218, 112, 214, 0.5);
  /* Overall choice focus border */
  --choice-focus-border: rgba(13, 110, 253, 0.75);
  /* Default inner background color of the control */
  --choice-control-bgc: var(--rose);
  /* The pale gray border around the control */
  --choice-control-border: 1px solid rgba(0, 0, 0, 1.0);
  --choice-control-checked-bc: var(--black);
  --choice-control-checked-bg: var(--black);
  --choice-control-focus-border: var(--black);
  --choice-control-focus-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.5);
  --choice-control-hover-bc: rgba(0, 0, 0, 0.5);
  /* Sbac colors */
  --choice-sbac-checked-color: var(--rose);
  --choice-sbac-unchecked-color: var(--black);
  --choice-sbac-control-checked-bc: var(--black);
  --choice-sbac-control-checked-bg: var(--black);
  --choice-sbac-control-unchecked-bc: var(--black);
  --choice-sbac-control-unchecked-bg: var(--rose);
  /* Control Hidden colors */
  --choice-ctrlh-color: var(--black);
  --choice-ctrlh-bgc: var(--rose);
  --choice-ctrlh-lblbgc: var(--rose);
  --choice-ctrlh-desccolor: var(--black);
  --choice-ctrlh-checked-color: var(--rose);
  --choice-ctrlh-checked-bgc: var(--black);
  --choice-ctrlh-focus-bc: var(--black);
  --choice-ctrlh-focus-checked-bc: var(--rose);
  --choice-ctrlh-hover-brightness: brightness(95%);
  /* Inline Choice colors */
  --ic-focus-fc: var(--secondary-complement);
  --ic-focus-bc: var(--secondary);
  /* End Attempt Button colors */
  --ea-button-secondary-color: var(--background);
  --ea-button-secondary-bgc: #6c757d;
  --ea-button-secondary-bc: #6c757d;
  --ea-button-secondary-focus-color: var(--white);
  --ea-button-secondary-focus-bgc: #697783;
  --ea-button-secondary-focus-bc: #63707c;
  /* Editor colors */
  --ed-bc: var(--gray-dark);
  --ed-bq-color: #999;
  /* Order colors */
  --order-target-active-color: var(--foreground);
  --order-target-active-bgc: var(--secondary);
  --order-placeholder-color: #bbcef1;
}

.qti3-player-color-roseblack {
  --foreground: var(--rose);
  --background: var(--black);
  --secondary: #c6bcf8;
  --secondary-complement: var(--black);
  --hr-border: 1px solid var(--light);
  --table-border-color: var(--rose);
  --well-bg: #333;
  --well-border: 1px solid #222;
  --well-box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.5);
  /* Item Card */
  --item-card-panel-bgc: rgba(255, 255, 255, .25);
  --item-card-panel-bc: rgba(255, 255, 255, .25);
  /* Overall choice focus border */
  --choice-focus-border: var(--rose);
  /* Default inner background color of the control */
  --choice-control-bgc: var(--black);
  /* Sbac colors */
  --choice-sbac-checked-color: var(--black);
  --choice-sbac-unchecked-color: var(--rose);
  --choice-sbac-control-checked-bc: var(--rose);
  --choice-sbac-control-checked-bg: var(--rose);
  --choice-sbac-control-unchecked-bc: var(--rose);
  --choice-sbac-control-unchecked-bg: var(--black);
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
  --choice-ctrlh-lblbgc: var(--black);
  --choice-ctrlh-desccolor: var(--rose);
  --choice-ctrlh-checked-color: var(--black);
  --choice-ctrlh-checked-bgc: var(--rose);
  --choice-ctrlh-focus-bc: var(--rose);
  --choice-ctrlh-focus-checked-bc: var(--rose);
  --choice-ctrlh-hover-brightness: brightness(90%);
  /* Inline Choice colors */
  --ic-focus-fc: var(--secondary-complement);
  --ic-focus-bc: var(--secondary);
  /* End Attempt Button colors */
  --ea-button-secondary-color: var(--foreground);
  --ea-button-secondary-bgc: #6c757d;
  --ea-button-secondary-bc: #6c757d;
  --ea-button-secondary-focus-color: var(--white);
  --ea-button-secondary-focus-bgc: #697783;
  --ea-button-secondary-focus-bc: #63707c;
  /* Editor colors */
  --ed-bc: #ddd;
  --ed-bq-color: #ccc;
  /* Order colors */
  --order-target-active-color: var(--darker);
  --order-target-active-bgc: #bbcef1;
  --order-placeholder-color: var(--foreground);
}

.qti3-player-color-mgraydgray {
  --foreground: #e5e5e5;
  --background: #666;
  --secondary: #c8c8c8;
  --secondary-complement: var(--black);
  --hr-border: 1px solid var(--secondary);
  --table-border-color: var(--foreground);
  --well-bg: #585858;
  --well-border: 1px solid #444;
  --well-box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.05);
  /* Overall choice focus border */
  --choice-focus-border: var(--foreground);
  /* Default inner background color of the control */
  --choice-control-bgc: var(--background);
  /* The pale gray border around the control */
  --choice-control-border: 1px solid var(--foreground);
  --choice-control-checked-bc: var(--foreground);
  --choice-control-checked-bg: var(--foreground);
  --choice-control-focus-border: var(--foreground);
  --choice-control-focus-shadow: 0 0 0 0.25rem rgba(255, 255, 255, 0.5);
  --choice-control-hover-bc: var(--foreground);
  /* Sbac colors */
  --choice-sbac-checked-color: var(--background);
  --choice-sbac-unchecked-color: var(--foreground);
  --choice-sbac-control-checked-bc: var(--foreground);
  --choice-sbac-control-checked-bg: var(--foreground);
  --choice-sbac-control-unchecked-bc: var(--foreground);
  --choice-sbac-control-unchecked-bg: var(--background);
  /* Control Hidden colors */
  --choice-ctrlh-color: var(--foreground);
  --choice-ctrlh-bgc: var(--background);
  --choice-ctrlh-lblbgc: var(--background);
  --choice-ctrlh-desccolor: var(--foreground);
  --choice-ctrlh-checked-color: var(--background);
  --choice-ctrlh-checked-bgc: var(--foreground);
  --choice-ctrlh-focus-bc: var(--foreground);
  --choice-ctrlh-focus-checked-bc: var(--foreground);
  --choice-ctrlh-hover-brightness: brightness(90%);
  /* Inline Choice colors */
  --ic-focus-fc: var(--secondary-complement);
  --ic-focus-bc: var(--secondary);
  /* End Attempt Button colors */
  --ea-button-secondary-color: var(--foreground);
  --ea-button-secondary-bgc: #444;
  --ea-button-secondary-bc: #63707c;
  --ea-button-secondary-focus-color: var(--white);
  --ea-button-secondary-focus-bgc: #555;
  --ea-button-secondary-focus-bc: #63707c;
  /* Editor colors */
  --ed-bc: #ddd;
  --ed-bq-color: #ccc;
  /* Order colors */
  --order-target-active-color: var(--background);
  --order-target-active-bgc: #bbcef1;
  --order-placeholder-color: #d3d5d7;
}

.qti3-player-color-dgraymgray {
  --foreground: #666;
  --background: #e5e5e5;
  --secondary: #888;
  --secondary-complement: var(--black);
  --hr-border: 1px solid var(--secondary);
  --table-border-color: var(--foreground);
  --well-bg: #ccc;
  --well-border: 1px solid #e3e3e3;
  --well-box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.05);
  /* Overall choice focus border */
  --choice-focus-border: var(--foreground);
  /* Default inner background color of the control */
  --choice-control-bgc: var(--background);
  /* The pale gray border around the control */
  --choice-control-border: 1px solid var(--foreground);
  --choice-control-checked-bc: var(--foreground);
  --choice-control-checked-bg: var(--foreground);
  --choice-control-focus-border: var(--foreground);
  --choice-control-focus-shadow: 0 0 0 0.25rem rgba(255, 255, 255, 0.5);
  --choice-control-hover-bc: var(--foreground);
  /* Sbac colors */
  --choice-sbac-checked-color: var(--background);
  --choice-sbac-unchecked-color: var(--foreground);
  --choice-sbac-control-checked-bc: var(--foreground);
  --choice-sbac-control-checked-bg: var(--foreground);
  --choice-sbac-control-unchecked-bc: var(--foreground);
  --choice-sbac-control-unchecked-bg: var(--background);
  /* Control Hidden colors */
  --choice-ctrlh-color: var(--foreground);
  --choice-ctrlh-bgc: var(--background);
  --choice-ctrlh-lblbgc: var(--background);
  --choice-ctrlh-desccolor: var(--foreground);
  --choice-ctrlh-checked-color: var(--background);
  --choice-ctrlh-checked-bgc: var(--foreground);
  --choice-ctrlh-focus-bc: var(--foreground);
  --choice-ctrlh-focus-checked-bc: var(--foreground);
  --choice-ctrlh-hover-brightness: brightness(90%);
  /* Inline Choice colors */
  --ic-focus-fc: var(--secondary-complement);
  --ic-focus-bc: var(--secondary);
  /* End Attempt Button colors */
  --ea-button-secondary-color: var(--background);
  --ea-button-secondary-bgc: #6c757d;
  --ea-button-secondary-bc: #6c757d;
  --ea-button-secondary-focus-color: var(--white);
  --ea-button-secondary-focus-bgc: #697783;
  --ea-button-secondary-focus-bc: #63707c;
  /* Editor colors */
  --ed-bc: var(--gray-dark);
  --ed-bq-color: #555;
  /* Order colors */
  --order-target-active-color: var(--foreground);
  --order-target-active-bgc: #bbcef1;
  --order-placeholder-color: #d3d5d7;
}

.qti3-player-color-yellowblue {
  --foreground: #ffcc00;
  --background: #003398;
  --secondary: #dbdbdb;
  --secondary-complement: var(--black);
  --hr-border: 1px solid var(--foreground);
  --table-border-color: var(--foreground);
  --well-bg: #00008C;
  --well-border: 1px solid rgba(0, 0, 128, 1);
  --well-box-shadow: inset 0 1px 1px rgba(0, 0, 128, 1);
  /* Item Card */
  --item-card-panel-bgc: rgba(0,0,0,.1);
  --item-card-panel-bc: rgba(0,0,0,.4);
  /* Overall choice focus border */
  --choice-focus-border: var(--foreground);
  /* Default inner background color of the control */
  --choice-control-bgc: var(--background);
  /* The pale gray border around the control */
  --choice-control-border: 1px solid var(--foreground);
  --choice-control-checked-bc: var(--foreground);
  --choice-control-checked-bg: var(--foreground);
  --choice-control-focus-border: var(--foreground);
  --choice-control-focus-shadow: 0 0 0 0.25rem rgba(255, 255, 255, 0.5);
  --choice-control-hover-bc: var(--foreground);
  /* Sbac colors */
  --choice-sbac-checked-color: var(--background);
  --choice-sbac-unchecked-color: var(--foreground);
  --choice-sbac-control-checked-bc: var(--foreground);
  --choice-sbac-control-checked-bg: var(--foreground);
  --choice-sbac-control-unchecked-bc: var(--foreground);
  --choice-sbac-control-unchecked-bg: var(--background);
  /* Control Hidden colors */
  --choice-ctrlh-color: var(--foreground);
  --choice-ctrlh-bgc: var(--background);
  --choice-ctrlh-lblbgc: var(--background);
  --choice-ctrlh-desccolor: var(--foreground);
  --choice-ctrlh-checked-color: var(--background);
  --choice-ctrlh-checked-bgc: var(--foreground);
  --choice-ctrlh-focus-bc: var(--foreground);
  --choice-ctrlh-focus-checked-bc: var(--foreground);
  --choice-ctrlh-hover-brightness: brightness(90%);
  /* Inline Choice colors */
  --ic-focus-fc: var(--secondary-complement);
  --ic-focus-bc: var(--secondary);
  /* End Attempt Button colors */
  --ea-button-secondary-color: var(--foreground);
  --ea-button-secondary-bgc: #6c757d;
  --ea-button-secondary-bc: #6c757d;
  --ea-button-secondary-focus-color: var(--white);
  --ea-button-secondary-focus-bgc: #697783;
  --ea-button-secondary-focus-bc: #63707c;
  /* Editor colors */
  --ed-bc: var(--well-border);
  --ed-bq-color: #6c757d;
  /* Order colors */
  --order-target-active-color: var(--darker);
  --order-target-active-bgc: #bbcef1;
  --order-placeholder-color: var(--foreground);
}

.qti3-player-color-blueyellow {
  --foreground: #003398;
  --background: #ffcc00;
  --secondary: #dbdbdb;
  --secondary-complement: var(--black);
  --hr-border: 1px solid var(--foreground);
  --table-border-color: var(--foreground);
  --well-bg: #ffbb00;  /* #ffbb00; */
  --well-border: 1px solid rgba(255, 175, 0, 1);
  --well-box-shadow: inset 0 1px 1px rgba(255, 175, 0, 1);
  /* Overall choice focus border */
  --choice-focus-border: var(--foreground);
  /* Default inner background color of the control */
  --choice-control-bgc: var(--background);
  /* The pale gray border around the control */
  --choice-control-border: 1px solid var(--foreground);
  --choice-control-checked-bc: var(--foreground);
  --choice-control-checked-bg: var(--foreground);
  --choice-control-focus-border: var(--foreground);
  --choice-control-focus-shadow: 0 0 0 0.25rem rgba(255, 255, 255, 0.5);
  --choice-control-hover-bc: var(--foreground);
  /* Sbac colors */
  --choice-sbac-checked-color: var(--background);
  --choice-sbac-unchecked-color: var(--foreground);
  --choice-sbac-control-checked-bc: var(--foreground);
  --choice-sbac-control-checked-bg: var(--foreground);
  --choice-sbac-control-unchecked-bc: var(--foreground);
  --choice-sbac-control-unchecked-bg: var(--background);
  /* Control Hidden colors */
  --choice-ctrlh-color: var(--foreground);
  --choice-ctrlh-bgc: var(--background);
  --choice-ctrlh-lblbgc: var(--background);
  --choice-ctrlh-desccolor: var(--foreground);
  --choice-ctrlh-checked-color: var(--background);
  --choice-ctrlh-checked-bgc: var(--foreground);
  --choice-ctrlh-focus-bc: var(--foreground);
  --choice-ctrlh-focus-checked-bc: var(--foreground);
  --choice-ctrlh-hover-brightness: brightness(90%);
  /* Inline Choice colors */
  --ic-focus-fc: var(--secondary-complement);
  --ic-focus-bc: var(--secondary);
  /* End Attempt Button colors */
  --ea-button-secondary-color: var(--background);
  --ea-button-secondary-bgc: #6c757d;
  --ea-button-secondary-bc: #6c757d;
  --ea-button-secondary-focus-color: var(--white);
  --ea-button-secondary-focus-bgc: #697783;
  --ea-button-secondary-focus-bc: #63707c;
  /* Editor colors */
  --ed-bc: var(--well-border);
  --ed-bq-color: #6c757d;
  /* Order colors */
  --order-target-active-color: var(--foreground);
  --order-target-active-bgc: #bbcef1;
  --order-placeholder-color: #dbdbdb;
}

.qti3-player-color-blackcyan {
  --foreground: var(--black);
  --background: var(--lblue);
  --secondary: #888;
  --secondary-complement: var(--black);
  --hr-border: 1px solid var(--gray-dark);
  --table-border-color: var(--black);
  --well-bg: #99ccdd;
  --well-border: 1px solid #77ccdd;
  --well-box-shadow: inset 0 1px 1px rgba(119, 204, 221, 0.5);
  /* Overall choice focus border */
  --choice-focus-border: rgba(13, 110, 253, 0.75);
  /* Default inner background color of the control */
  --choice-control-bgc: var(--lblue);
  /* The pale gray border around the control */
  --choice-control-border: 1px solid rgba(0, 0, 0, 1.0);
  --choice-control-checked-bc: var(--black);
  --choice-control-checked-bg: var(--black);
  --choice-control-focus-border: var(--black);
  --choice-control-focus-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.5);
  --choice-control-hover-bc: rgba(0, 0, 0, 0.5);
  /* Sbac colors */
  --choice-sbac-checked-color: var(--lblue);
  --choice-sbac-unchecked-color: var(--black);
  --choice-sbac-control-checked-bc: var(--black);
  --choice-sbac-control-checked-bg: var(--black);
  --choice-sbac-control-unchecked-bc: var(--black);
  --choice-sbac-control-unchecked-bg: var(--lblue);
  /* Control Hidden colors */
  --choice-ctrlh-color: var(--black);
  --choice-ctrlh-bgc: var(--lblue);
  --choice-ctrlh-lblbgc: var(--lblue);
  --choice-ctrlh-desccolor: var(--black);
  --choice-ctrlh-checked-color: var(--lblue);
  --choice-ctrlh-checked-bgc: var(--black);
  --choice-ctrlh-focus-bc: var(--black);
  --choice-ctrlh-focus-checked-bc: var(--lblue);
  --choice-ctrlh-hover-brightness: brightness(95%);
  /* Inline Choice colors */
  --ic-focus-fc: var(--secondary-complement);
  --ic-focus-bc: #d8ade6;
  /* End Attempt Button colors */
  --ea-button-secondary-color: var(--background);
  --ea-button-secondary-bgc: #6c757d;
  --ea-button-secondary-bc: #6c757d;
  --ea-button-secondary-focus-color: var(--white);
  --ea-button-secondary-focus-bgc: #697783;
  --ea-button-secondary-focus-bc: #63707c;
  /* Editor colors */
  --ed-bc: var(--gray-dark);
  --ed-bq-color: #999;
  /* Order colors */
  --order-target-active-color: var(--darker);
  --order-target-active-bgc: #d8ade6;
  --order-placeholder-color: #bbcef1;
  /* Audio/Video slider */
  --slider-focus-track: rgba(13, 110, 253, 0.5);
}

.qti3-player-color-cyanblack {
  --foreground: var(--lblue);
  --background: var(--black);
  --secondary: #585858;
  --secondary-complement: var(--black);
  --hr-border: 1px solid var(--light);
  --table-border-color: var(--lblue);
  --well-bg: #333;
  --well-border: 1px solid #222;
  --well-box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.5);
  /* Item Card */
  --item-card-panel-bgc: rgba(255, 255, 255, .25);
  --item-card-panel-bc: rgba(255, 255, 255, .25);
  /* Overall choice focus border */
  --choice-focus-border: var(--lblue);
  /* Default inner background color of the control */
  --choice-control-bgc: var(--black);
  /* Sbac colors */
  --choice-sbac-checked-color: var(--black);
  --choice-sbac-unchecked-color: var(--lblue);
  --choice-sbac-control-checked-bc: var(--lblue);
  --choice-sbac-control-checked-bg: var(--lblue);
  --choice-sbac-control-unchecked-bc: var(--lblue);
  --choice-sbac-control-unchecked-bg: var(--black);
  /* The pale gray border around the control */
  --choice-control-border: 1px solid var(--lblue);
  --choice-control-checked-bc: var(--lblue);
  --choice-control-checked-bg: var(--lblue);
  --choice-control-focus-border: var(--lblue);
  --choice-control-focus-shadow: 0 0 0 0.25rem rgba(255, 255, 255, 0.5);
  --choice-control-hover-bc: var(--lblue);
  /* Control Hidden colors */
  --choice-ctrlh-color: var(--lblue);
  --choice-ctrlh-bgc: var(--black);
  --choice-ctrlh-lblbgc: var(--black);
  --choice-ctrlh-desccolor: var(--lblue);
  --choice-ctrlh-checked-color: var(--black);
  --choice-ctrlh-checked-bgc: var(--lblue);
  --choice-ctrlh-focus-bc: var(--lblue);
  --choice-ctrlh-focus-checked-bc: var(--lblue);
  --choice-ctrlh-hover-brightness: brightness(90%);
  /* Inline Choice colors */
  --ic-focus-fc: var(--secondary-complement);
  --ic-focus-bc: #d8ade6;
  /* End Attempt Button colors */
  --ea-button-secondary-color: var(--foreground);
  --ea-button-secondary-bgc: #6c757d;
  --ea-button-secondary-bc: #6c757d;
  --ea-button-secondary-focus-color: var(--white);
  --ea-button-secondary-focus-bgc: #697783;
  --ea-button-secondary-focus-bc: #63707c;
  /* Editor colors */
  --ed-bc: #ddd;
  --ed-bq-color: #ccc;
  /* Order colors */
  --order-target-active-color: var(--darker);
  --order-target-active-bgc: #d8ade6;
  --order-placeholder-color: var(--foreground);
  /* Audio/Video slider */
  --slider-focus-track: rgba(13, 110, 253, 0.95);
}

.qti3-player-color-blackcream {
  --foreground: var(--black);
  --background: var(--lchiffon);
  --secondary: #dbdbdb;
  --secondary-complement: var(--darker);
  --hr-border: 1px solid var(--gray-dark);
  --table-border-color: var(--black);
  --well-bg: #fff3aa;
  --well-border: 1px solid #f0f000;
  --well-box-shadow: inset 0 1px 1px rgba(240, 240, 0, 0.5);
  /* Overall choice focus border */
  --choice-focus-border: rgba(13, 110, 253, 0.75);
  /* Default inner background color of the control */
  --choice-control-bgc: var(--lchiffon);
  /* The pale gray border around the control */
  --choice-control-border: 1px solid rgba(0, 0, 0, 1.0);
  --choice-control-checked-bc: var(--black);
  --choice-control-checked-bg: var(--black);
  --choice-control-focus-border: var(--black);
  --choice-control-focus-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.5);
  --choice-control-hover-bc: rgba(0, 0, 0, 0.5);
  /* Sbac colors */
  --choice-sbac-checked-color: var(--lchiffon);
  --choice-sbac-unchecked-color: var(--black);
  --choice-sbac-control-checked-bc: var(--black);
  --choice-sbac-control-checked-bg: var(--black);
  --choice-sbac-control-unchecked-bc: var(--black);
  --choice-sbac-control-unchecked-bg: var(--lchiffon);
  /* Control Hidden colors */
  --choice-ctrlh-color: var(--black);
  --choice-ctrlh-bgc: var(--lchiffon);
  --choice-ctrlh-lblbgc: var(--lchiffon);
  --choice-ctrlh-desccolor: var(--black);
  --choice-ctrlh-checked-color: var(--lchiffon);
  --choice-ctrlh-checked-bgc: var(--black);
  --choice-ctrlh-focus-bc: var(--black);
  --choice-ctrlh-focus-checked-bc: var(--lchiffon);
  --choice-ctrlh-hover-brightness: brightness(95%);
  /* Inline Choice colors */
  --ic-focus-fc: var(--secondary-complement);
  --ic-focus-bc: #bde4ff;
  /* End Attempt Button colors */
  --ea-button-secondary-color: var(--background);
  --ea-button-secondary-bgc: #6c757d;
  --ea-button-secondary-bc: #6c757d;
  --ea-button-secondary-focus-color: var(--white);
  --ea-button-secondary-focus-bgc: #697783;
  --ea-button-secondary-focus-bc: #63707c;
  /* Editor colors */
  --ed-bc: var(--gray-dark);
  --ed-bq-color: #999;
  /* Order colors */
  --order-target-active-color: var(--foreground);
  --order-target-active-bgc: var(--secondary);
  --order-placeholder-color: #bde4ff;
}

.qti3-player-color-creamblack {
  --foreground: var(--lchiffon);
  --background: var(--black);
  --secondary: #c8c8c8;
  --secondary-complement: var(--black);
  --hr-border: 1px solid var(--light);
  --table-border-color: var(--lchiffon);
  --well-bg: #333;
  --well-border: 1px solid #222;
  --well-box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.5);
  /* Item Card */
  --item-card-panel-bgc: rgba(255, 255, 255, .25);
  --item-card-panel-bc: rgba(255, 255, 255, .25);
  /* Overall choice focus border */
  --choice-focus-border: var(--lblue);
  /* Default inner background color of the control */
  --choice-control-bgc: var(--black);
  /* Sbac colors */
  --choice-sbac-checked-color: var(--black);
  --choice-sbac-unchecked-color: var(--lchiffon);
  --choice-sbac-control-checked-bc: var(--lchiffon);
  --choice-sbac-control-checked-bg: var(--lchiffon);
  --choice-sbac-control-unchecked-bc: var(--lchiffon);
  --choice-sbac-control-unchecked-bg: var(--black);
  /* The pale gray border around the control */
  --choice-control-border: 1px solid var(--lchiffon);
  --choice-control-checked-bc: var(--lchiffon);
  --choice-control-checked-bg: var(--lchiffon);
  --choice-control-focus-border: var(--lchiffon);
  --choice-control-focus-shadow: 0 0 0 0.25rem rgba(255, 255, 255, 0.5);
  --choice-control-hover-bc: var(--lchiffon);
  /* Control Hidden colors */
  --choice-ctrlh-color: var(--lchiffon);
  --choice-ctrlh-bgc: var(--black);
  --choice-ctrlh-lblbgc: var(--black);
  --choice-ctrlh-desccolor: var(--lchiffon);
  --choice-ctrlh-checked-color: var(--black);
  --choice-ctrlh-checked-bgc: var(--lchiffon);
  --choice-ctrlh-focus-bc: var(--lchiffon);
  --choice-ctrlh-focus-checked-bc: var(--lchiffon);
  --choice-ctrlh-hover-brightness: brightness(90%);
  /* Inline Choice colors */
  --ic-focus-fc: var(--secondary-complement);
  --ic-focus-bc: #bde4ff;
  /* End Attempt Button colors */
  --ea-button-secondary-color: var(--foreground);
  --ea-button-secondary-bgc: #6c757d;
  --ea-button-secondary-bc: #6c757d;
  --ea-button-secondary-focus-color: var(--white);
  --ea-button-secondary-focus-bgc: #697783;
  --ea-button-secondary-focus-bc: #63707c;
  /* Editor colors */
  --ed-bc: #ddd;
  --ed-bq-color: #ccc;
  /* Order colors */
  --order-target-active-color: var(--darker);
  --order-target-active-bgc: var(--secondary);
  --order-placeholder-color: #bde4ff;
}

.qti3-player-container,
.qti3-player-container-fluid {
  margin: 0;
  font-size: 16px;
  font-weight: 400;
  line-height: 1.8rem;
  font-family: Roboto, "Helvetica Neue", Arial, sans-serif;
  color: var(--foreground);
  text-align: left;
  background-color: var(--background);
}

/* Set default non-fluid container to live nicely (plenty of whitespace/padding/margin) with
   screen resolution above 1024 pixels (iPad in landscape) and below 1200 pixels */
.qti3-player-container {
  width: 940px;
  padding: 0;
  margin-right: auto;
  margin-left: auto;
  *zoom:1;
}

.qti3-player-container-fluid {
  width: 100%;
  padding: 0;
  margin-right: auto;
  margin-left: auto;
}

.qti3-player-container.qti3-player-container-padding-0,
.qti3-player-container-fluid.qti3-player-container-padding-0 {
  padding: 0;
}

.qti3-player-container.qti3-player-container-padding-1,
.qti3-player-container-fluid.qti3-player-container-padding-1 {
  padding: 0.25rem;
}

.qti3-player-container.qti3-player-container-padding-2,
.qti3-player-container-fluid.qti3-player-container-padding-2  {
  padding: 0.5rem;
}

.qti3-player-container.qti3-player-container-padding-3,
.qti3-player-container-fluid.qti3-player-container-padding-3 {
  padding: 1rem;
}

.qti3-player-container.qti3-player-container-padding-4,
.qti3-player-container-fluid.qti3-player-container-padding-4 {
  padding: 1.5rem;
}

.qti3-player-container.qti3-player-container-padding-5,
.qti3-player-container-fluid.qti3-player-container-padding-5  {
  padding: 3rem;
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
  .qti3-player-container { width: 1170px; }
}

/* Sweet Alert should use same font-family as player */
.swal2-popup {
  font-family: Roboto, "Helvetica Neue", Arial, sans-serif;
}

.qti3-player-catalog-clickable-term {
  cursor: pointer;
  border-bottom: 1px dotted var(--foreground);
}

.qti3-player-catalog-clickable-term:focus-visible {
  padding-right: 1px;
  padding-left: 1px;
  outline: 1px solid var(--foreground);
}

.qti3-player-writing-mode-vertical-rl .qti3-player-catalog-clickable-term {
  cursor: pointer;
  border-left: 1px dotted var(--foreground);
  border-bottom: 0;
}

.qti3-player-writing-mode-vertical-lr .qti3-player-catalog-clickable-term {
  cursor: pointer;
  border-right: 1px dotted var(--foreground);
  border-bottom: 0;
}

.qti3-player-writing-mode-vertical-rl .qti3-player-catalog-clickable-term:focus-visible,
.qti3-player-writing-mode-vertical-lr .qti3-player-catalog-clickable-term:focus-visible {
  padding-top: 1px;
  padding-bottom: 1px;
  outline: 1px solid var(--foreground);
}
</style>
