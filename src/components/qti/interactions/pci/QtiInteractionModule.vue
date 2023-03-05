<template>
  <div ref="root"
    class="qti-interaction-module">
  </div>
</template>

<script>
/*
 * Provides the id of a Javascript module that the PCI API will attempt to dynamically 
 * load and inject into the PCI module. By default the id will be resolved via the 
 * module configuration files loaded in the parent qti-interaction-modules element. 
 * If primary-path and/or fallback-path are provided they can be used to override 
 * the module configuration file with a particular location to load the module from. 
 * The id may also be used by the loaded modules to refer to the other modules loaded 
 * for this interaction.
 */
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'

export default {
  name: 'QtiInteractionModule',

  props: {
    /*
     * The identifier for the module required by the PCI.
     */
    id: {
      required: true,
      type: String
    },
    /*
     * Multiplicity [0..1]
     * If provided, this overrides the module configuration defined by the parent 
     * qti-interaction-modules element and provides the primary location from which 
     * to load the Javascript module.
     */
     primaryPath: {
      required: false,
      type: String,
      default: ''
    },
    /*
     * Multiplicity [0..1]
     * If provided, this overrides the module configuration defined by the parent 
     * qti-interaction-modules element and provides the location from which to load 
     * the Javascript module if the module can't be loaded from the primary location.
     */
    fallbackPath: {
      required: false,
      type: String,
      default: ''
    },
  },

  data () {
    return {
      isQtiValid: true
    }
  },

  inheritAttrs: true,

  methods: {

    getId () {
      return this.id
    },

    getPrimaryPath () {
      return this.primaryPath
    },

    getFallbackPath () {
      return this.fallbackPath
    }

  },

  mounted () {
    if (this.isQtiValid) {
      try {
        console.log('[PCI][' + this.$options.name + '][Id='+this.id+']','[Primary='+this.primaryPath+']','[Fallback='+this.fallbackPath+']')
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
div.qti-interaction-module {
  display: none;
}
</style>
