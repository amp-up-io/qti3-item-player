<template>
  <div ref="root"
    class="qti-assessment-stimulus-ref">
  </div>
</template>

<script>
/*
 * This is the structure that enables reference to a 'qti-assessment-stimulus' instance. The
 * The stimulus must be contained within its own instance and so the Item uses the
 * 'qti-assessment-stimulus-ref' structure to provide the link between the Item and
 * the Stimulus.
 *
 * The set of identifier references to the stimulus content that should be associated
 * with the Item. Each identifier must resolve to some AssessmentStimulus object that
 * has been associated with the Item.
 */
import { store } from '@/store/store'
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiParseException from '@/components/qti/exceptions/QtiParseException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'

const qtiAttributeValidation = new QtiAttributeValidation()

export default {
  name: 'QtiAssessmentStimulusRef',

  props: {
    /*
     * [1] multiplicity
     */
    identifier: {
      type: String,
      required: true
    },
    /*
     * [1] multiplicity
     */
    href: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: false
    }
  },

  data () {
    return {
      isQtiValid: true
    }
  },

  methods: {

    /**
     * @description Pull the stimulus from the Href URI.
     * Save results in the store.
     */
    defineStimulus () {
      // Define a reference
      const stimulusRefObject = {
        identifier: this.identifier,
        href: this.href,
        title: this.title,
        data: null,
        error: null
      }

      store.defineStimulusRef(stimulusRefObject)
    }

  },

  created () {
    try {
      qtiAttributeValidation.validateIdentifierAttribute(this.identifier)
      this.defineStimulus()
    } catch (err) {
      this.isQtiValid = false
      if (err.name === 'QtiValidationException') {
        throw new QtiValidationException(err.message)
      } else if (err.name === 'QtiParseException') {
        throw new QtiParseException(err.message)
      } else {
        throw new Error(err.message)
      }
    }
  },

  mounted () {
    if (this.isQtiValid) {
      try {
        console.log('[' + this.$options.name + '][Identifier: ' + this.identifier + '][Href: ' + this.href + ']')
      } catch (err) {
        this.isQtiValid = false
        throw new QtiValidationException(err.message)
      }
    }
  }
}
</script>
