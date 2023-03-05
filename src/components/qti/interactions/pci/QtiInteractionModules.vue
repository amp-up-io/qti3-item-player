<template>
  <div ref="root"
    class="qti-interaction-modules">
    <slot></slot>
  </div>
</template>

<script>
/*
 * The set of interaction configuration settings to be used by the associated PCI. 
 * These settings are defined with respect to the set of JavaScript library modules.
 */
import Vue from 'vue'
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiInteractionModule from '@/components/qti/interactions/pci/QtiInteractionModule'

Vue.component('qti-interaction-module', QtiInteractionModule)

export default {
  name: 'QtiInteractionModules',

  props: {
    /*
     * Provides a URL which is a reference to a JSON configuration file which 
     * describes the PCI module configuration to use for this interaction instance. 
     * Relative URLs indicate relative paths in the QTI content package. If no value 
     * is supplied a value of "modules/module_resolution.js" should be applied.
     */
     primaryConfiguration: {
      required: false,
      type: String,
      default: ''
    },
    /*
     * Provides a URL which is a reference to a JSON configuration file which 
     * describes the PCI module configuration to use for this interaction instance. 
     * Relative URLs indicate relative paths in the QTI content package. If no value 
     * is supplied a value of "modules/fallback_module_resolution.js" should be applied.
     */
    secondaryConfiguration: {
      required: false,
      type: String,
      default: ''
    },
  },

  data () {
    return {
      modules: [],
      isQtiValid: true
    }
  },

  inheritAttrs: true,

  methods: {

    getPrimaryConfiguration () {
      return this.primaryConfiguration
    },

    getSecondaryConfiguration () {
      return this.secondaryConfiguration
    },

    getModules () {
      return this.modules
    },

    validateChildren () {
      // No validation.  Save off our children.
      this.processChildren()
    },

    processChildren () {
      this.$children.forEach((node) => {
        if (node.$vnode.componentOptions.tag === 'qti-interaction-module') {
          this.modules.push(node)
        }
      })
    }

  },

  mounted () {
    if (this.isQtiValid) {
      try {
        this.validateChildren()

        console.log('[PCI][' + this.$options.name + '][PrimaryCfg='+this.primaryConfiguration+'][SecondaryCfg='+this.secondaryConfiguration+']')
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
div.qti-interaction-modules {
  display: none;
}
</style>
