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
    type: {
      type: String,
      required: false
    }
  },

  data () {
    return {
      css: '',
      isQtiValid: true
    }
  },

  methods: {

    getCss () {
      axios.get(this.href).then(response => {
          this.css = `<style>${response.data}</style>`
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
