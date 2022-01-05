<template>
  <div id="app">
    <Qti3Player
      ref="qti3player"
      @getItemStateCompleted="handleGetStateCompleted"
    />
    <button ref="btnPrev" type="button" @click="handlePrevItem" class="btn btn-sm btn-outline-primary">Prev</button>
    <button ref="btnNext" type="button" @click="handleNextItem" class="btn btn-sm btn-outline-primary">Next</button>
  </div>
</template>

<script>
import Qti3Player from '@/Qti3Player.vue'

export default {
  name: 'App',
  components: {
    Qti3Player
  },

  data () {
    return {
      isTestStarted: false,
      currentItem: 0,
      items: [
        {
          "identifier": "q2-choice-interaction-single-cardinality",
          "guid": "0000-0000-0001",
          "xml": "<qti-assessment-item xmlns=\"http://www.imsglobal.org/xsd/imsqtiasi_v3p0\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:schemaLocation=\"http://www.imsglobal.org/xsd/imsqtiasi_v3p0 https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0_v1p0.xsd\" identifier=\"q2-choice-interaction-single-cardinality\" title=\"Q2 - Choice Interaction - Single Cardinality\" adaptive=\"false\" time-dependent=\"false\"><qti-response-declaration identifier=\"RESPONSE\" cardinality=\"single\" base-type=\"identifier\"/><qti-item-body><qti-choice-interaction response-identifier=\"RESPONSE\" shuffle=\"true\" min-choices=\"0\" max-choices=\"1\"><qti-prompt>Select 0 to 1 SimpleChoice below and end the attempt by submitting the response.</qti-prompt><qti-simple-choice identifier=\"choice_a\">choice_a</qti-simple-choice><qti-simple-choice identifier=\"choice_b\">choice_b</qti-simple-choice><qti-simple-choice identifier=\"choice_c\">choice_c</qti-simple-choice></qti-choice-interaction></qti-item-body></qti-assessment-item>"
        },
        {
          "identifier": "q2-choice-interaction-single-sv-1",
          "guid": "0000-0000-0002",
          "xml": "<qti-assessment-item xmlns=\"http://www.imsglobal.org/xsd/imsqtiasi_v3p0\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:schemaLocation=\"http://www.imsglobal.org/xsd/imsqtiasi_v3p0 https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0_v1p0.xsd\" identifier=\"q2-choice-interaction-single-sv-1\" title=\"Choice Interaction - Single (SV 1)\" adaptive=\"false\" time-dependent=\"false\"><qti-response-declaration identifier=\"RESPONSE\" cardinality=\"single\" base-type=\"identifier\"><qti-correct-response><qti-value>ChoiceA</qti-value></qti-correct-response></qti-response-declaration><qti-outcome-declaration identifier=\"SCORE\" cardinality=\"single\" base-type=\"float\"><qti-default-value><qti-value>0</qti-value></qti-default-value></qti-outcome-declaration><qti-item-body><p>Look at the text in the picture.</p><p><img src=\"https://s3.amazonaws.com/grud-amp-bucket-1/items/1/a8c5bf34-f8fd-4a87-a098-0d7213292cb6/images/sign.png\" alt=\"NEVER LEAVE LUGGAGE UNATTENDED\"/></p><qti-choice-interaction max-choices=\"1\" response-identifier=\"RESPONSE\"><qti-prompt>What does it say?</qti-prompt><qti-simple-choice identifier=\"ChoiceA\">You must stay with your luggage at all times.</qti-simple-choice><qti-simple-choice identifier=\"ChoiceB\">Do not let someone else look after your luggage.</qti-simple-choice><qti-simple-choice identifier=\"ChoiceC\">Remember your luggage when you leave.</qti-simple-choice></qti-choice-interaction></qti-item-body><qti-response-processing template=\"https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/match_correct.xml\"/></qti-assessment-item>"
        },
        {
          "identifier": "q2-choice-interaction-single-sv-4c",
          "guid": "0000-0002-0003",
          "xml": "<qti-assessment-item xmlns=\"http://www.imsglobal.org/xsd/imsqtiasi_v3p0\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:schemaLocation=\"http://www.imsglobal.org/xsd/imsqtiasi_v3p0 https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0_v1p0.xsd\" identifier=\"q2-choice-interaction-single-sv-4c\" title=\"Choice Interaction - Single (SV 4c)- stacking options\" \r\n    adaptive=\"false\" time-dependent=\"false\">\r\n    <qti-response-declaration identifier=\"RESPONSE1\" cardinality=\"single\" base-type=\"identifier\" />\r\n    <qti-response-declaration identifier=\"RESPONSE2\" cardinality=\"single\" base-type=\"identifier\" /><qti-response-declaration identifier=\"RESPONSE3\" cardinality=\"single\" base-type=\"identifier\" />\r\n    <qti-response-declaration identifier=\"RESPONSE4\" cardinality=\"single\" base-type=\"identifier\" />\r\n    <qti-response-declaration identifier=\"RESPONSE5\" cardinality=\"single\" base-type=\"identifier\" />\r\n    <qti-response-declaration identifier=\"RESPONSE6\" cardinality=\"single\" base-type=\"identifier\" />\r\n    <qti-response-declaration identifier=\"RESPONSE7\" cardinality=\"single\" base-type=\"identifier\" />\r\n    <qti-response-declaration identifier=\"RESPONSE8\" cardinality=\"single\" base-type=\"identifier\" />\r\n    <qti-response-declaration identifier=\"RESPONSE9\" cardinality=\"single\" base-type=\"identifier\" />\r\n    <qti-response-declaration identifier=\"RESPONSE10\" cardinality=\"single\" base-type=\"identifier\" />\r\n    <qti-response-declaration identifier=\"RESPONSE11\" cardinality=\"single\" base-type=\"identifier\" /><qti-response-declaration identifier=\"RESPONSE12\" cardinality=\"single\" base-type=\"identifier\" />\r\n    <qti-outcome-declaration identifier=\"SCORE\" cardinality=\"single\" base-type=\"float\" />\r\n    <qti-item-body>\r\n        <p>Look at the text in the picture.  What does it say?</p>\r\n        <p>\r\n            <img src=\"https://s3.amazonaws.com/grud-amp-bucket-1/items/1/a8c5bf34-f8fd-4a87-a098-0d7213292cb6/images/sign.png\" alt=\"NEVER LEAVE LUGGAGE UNATTENDED\"/></p><qti-choice-interaction class=\"qti-choices-stacking-4\" max-choices=\"1\" response-identifier=\"RESPONSE1\">\r\n            <qti-prompt>Demonstrates <em>qti-choices-stacking-4</em>.</qti-prompt>\r\n            <qti-simple-choice identifier=\"ChoiceA\">You must stay with your luggage at all times.</qti-simple-choice>\r\n            <qti-simple-choice identifier=\"ChoiceB\">Do not let someone else look after your luggage.</qti-simple-choice><qti-simple-choice identifier=\"ChoiceC\">Remember your luggage when you leave.</qti-simple-choice><qti-simple-choice identifier=\"ChoiceD\">It's a good idea to leave your luggage unattended.</qti-simple-choice>\r\n        </qti-choice-interaction>\r\n\r\n        <qti-choice-interaction class=\"qti-choices-stacking-3\" max-choices=\"1\" response-identifier=\"RESPONSE2\">\r\n            <qti-prompt>Demonstrates <em>qti-choices-stacking-3</em>.</qti-prompt><qti-simple-choice identifier=\"ChoiceA\">You must stay with your luggage at all times.</qti-simple-choice><qti-simple-choice identifier=\"ChoiceB\">Do not let someone else look after your luggage.</qti-simple-choice><qti-simple-choice identifier=\"ChoiceC\">Remember your luggage when you leave.</qti-simple-choice>\r\n            <qti-simple-choice identifier=\"ChoiceD\">It's a good idea to leave your luggage unattended.</qti-simple-choice>\r\n        </qti-choice-interaction>\r\n\r\n        <qti-choice-interaction class=\"qti-choices-stacking-2\" max-choices=\"1\" response-identifier=\"RESPONSE3\"><qti-prompt>Demonstrates <em>qti-choices-stacking-2</em>.</qti-prompt><qti-simple-choice identifier=\"ChoiceA\">You must stay with your luggage at all times.</qti-simple-choice>\r\n            <qti-simple-choice identifier=\"ChoiceB\">Do not let someone else look after your luggage.</qti-simple-choice>\r\n            <qti-simple-choice identifier=\"ChoiceC\">Remember your luggage when you leave.</qti-simple-choice><qti-simple-choice identifier=\"ChoiceD\">It's a good idea to leave your luggage unattended.</qti-simple-choice></qti-choice-interaction>\r\n\r\n        <qti-choice-interaction class=\"qti-choices-stacking-1\" max-choices=\"1\" response-identifier=\"RESPONSE4\"><qti-prompt>Demonstrates <em>qti-choices-stacking-1</em>.</qti-prompt>\r\n            <qti-simple-choice identifier=\"ChoiceA\">You must stay with your luggage at all times.</qti-simple-choice><qti-simple-choice identifier=\"ChoiceB\">Do not let someone else look after your luggage.</qti-simple-choice>\r\n            <qti-simple-choice identifier=\"ChoiceC\">Remember your luggage when you leave.</qti-simple-choice>\r\n            <qti-simple-choice identifier=\"ChoiceD\">It's a good idea to leave your luggage unattended.</qti-simple-choice>\r\n        </qti-choice-interaction><qti-choice-interaction class=\"qti-choices-stacking-4 qti-orientation-horizontal\" max-choices=\"1\" response-identifier=\"RESPONSE5\"><qti-prompt>Demonstrates <em>qti-choices-stacking-4 and qti-orientation-horizontal</em>.</qti-prompt>\r\n            <qti-simple-choice identifier=\"ChoiceA\">You must stay with your luggage at all times.</qti-simple-choice>\r\n            <qti-simple-choice identifier=\"ChoiceB\">Do not let someone else look after your luggage.</qti-simple-choice>\r\n            <qti-simple-choice identifier=\"ChoiceC\">Remember your luggage when you leave.</qti-simple-choice><qti-simple-choice identifier=\"ChoiceD\">It's a good idea to leave your luggage unattended.</qti-simple-choice>\r\n        </qti-choice-interaction>\r\n\r\n        <qti-choice-interaction class=\"qti-choices-stacking-3 qti-orientation-horizontal\" max-choices=\"1\" response-identifier=\"RESPONSE6\">\r\n            <qti-prompt>Demonstrates <em>qti-choices-stacking-3 and qti-orientation-horizontal</em>.</qti-prompt>\r\n            <qti-simple-choice identifier=\"ChoiceA\">You must stay with your luggage at all times.</qti-simple-choice><qti-simple-choice identifier=\"ChoiceB\">Do not let someone else look after your luggage.</qti-simple-choice>\r\n            <qti-simple-choice identifier=\"ChoiceC\">Remember your luggage when you leave.</qti-simple-choice>\r\n            <qti-simple-choice identifier=\"ChoiceD\">It's a good idea to leave your luggage unattended.</qti-simple-choice></qti-choice-interaction><qti-choice-interaction class=\"qti-choices-stacking-2 qti-orientation-horizontal\" max-choices=\"1\" response-identifier=\"RESPONSE7\">\r\n            <qti-prompt>Demonstrates <em>qti-choices-stacking-2 and qti-orientation-horizontal</em>.</qti-prompt>\r\n            <qti-simple-choice identifier=\"ChoiceA\">You must stay with your luggage at all times.</qti-simple-choice>\r\n            <qti-simple-choice identifier=\"ChoiceB\">Do not let someone else look after your luggage.</qti-simple-choice><qti-simple-choice identifier=\"ChoiceC\">Remember your luggage when you leave.</qti-simple-choice>\r\n            <qti-simple-choice identifier=\"ChoiceD\">It's a good idea to leave your luggage unattended.</qti-simple-choice>\r\n        </qti-choice-interaction><qti-choice-interaction class=\"qti-choices-stacking-1 qti-orientation-horizontal\" max-choices=\"1\" response-identifier=\"RESPONSE8\"><qti-prompt>Demonstrates <em>qti-choices-stacking-1 and qti-orientation-horizontal</em>.</qti-prompt><qti-simple-choice identifier=\"ChoiceA\">You must stay with your luggage at all times.</qti-simple-choice>\r\n            <qti-simple-choice identifier=\"ChoiceB\">Do not let someone else look after your luggage.</qti-simple-choice>\r\n            <qti-simple-choice identifier=\"ChoiceC\">Remember your luggage when you leave.</qti-simple-choice><qti-simple-choice identifier=\"ChoiceD\">It's a good idea to leave your luggage unattended.</qti-simple-choice></qti-choice-interaction><qti-choice-interaction class=\"qti-choices-stacking-4 qti-orientation-vertical\" max-choices=\"1\" response-identifier=\"RESPONSE9\">\r\n            <qti-prompt>Demonstrates <em>qti-choices-stacking-4 and qti-orientation-vertical</em>.</qti-prompt>\r\n            <qti-simple-choice identifier=\"ChoiceA\">You must stay with your luggage at all times.</qti-simple-choice><qti-simple-choice identifier=\"ChoiceB\">Do not let someone else look after your luggage.</qti-simple-choice><qti-simple-choice identifier=\"ChoiceC\">Remember your luggage when you leave.</qti-simple-choice>\r\n            <qti-simple-choice identifier=\"ChoiceD\">It's a good idea to leave your luggage unattended.</qti-simple-choice></qti-choice-interaction><qti-choice-interaction class=\"qti-choices-stacking-3 qti-orientation-vertical\" max-choices=\"1\" response-identifier=\"RESPONSE10\">\r\n            <qti-prompt>Demonstrates <em>qti-choices-stacking-3 and qti-orientation-vertical</em>.</qti-prompt>\r\n            <qti-simple-choice identifier=\"ChoiceA\">You must stay with your luggage at all times.</qti-simple-choice>\r\n            <qti-simple-choice identifier=\"ChoiceB\">Do not let someone else look after your luggage.</qti-simple-choice><qti-simple-choice identifier=\"ChoiceC\">Remember your luggage when you leave.</qti-simple-choice><qti-simple-choice identifier=\"ChoiceD\">It's a good idea to leave your luggage unattended.</qti-simple-choice>\r\n        </qti-choice-interaction>\r\n\r\n        <qti-choice-interaction class=\"qti-choices-stacking-2 qti-orientation-vertical\" max-choices=\"1\" response-identifier=\"RESPONSE11\"><qti-prompt>Demonstrates <em>qti-choices-stacking-2 and qti-orientation-vertical</em>.</qti-prompt><qti-simple-choice identifier=\"ChoiceA\">You must stay with your luggage at all times.</qti-simple-choice>\r\n            <qti-simple-choice identifier=\"ChoiceB\">Do not let someone else look after your luggage.</qti-simple-choice>\r\n            <qti-simple-choice identifier=\"ChoiceC\">Remember your luggage when you leave.</qti-simple-choice><qti-simple-choice identifier=\"ChoiceD\">It's a good idea to leave your luggage unattended.</qti-simple-choice></qti-choice-interaction><qti-choice-interaction class=\"qti-choices-stacking-1 qti-orientation-vertical\" max-choices=\"1\" response-identifier=\"RESPONSE12\">\r\n            <qti-prompt>Demonstrates <em>qti-choices-stacking-1 and qti-orientation-vertical</em>.</qti-prompt>\r\n            <qti-simple-choice identifier=\"ChoiceA\">You must stay with your luggage at all times.</qti-simple-choice><qti-simple-choice identifier=\"ChoiceB\">Do not let someone else look after your luggage.</qti-simple-choice><qti-simple-choice identifier=\"ChoiceC\">Remember your luggage when you leave.</qti-simple-choice>\r\n            <qti-simple-choice identifier=\"ChoiceD\">It's a good idea to leave your luggage unattended.</qti-simple-choice>\r\n         </qti-choice-interaction>\t\r\n    </qti-item-body></qti-assessment-item>"
        }
      ],
      maxItems: 3,
      itemStates: new Map(),
      qti3Player: null
    }
  },

  methods: {

    initialize () {
      // Get handle on the player
      this.qti3Player = this.$refs.qti3player
    },

    loadFirstItem () {
      this.loadItemAtIndex(0)
    },

    handleNextItem () {
      console.log('[Controller][NextItem][' + this.currentItem + ']')
      if (!this.isTestStarted) {
        this.isTestStarted = true
        this.loadFirstItem()
        return
      }

      //this.toggleButtonDisabled (this.$refs.btnNext, true)
      this.initiateNavigateNextItem()
    },

    handlePrevItem () {
      console.log('[Controller][PrevItem][' + this.currentItem + ']')
      if (this.currentItem === 0) return

      //this.toggleButtonDisabled (this.$refs.btnPrev, true)
      this.initiateNavigatePrevItem()
    },

    initiateNavigateNextItem () {
      this.qti3Player.getItemState('navigateNextItem')
    },

    navigateNextItem (state) {
      console.log('[NavigateNextItem]', state)

      // Save our state
      this.setTestStateItemState(state)

      this.currentItem += 1
      this.loadItemAtIndex(this.currentItem)
    },

    initiateNavigatePrevItem () {
      this.qti3Player.getItemState('navigatePrevItem')
    },

    navigatePrevItem (state) {
      console.log('[NavigatePrevItem]', state)

      // Save our state
      this.setTestStateItemState(state)

      this.currentItem -= 1
      this.loadItemAtIndex(this.currentItem)
    },

    handleGetStateCompleted (data) {
      switch (data.target) {
        case 'navigateNextItem':
          this.navigateNextItem(data.state)
          break

        case 'navigatePrevItem':
          this.navigatePrevItem(data.state)
          break

        default:
          // Unknown data.target --> NOOP
      }
    },

    loadItemAtIndex (index) {
      if (index === null) return
      if ((index < 0) || (index > this.maxItems-1)) return

      // Build a configuration
      const configuration = this.getConfiguration(this.items[index].guid)

      this.qti3Player.loadItemFromXml(this.items[index].xml, configuration)
    },

    toggleButtonDisabled (buttonRef, disable) {
      if (disable) {
        buttonRef.setAttribute('disabled', '')
      } else {
        buttonRef.removeAttribute('disabled')
      }
    },

    setTestStateItemState (state) {
      this.itemStates.set(state.guid, state)
    },

    getTestStateItemState (guid) {
      return this.itemStates.get(guid)
    },

    getConfiguration (guid) {
      const configuration = {}

      // Fetch prior state from Test State
      const state = this.getTestStateItemState(guid)
      if (typeof state !== 'undefined') {
        configuration.state = state
      }

      // IMPORTANT: Stamp the item's tracking guid onto the configuration
      configuration.guid = guid
      configuration.pnp = null
      configuration.sessionControl = null

      return configuration
    }
  },

  mounted () {
    this.initialize()
  }
}
</script>

<style>
</style>
