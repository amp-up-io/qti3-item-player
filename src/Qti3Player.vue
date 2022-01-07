<template>
  <div
    ref="player"
    v-bind:class="[cssContainerClass, cssColorClass]">
    <component
      ref="item"
      @itemReady="handleItemReady"
      @itemCompleted="handleItemCompleted"
      @itemStateReady="handleItemStateReady"
      v-bind:is="processedXml">
    </component>
  </div>
</template>

<script>
import Vue from 'vue'
import { store } from '@/store/store'
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
    }
  },

  data () {
    return {
      item: null,  // Set to the qti-assessment-item component
      itemXml: '', // QTI XML string injected into the qti-assessment-item component
      xmlFilters: new XmlFilters(),
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
     * @param xml - string of qti-assessment-item xml
     * @param configuration - object of the following schema:
     * {
     *   guid: string (a tracking guid)
     *   pnp: a PnpFactory object
     *   sessionControl: a sessionControl object
     *   state: itemState object containing any prior state
     * }
     */
    loadItemFromXml (xml, configuration) {
      console.log('[Qti3Player][loadItemFromXml][configuration]', configuration)

      // Step 1: clear out the existing store
      store.resetAll()

      // Step 2: set item player context
      if (typeof configuration !== 'undefined') {
        if ('guid' in configuration) {
          store.setItemContextGuid(configuration.guid)
        }
        if ('pnp' in configuration) {
          store.setItemContextPnp(configuration.pnp)

          // Examine the textAppearance.colorStyle.
          // Update the UI if modified.
          const colorStyle = store.getItemContextPnp().getColorStyle()
          if (this.cssColorClass !== colorStyle) {
            this.cssColorClass = colorStyle
          }
        }
        if ('sessionControl' in configuration) {
          store.setItemContextSessionControl(configuration.sessionControl)
        }
        if ('state' in configuration) {
          store.setItemContextState(configuration.state)
        }
      }

      // Step 3: load the item xml
      this.itemXml = xml
    },

    handleItemReady (param) {
      console.log('[Qti3Player][ItemReady]', param.item)
      this.item = param.item
      store.NotifyItemReady({
          item: this.item
        })
    },

    handleItemCompleted () {
      console.log('[Qti3Player][ItemCompleted]')
    },

    /**
     * @description Initiate a getItemState request in the QtiAssessmentItem
     * component.  When the method completes the Item will trigger the
     * 'itemStateReady' event - handled by the 'handleItemStateReady' method.
     * @param target
     */
    getItemState (target) {
      console.log('[Qti3Player][getItemState][' + target + ']')
      this.item.getItemState(target)
    },

    /**
     * @description event handler for the itemStateReady event.
     * @param data - an object containing a state property and a target property.
     */
    handleItemStateReady (data) {
      console.log('[Qti3Player][ItemStateReady]', data)
      this.$emit('getItemStateCompleted', data)
    },

    /**
     * @description Method for a controller to inject a pnp.
     * Normally, a pnp is injected via a configuration property
     * when an item is loaded.
     * @param pnp - a pnp object built from a PnpFactory
     */
    setPnp (pnp) {
      store.setItemContextPnp(pnp)
    },

    /**
     * @description After an item is updated, we may need to do some cleanup of the DOM or
     * perform other post processing.  Do this here.
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
    // Set up the PnpFactory
    store.initializeItemContextPnp()
    // TODO Set up the sessionControlFactory
  },

  mounted () {
    console.log('[Qti3Player][Mounted]')
  }
}

class XmlFilters {
  /**
   * @description Helper Class for transforming the QTI XML
   */
  constructor() {
  }

  /**
   * @description Remove CDATA from the XML.
   */
  filterCdata (xml) {
    return xml.replace('<![CDATA[', '').replace(']]>', '')
  }

  /**
   * @description Transform the <style> element into something
   * that can be digested more easily by the qti-assessment-item component.
   */
  filterStyle (xml) {
    return xml.replace('<style>','<amp-style>').replace('</style>','</amp-style>')
  }

  /**
   * @description Transform an audio element to an amp-audio element which loads
   * the custom amp-up.io audio player instead of the the default html5 audio player.
   */
  filterAudio (xml) {
    return xml.replace('<audio ','<amp-audio ').replace('</audio>','</amp-audio>')
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
  --white: #fff;
  --gray: #7c8a96;
  --gray-dark: #343a40;
  --primary: #3d8ef8;
  --secondary: #7c8a96;
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
  --font-family-sans-serif: "Roboto", sans-serif;
  --font-family-monospace: SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  --foreground: var(--darker);
  --background: var(--white);
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
}
/* High Contrast */
.qti3-player-color-blackwhite {
  --foreground: var(--black);
  --background: var(--white);
}
/* High Contrast - reverse polarity */
.qti3-player-color-whiteblack {
  --foreground: var(--white);
  --background: var(--black);
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
</style>
