<template>
  <div ref="root"
    class="qti-stylesheet"
    v-html="css">
  </div>
</template>

<script>
/*
 * The set of external style sheets that are associated with the Item or Stimulus.
 * The order of definition is significant.
 */
import axios from 'axios'
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'

export default {
  name: 'QtiStylesheet',

  props: {
    /*
     * [1] multiplicity
     */
    href: {
      type: String,
      required: true
    },
    /*
     * According to the schema, this is required; e.g., "text/css"
     */
    type: {
      type: String,
      required: true
    }
  },

  data () {
    return {
      rawCss: '',
      css: '',
      isQtiValid: true
    }
  },

  methods: {

    getHref () {
      return this.href
    },

    getType () {
      return this.type
    },

    getRawCss () {
      return this.rawCss
    },

    /**
     * @description Pull the stylesheet from the Href URI.
     * Wrap stylesheet contents in a style element, then inject into the
     * DOM.
     */
    getCss () {
      axios.get(this.href).then(response => {
          this.rawCss = response.data
          this.css = `<style>${this.rawCss}</style>`
        })
        .catch(e => {
          console.log('[' + this.$options.name + '][CSS Fetch Error: ' + e + ']')
        })
    },

    validateChildren () {
      // noop
    }

  },

  created() {
    this.getCss();
  },

  mounted () {
    if (this.isQtiValid) {
      try {
        // Validate children.
        this.validateChildren()

        console.log('[' + this.$options.name + '][Href: ' + this.href + ']')
      } catch (err) {
        this.isQtiValid = false
        throw new QtiValidationException(err.message)
      }
    }
  }
}
</script>
