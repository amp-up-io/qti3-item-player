<template>
  <div class="qti-response-processing">
    <div v-if="useStandardTemplate">
      <component ref="rptemplate" v-bind:is="templateXml"></component>
    </div>
    <div v-if="containsSlotData">
      <slot></slot>
    </div>
  </div>
</template>

<script>
import { store } from '@/store/store'
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'
import '@/components/qti/processing'

const qtiProcessing = new QtiProcessing()

export default {
  name: 'QtiResponseProcessing',

  props: {
    template: {
      type: String,
      required: false
    }
  },

  data () {
    return {
      responseRules: [],
      isQtiValid: true,

      matchCorrectXml: `<qti-response-condition>
      <qti-response-if>
          <qti-match>
              <qti-variable identifier="RESPONSE"/>
              <qti-correct identifier="RESPONSE"/>
          </qti-match>
          <qti-set-outcome-value identifier="SCORE">
              <qti-base-value base-type="float">1</qti-base-value>
          </qti-set-outcome-value>
      </qti-response-if>
      <qti-response-else>
          <qti-set-outcome-value identifier="SCORE">
              <qti-base-value base-type="float">0</qti-base-value>
          </qti-set-outcome-value>
      </qti-response-else>
  </qti-response-condition>`,
      mapResponseXml: `<qti-response-condition>
        <qti-response-if>
            <qti-is-null>
                <qti-variable identifier="RESPONSE"/>
            </qti-is-null>
            <qti-set-outcome-value identifier="SCORE">
                <qti-base-value base-type="float">0</qti-base-value>
            </qti-set-outcome-value>
        </qti-response-if>
        <qti-response-else>
            <qti-set-outcome-value identifier="SCORE">
                <qti-map-response identifier="RESPONSE"/>
            </qti-set-outcome-value>
        </qti-response-else>
    </qti-response-condition>`,
      mapResponsePointXml: `<qti-response-condition>
        <qti-response-if>
            <qti-is-null>
                <qti-variable identifier="RESPONSE"/>
            </qti-is-null>
            <qti-set-outcome-value identifier="SCORE">
                <qti-base-value base-type="float">0</qti-base-value>
            </qti-set-outcome-value>
        </qti-response-if>
        <qti-response-else>
            <qti-set-outcome-value identifier="SCORE">
                <qti-map-response-point identifier="RESPONSE"/>
            </qti-set-outcome-value>
        </qti-response-else>
    </qti-response-condition>`
    }
  },

  computed: {
    containsSlotData () {
      return this.$slots.default
    },

    useStandardTemplate () {
      // Support standard template injection IF there are no qti-response-processing child nodes
      if (!this.containsSlotData) {
        const isMatchCorrect = /.*(match_correct.xml|match_correct)$/
        const isMapResponse = /.*(map_response.xml|map_response)$/
        const isMapResponsePoint = /.*(map_response_point.xml|map_response_point)$/
        return (isMatchCorrect.test(this.template) || isMapResponse.test(this.template) || isMapResponsePoint.test(this.template))
      }
      return false
    },

    templateXml () {
      const isMatchCorrect = /.*(match_correct.xml|match_correct)$/
      const isMapResponse = /.*(map_response.xml|map_response)$/
      const isMapResponsePoint = /.*(map_response_point.xml|map_response_point)$/

      let xml = ''
      if (isMatchCorrect.test(this.template)) {
        console.log('[ResponseProcessing][template]', 'MATCH_CORRECT')
        xml = this.matchCorrectXml
      } else if (isMapResponse.test(this.template)) {
        console.log('[ResponseProcessing][template]', 'MAP_RESPONSE')
        xml = this.mapResponseXml
      } else if (isMapResponsePoint.test(this.template)) {
        console.log('[ResponseProcessing][template]', 'MAP_RESPONSE_POINT')
        xml = this.mapResponsePointXml
      }

      return {
        template: '<div id="amp-rptemplate-container">' + xml + '</div>'
      }
    }
  },

  methods: {

    getChildren () {
      return (this.useStandardTemplate ?  this.$refs.rptemplate.$children : this.$children)
    },

    /**
     * Iterate through the optional child nodes:
     * qti-response-condition
     * qti-response-processing-fragment
     * qti-set-outcome-value
     * qti-lookup-outcome-value
     * qti-exit-response
     */
    validateChildren: function () {
      const childNodes = this.getChildren()
      childNodes.forEach((node) => {
        if (!qtiProcessing.isResponseRuleNode(node.$el.className)) {
          throw new QtiValidationException('Invalid Response Rule: "' + node.$el.className + '"')
        }
      })
      this.processChildren()
    },

    processChildren () {
      // if using a standard template, the rules will be one additional level down from this component
      let rpRoot = (this.useStandardTemplate ? this.$children[0] : this)
      rpRoot.$children.forEach((rule) => {
        this.responseRules.push(rule)
      })
    },

    evaluate () {
      try {
        this.responseRules.forEach((rule) => {
          rule.evaluate()
        })
      } catch (err) {
        if (err.name === 'QtiValidationException') {
          throw new QtiValidationException(err.message)
        } else if (err.name === 'QtiEvaluationException') {
          throw new QtiEvaluationException(err.message)
        } else if (err.name === 'QtiExitProcessingException') {
          console.log('[' + err.name + '] ' + err.message)
        } else {
          throw new Error(err.message)
        }
      }
    }

  },

  created () {
  },

  mounted () {
    if (this.isQtiValid) {
      try {
        // Post-process children
        this.validateChildren()
        // Notify store of our new model.
        store.defineResponseProcessing({
            node: this
          })
      } catch (err) {
        this.isQtiValid = false
        throw new QtiValidationException(err.message)
      }
    }
  }
}
</script>
