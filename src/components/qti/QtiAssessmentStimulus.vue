<template>
  <div ref="item" class="qti-assessment-stimulus">
    <event-listener
      @stimulusBodyReady="handleStimulusBodyReady"
      @catalogInfoReady="handleStimulusCatalogReady">
      <div>
        <slot></slot>
      </div>
    </event-listener>
  </div>
</template>

<script>
/*
 * An assessment stimulus object is used to enable content to be shared by several
 * Assessment Items. The key feature is that this shared stimulus content must be supplied
 * in the same context for each of the Assessment Items that make use of it. The assessment
 * stimulus approach provides a mechanism to allow the stimulus content to be managed independently.
 */
import Vue from 'vue'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import EventListener from '@/shared/components/EventListener'
import QtiStylesheet from '@/components/qti/general/QtiStylesheet'
import QtiStimulusBody from '@/components/qti/body/QtiStimulusBody'
import QtiCatalogInfo from '@/components/qti/catalog/QtiCatalogInfo'

const qtiAttributeValidation = new QtiAttributeValidation()

Vue.component('event-listener',EventListener)
Vue.component('qti-stylesheet', QtiStylesheet)
Vue.component('qti-stimulus-body', QtiStimulusBody)
Vue.component('qti-catalog-info', QtiCatalogInfo)

export default {
  name: 'QtiAssessmentStimulus',

  props: {
    identifier: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: false
    },
    label: {
      type: String,
      required: false
    },
    'xml:lang': {
      type: String,
      required: false
    }
  },

  data () {
    return {
      /*
       * Keep a handle on the stimulus body
       * Multiplicity [1]
       */
      stimulusBody: null,
      /*
       * Try to parse this from xml:lang
       */
      locale: null,
      /*
       * Keep a handle on the CatalogFactory
       */
      catalogFactory: null,
      /*
       * Keep a handle on any catalog info
       * Multiplicity [0..1]
       */
      catalogInfo: null,
      isQtiValid: true
    }
  },

  methods: {

    isStylesheet (tag) {
      if (tag === 'qti-stylesheet') return true
      return false
    },

    isStimulusBody (tag) {
      if (tag === 'qti-stimulus-body') return true
      return false
    },

    isCatalogInfo (tag) {
      if (tag === 'qti-catalog-info') return true
      return false
    },

    /**
     * @description This executes immediately upon completion
     * of a qti-stimulus-body $mount
     * @param node - an object containing an itemBody node
     */
    handleStimulusBodyReady (node) {
      this.stimulusBody = node;
    },

    /**
     * @description This executes immediately upon completion
     * of a qti-catalog-info $mount
     * @param node - an object containing a catalogInfo node
     */
    handleStimulusCatalogReady (node) {
      this.catalogInfo = node;

      // NOTE: When QtiAssessmentStimulus is inside a QtiAssessmentItem
      // we do not want to initialize a CatalogFactory as Catalog nodes
      // have been added to the global store.
      // After everything is mounted, bind Catalog to the DOM
      // this.catalogFactory = new CatalogFactory(this, store)
      this.catalogFactory = null;
      this.bindCatalog()
    },

    /**
     * @description Utility method to get the qti-stimulus-body node.
     * @return the stimulusBody node
     */
    getStimulusBody () {
      return this.stimulusBody
    },

    /**
     * @description Utility method to call the CatalogFactory's bindAll
     * method.  This effectively clears out all current Catalog bindings
     * and rebinds any catalog-idref's with current PNP settings.
     */
    bindCatalog () {
      if (this.catalogFactory !== null) this.catalogFactory.bindAll()
    },

    /**
     * @description Transform some qti-assessment-stimulus attributes.
     * Important: Run this at create time.  Mount is too late.
     */
    coerceStimulusAttributes () {
      // For now, return 'en' if nothing found. Sorry world.
      this.locale = (typeof this.$props['xml-lang'] === 'undefined' ? 'en' : this.$props['xml-lang'])
    },

    /**
     * Iterate through the child nodes:
     * qti-stylesheet (0-*)
     * qti-stimulus-body (1)
     * qti-catalog-info (0-1)
     */
    validateChildren () {

      if (!('default' in this.$slots)) {
        throw new QtiValidationException('Invalid AssessmentStimulus.  Must contain 1 qti-stimulus-body child node')
      }

      let countBody = 0
      let countCatalog = 0
      this.$slots.default.forEach((slot) => {
        if (qtiAttributeValidation.isValidSlot(slot)) {

          if (this.isStylesheet(slot.componentOptions.tag)) {
            if ((countBody > 0) || (countCatalog > 0)) {
              throw new QtiValidationException('Invalid qti-stylesheet child node.  Must preceed qti-stimulus-body and qti-catalog-info nodes')
            }

          } else if (this.isStimulusBody(slot.componentOptions.tag)) {

            if (countCatalog > 0) {
              throw new QtiValidationException('Invalid qti-stimulus-body child node.  Must preceed qti-catalog-info node')
            }
            if (countBody > 0) {
              throw new QtiValidationException('Maximum of 1 qti-stimulus-body child node permitted in qti-assessment-stimulus')
            }
            countBody += 1

          } else if (this.isCatalogInfo(slot.componentOptions.tag)) {

            if (countCatalog > 0) {
              throw new QtiValidationException('Maximum of 1 qti-catalog-info child node permitted in qti-assessment-stimulus')
            }
            countCatalog += 1

          } else {
            // if it's not a stylesheet, stimulus-body, or catalog-info node, it does not belong here.
            throw new QtiValidationException('Invalid AssessmentStimulus child node: "' + slot.componentOptions.tag + '"')
          }

        }
      })

      if (countBody == 0) {
        throw new QtiValidationException('Invalid AssessmentStimulus.  Must contain 1 qti-stimulus-body child node')
      }
    }

  },

  /**
   * @description This traps all JS errors that may occur in this component.
   */
  errorCaptured (err, vm) {
    console.log('[' + err.name + '][' + vm.$options.name + '] ' + err.message)
    return false
  },

  created () {
    this.coerceStimulusAttributes()
  },

  mounted () {
    if (this.isQtiValid) {
      try {
        this.validateChildren()

        console.log('[QtiAssessmentStimulus][Identifier]', this.identifier)

        // Notify our container that we are loaded.
        this.$parent.$emit('stimulusReady', {
          stimulus: this,
          identifier: this.identifier
        })

      } catch (err) {
        this.isQtiValid = false
        throw new QtiValidationException(err.message)
      }
    }
  },

  beforeDestroy () {
    // Unbind all Catalogs to avoid memory leaks
    if (this.catalogFactory !== null) this.catalogFactory.resetAll()
  }
}
</script>

<style>
</style>
