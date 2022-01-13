<template>
  <div id="app">
    <Qti3Player
      ref="qti3player"
      v-bind:container-class="containerClass"
      v-bind:color-class="colorClass"
      suppress-alert-messages
      suppress-invalid-response-messages
      @notifyQti3PlayerReady="handlePlayerReady"
      @notifyQti3ItemReady="handleItemReady"
      @notifyQti3GetItemStateCompleted="handleGetStateCompleted"
      @notifyQti3EndAttemptCompleted="handleEndAttemptCompleted"
      @notifyQti3ItemAlertEvent="displayItemAlertEvent"
    />
    <button ref="btnPrev" type="button" @click="handlePrevItem" class="btn btn-sm btn-outline-primary">Prev</button>
    <button ref="btnNext" type="button" @click="handleNextItem" class="btn btn-sm btn-outline-primary">Next</button>
  </div>
</template>

<script>
import Qti3Player from '@/Qti3Player.vue'
import { PnpFactory } from '@/shared/helpers/PnpFactory'
import { SessionControlFactory } from '@/shared/helpers/SessionControlFactory'
import Swal from 'sweetalert2'

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
          "identifier": "i9b-response-processing-fixed-template-match-correct-identifier",
          "guid": "0000-0005-0001",
          "xml": "<qti-assessment-item xmlns=\"http://www.imsglobal.org/xsd/imsqtiasi_v3p0\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:schemaLocation=\"http://www.imsglobal.org/xsd/imsqtiasi_v3p0 https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0_v1p0.xsd\" identifier=\"i9b-response-processing-fixed-template-match_correct-identifier\" title=\"I9b - Response Processing Fixed Template - Match Correct Identifier\" adaptive=\"false\" time-dependent=\"false\">\n    <qti-response-declaration identifier=\"RESPONSE\" cardinality=\"single\" base-type=\"identifier\"><qti-correct-response><qti-value>choice_a</qti-value></qti-correct-response>\n    </qti-response-declaration>\n    <qti-outcome-declaration identifier=\"SCORE\" cardinality=\"single\" base-type=\"float\"/>\n    <qti-item-body>\n        <qti-choice-interaction response-identifier=\"RESPONSE\" max-choices=\"1\"><qti-prompt>Select a SimpleChoice below or do not select any SimpleChoice, and trigger Response Processing by ending the attempt.</qti-prompt><qti-simple-choice identifier=\"choice_a\">Correct</qti-simple-choice><qti-simple-choice identifier=\"choice_b\">Incorrect</qti-simple-choice>\n        </qti-choice-interaction>\n    </qti-item-body>\n    <qti-response-processing template=\"https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/match_correct.xml\"/>\n</qti-assessment-item>"
        },
        {
          "identifier": "i9b-response-processing-fixed-template-map-response-identifier",
          "guid": "0000-0005-0002",
          "xml": "<qti-assessment-item xmlns=\"http://www.imsglobal.org/xsd/imsqtiasi_v3p0\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:schemaLocation=\"http://www.imsglobal.org/xsd/imsqtiasi_v3p0 https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0_v1p0.xsd\" identifier=\"i9b-response-processing-fixed-template-map-response-identifier\" title=\"I9b - Response Processing Fixed Template - Map Response Identifier\" adaptive=\"false\" time-dependent=\"false\">\n    <qti-response-declaration identifier=\"RESPONSE\" cardinality=\"multiple\" base-type=\"identifier\"><!-- Optimal Response --><qti-correct-response><qti-value>choice_a</qti-value>\n            <qti-value>choice_b</qti-value>\n            <qti-value>choice_c</qti-value>\n        </qti-correct-response>\n        <qti-mapping lower-bound=\"0\" upper-bound=\"6\" default-value=\"0\"><qti-map-entry map-key=\"choice_a\" mapped-value=\"1\"/><qti-map-entry map-key=\"choice_b\" mapped-value=\"2.0\"/><qti-map-entry map-key=\"choice_c\" mapped-value=\"5\"/><qti-map-entry map-key=\"choice_d\" mapped-value=\"-1\"/><qti-map-entry map-key=\"choice_e\" mapped-value=\"-2.0\"/>\n            <qti-map-entry map-key=\"choice_f\" mapped-value=\"-5\"/>\n        </qti-mapping>\n    </qti-response-declaration><qti-outcome-declaration identifier=\"SCORE\" cardinality=\"single\" base-type=\"float\"/><qti-item-body><qti-choice-interaction response-identifier=\"RESPONSE\" min-choices=\"0\" max-choices=\"6\"><qti-prompt>Select 0 to 6 SimpleChoices below and trigger Response Processing by ending the attempt.</qti-prompt><qti-simple-choice identifier=\"choice_a\">Mapped Value = 1.0</qti-simple-choice>\n            <qti-simple-choice identifier=\"choice_b\">Mapped Value = 2.0</qti-simple-choice><qti-simple-choice identifier=\"choice_c\">Mapped Value = 5.0</qti-simple-choice><qti-simple-choice identifier=\"choice_d\">Mapped Value = -1.0</qti-simple-choice><qti-simple-choice identifier=\"choice_e\">Mapped Value = -2.0</qti-simple-choice><qti-simple-choice identifier=\"choice_f\">Mapped Value = -5.0</qti-simple-choice>\n        </qti-choice-interaction>\n    </qti-item-body>\n    <qti-response-processing template=\"https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/map_response.xml\"/></qti-assessment-item>"
        },
        {
          "identifier": "i19b-shared-css-vocab-1",
          "guid": "0000-0004-0001",
          "xml": "<qti-assessment-item xmlns=\"http://www.imsglobal.org/xsd/imsqtiasi_v3p0\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:schemaLocation=\"http://www.imsglobal.org/xsd/imsqtiasi_v3p0 https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0_v1p0.xsd\" identifier=\"i19b-shared-css-vocab-1\" title=\"i19b Shared CSS Vocabulary 1\" \r\n  time-dependent=\"false\" adaptive=\"false\"><qti-item-body><div>\r\n      <![CDATA[<amp-style>/* These styles not part of shared css */      .muted {color:#999999;font-size:smaller;}      </amp-style>]]><h4>Underline an Element</h4>\r\n\r\n      <p>Look at the <span class=\"qti-underline\">underlined text</span> in this sentence.</p>\r\n\r\n      <h4>Italicize an Element</h4>\r\n\r\n      <p>Look at the <span class=\"qti-italic\">italicized text</span> in this sentence.</p>\r\n    \r\n      <h4>Horizontal Alignment - Left, Center, Right <span class=\"muted\">- table border added for effect</span></h4>\r\n\r\n      <table class=\"qti-fullwidth qti-bordered\">\r\n        <tbody>\r\n          <tr>\r\n            <td class=\"qti-align-left\">I am left-aligned text in a table cell.</td>\r\n          </tr>\r\n          <tr>\r\n            <td class=\"qti-align-center\">I am center-aligned text in a table cell.</td>\r\n          </tr>\r\n          <tr>\r\n            <td class=\"qti-align-right\">I am right-aligned text in a table cell.</td>\r\n          </tr>\r\n        </tbody>\r\n      </table>\r\n    \r\n      <h4>Vertical Alignment - Top, Middle, Baseline, Bottom <span class=\"muted\">- 4x28 images and paragraph borders added for effect</span></h4>\r\n    \r\n      <p class=\"qti-bordered\">\r\n        <img class=\"qti-valign-top\" alt=\"placeholder\" src=\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAcCAYAAABGdB6IAAAAFUlEQVR42mNkYPhfz4AEGEcFhosAAM7zKeUTvPB1AAAAAElFTkSuQmCC\" hspace=\"4\" vspace=\"0\" width=\"4\" height=\"28\"/>\r\n        I am top-valigned.\r\n      </p>\r\n      <p class=\"qti-bordered\">\r\n        <img class=\"qti-valign-middle\" alt=\"placeholder\" src=\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAcCAYAAABGdB6IAAAAFUlEQVR42mNkYPhfz4AEGEcFhosAAM7zKeUTvPB1AAAAAElFTkSuQmCC\" hspace=\"4\" vspace=\"0\" width=\"4\" height=\"28\"/>\r\n        I am middle-valigned.\r\n      </p>\r\n      <p class=\"qti-bordered\">\r\n        <img class=\"qti-valign-baseline\" alt=\"placeholder\" src=\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAcCAYAAABGdB6IAAAAFUlEQVR42mNkYPhfz4AEGEcFhosAAM7zKeUTvPB1AAAAAElFTkSuQmCC\" hspace=\"4\" vspace=\"0\" width=\"4\" height=\"28\"/>\r\n        I am baseline-valigned.\r\n      </p>\r\n      <p class=\"qti-bordered\">\r\n        <img class=\"qti-valign-bottom\" alt=\"placeholder\"  src=\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAcCAYAAABGdB6IAAAAFUlEQVR42mNkYPhfz4AEGEcFhosAAM7zKeUTvPB1AAAAAElFTkSuQmCC\" hspace=\"4\" vspace=\"0\" width=\"4\" height=\"28\"/>\r\n        I am bottom-valigned.\r\n      </p>\r\n    \r\n      <h4>Make an Element Fullwidth (width=100%) <span class=\"muted\">- table border added for effect</span></h4>\r\n    \r\n      <table class=\"qti-fullwidth qti-bordered\">\r\n        <tbody>\r\n          <tr>\r\n            <td class=\"qti-align-left\">I am left-aligned</td>\r\n          </tr>\r\n          <tr>\r\n            <td class=\"qti-align-center\">I am center-aligned</td>\r\n          </tr>\r\n          <tr>\r\n            <td class=\"qti-align-right\">I am right-aligned</td>\r\n          </tr>\r\n        </tbody>\r\n      </table>\r\n    \r\n      <h4>Add an Element Border <span class=\"muted\">- second paragraph is bordered</span></h4>\r\n    \r\n      <p>\r\n        Ho hum.  I am a non-bordered paragraph.\r\n      </p>\r\n      <p class=\"qti-bordered\">\r\n        Look at me! I am a bordered paragraph.\r\n      </p>\r\n      <p>\r\n        I am yet another non-bordered paragraph.\r\n      </p>\r\n    \r\n      <h4>Place an element in a Well <span class=\"muted\">- second paragraph is in a well</span></h4>\r\n    \r\n      <p>\r\n        Ho hum.  I am a non-bordered paragraph.\r\n      </p>\r\n      <p class=\"qti-well\">\r\n        Look at me! I am in a well!\r\n      </p>\r\n      <p>\r\n        I am yet another non-bordered paragraph.\r\n      </p>\r\n    \r\n    </div>\r\n  </qti-item-body>\r\n</qti-assessment-item>"
        },
        {
          "identifier": "i19b-shared-css-vocab-2",
          "guid": "0000-0004-0002",
          "xml": "<qti-assessment-item \r\n  xmlns=\"http://www.imsglobal.org/xsd/imsqtiasi_v3p0\" \r\n  xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"\r\n  xsi:schemaLocation=\"http://www.imsglobal.org/xsd/imsqtiasi_v3p0 https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0_v1p0.xsd\" \r\n  identifier=\"i19b-shared-css-vocab-2\" title=\"i19b Shared CSS Vocabulary 2\" \r\n  time-dependent=\"false\" adaptive=\"false\"><qti-item-body><div><![CDATA[<style>\r\n      /* Utility CSS to demonstrate column virtual borders - no effect on layout. */\r\n      [class*=\"qti-layout-col\"] {background-color:#eee;}</style>]]><h4>qti-layout-row, qti-layout-col</h4><hr /><br /><div class=\"qti-layout-row\">\r\n        <div class=\"qti-layout-col1\">\r\n          The quick brown fox jumps over the lazy dog.\r\n        </div>\r\n        <div class=\"qti-layout-col1\">\r\n          The quick brown fox jumps over the lazy dog.\r\n        </div><div class=\"qti-layout-col1\">The quick brown fox jumps over the lazy dog.\r\n        </div><div class=\"qti-layout-col1\">\r\n          The quick brown fox jumps over the lazy dog.\r\n        </div>\r\n        <div class=\"qti-layout-col1\">\r\n          The quick brown fox jumps over the lazy dog.\r\n        </div>\r\n        <div class=\"qti-layout-col1\">\r\n          The quick brown fox jumps over the lazy dog.\r\n        </div>\r\n        <div class=\"qti-layout-col1\">\r\n          The quick brown fox jumps over the lazy dog.</div><div class=\"qti-layout-col1\">The quick brown fox jumps over the lazy dog.\r\n        </div>\r\n        <div class=\"qti-layout-col1\"> The quick brown fox jumps over the lazy dog.\r\n        </div>\r\n        <div class=\"qti-layout-col1\">The quick brown fox jumps over the lazy dog.</div><div class=\"qti-layout-col1\">\r\n          The quick brown fox jumps over the lazy dog.\r\n        </div><div class=\"qti-layout-col1\">\r\n          The quick brown fox jumps over the lazy dog.\r\n        </div>\r\n      </div><hr /><div class=\"qti-layout-row\"><div class=\"qti-layout-col2\">The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.\r\n        </div>\r\n        <div class=\"qti-layout-col2\">\r\n          The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.\r\n        </div>\r\n        <div class=\"qti-layout-col2\">The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.\r\n        </div>\r\n        <div class=\"qti-layout-col2\">The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.\r\n        </div>\r\n        <div class=\"qti-layout-col2\">\r\n          The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.\r\n        </div>\r\n        <div class=\"qti-layout-col2\">\r\n          The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.\r\n        </div>\r\n      </div>\r\n\r\n      <hr />\r\n\r\n      <div class=\"qti-layout-row\">\r\n        <div class=\"qti-layout-col3\">\r\n          The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.\r\n        </div>\r\n        <div class=\"qti-layout-col3\">\r\n          The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.\r\n        </div>\r\n        <div class=\"qti-layout-col3\">\r\n          The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.\r\n        </div>\r\n        <div class=\"qti-layout-col3\">\r\n          The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.\r\n        </div>\r\n      </div>\r\n\r\n      <hr />\r\n\r\n      <div class=\"qti-layout-row\">\r\n        <div class=\"qti-layout-col4\">\r\n          The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.\r\n        </div>\r\n        <div class=\"qti-layout-col4\">\r\n          The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.\r\n        </div>\r\n        <div class=\"qti-layout-col4\">\r\n          The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.\r\n        </div>\r\n      </div>\r\n\r\n      <hr />\r\n\r\n      <div class=\"qti-layout-row\">\r\n        <div class=\"qti-layout-col5\">\r\n          The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.\r\n        </div>\r\n        <div class=\"qti-layout-col7\">The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.\r\n        </div>\r\n      </div>\r\n\r\n      <hr />\r\n\r\n      <div class=\"qti-layout-row\">\r\n        <div class=\"qti-layout-col6\">\r\n          The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.\r\n        </div>\r\n        <div class=\"qti-layout-col6\">\r\n          The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.\r\n        </div>\r\n      </div>\r\n\r\n      <hr />\r\n\r\n      <div class=\"qti-layout-row\">\r\n        <div class=\"qti-layout-col12\">\r\n          The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.</div>\r\n      </div>\r\n\r\n      <hr /><h4>qti-layout-row, qti-layout-col, qti-layout-offset</h4><hr /><div class=\"qti-layout-row\">\r\n        <div class=\"qti-layout-col6 qti-layout-offset3\">The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.</div></div><hr /><div class=\"qti-layout-row\"><div class=\"qti-layout-col4 qti-layout-offset2\">The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.</div><div class=\"qti-layout-col4\">The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.</div></div><hr /><div class=\"qti-layout-row\"><div class=\"qti-layout-col2 qti-layout-offset1\">The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.</div><div class=\"qti-layout-col4 qti-layout-offset1\">The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.</div><div class=\"qti-layout-col2 qti-layout-offset1\">The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.</div></div><hr /></div></qti-item-body></qti-assessment-item>"
        },
        {
          "identifier": "q2-choice-interaction-multiple-sv-4d",
          "guid": "0000-0003-0004",
          "xml": "<qti-assessment-item xmlns=\"http://www.imsglobal.org/xsd/imsqtiasi_v3p0\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:schemaLocation=\"http://www.imsglobal.org/xsd/imsqtiasi_v3p0 https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0_v1p0.xsd\" identifier=\"q2-choice-interaction-multiple-sv-4d\" title=\"Choice Interaction - Multiple (SV 4d) - max/min Choices Messages\" adaptive=\"false\" time-dependent=\"false\"><qti-response-declaration identifier=\"RESPONSE1\" cardinality=\"multiple\" base-type=\"identifier\"/><qti-response-declaration identifier=\"RESPONSE2\" cardinality=\"multiple\" base-type=\"identifier\"/><qti-response-declaration identifier=\"RESPONSE3\" cardinality=\"multiple\" base-type=\"identifier\"/><qti-outcome-declaration identifier=\"SCORE\" cardinality=\"single\" base-type=\"float\"/><qti-item-body><p>Which of the following elements are used to form water?</p><!-- Stacking specified here only to compress the presentation of the 6 choices --><qti-choice-interaction class=\"qti-choices-stacking-3\" data-max-selections-message=\"You've selected too many!\" response-identifier=\"RESPONSE1\" max-choices=\"2\"><qti-prompt>Demonstrates max-choices=\"2\" and <em>custom data-max-selections-message</em>.</qti-prompt><qti-simple-choice identifier=\"H\">Hydrogen</qti-simple-choice><qti-simple-choice identifier=\"He\">Helium</qti-simple-choice><qti-simple-choice identifier=\"C\">Carbon</qti-simple-choice><qti-simple-choice identifier=\"O\">Oxygen</qti-simple-choice><qti-simple-choice identifier=\"N\">Nitrogen</qti-simple-choice><qti-simple-choice identifier=\"Cl\">Chlorine</qti-simple-choice></qti-choice-interaction><!-- Stacking specified here only to compress the presentation of the 6 choices --><qti-choice-interaction class=\"qti-choices-stacking-3\" response-identifier=\"RESPONSE2\" max-choices=\"2\"><qti-prompt>Demonstrates max-choices=\"2\" and <em>default/system Max Selections Message.</em></qti-prompt><qti-simple-choice identifier=\"H\">Hydrogen</qti-simple-choice><qti-simple-choice identifier=\"He\">Helium</qti-simple-choice><qti-simple-choice identifier=\"C\">Carbon</qti-simple-choice><qti-simple-choice identifier=\"O\">Oxygen</qti-simple-choice><qti-simple-choice identifier=\"N\">Nitrogen</qti-simple-choice><qti-simple-choice identifier=\"Cl\">Chlorine</qti-simple-choice></qti-choice-interaction><!-- Stacking specified here only to compress the presentation of the 6 choices --><qti-choice-interaction class=\"qti-choices-stacking-3\" data-min-selections-message=\"Not enough selected! Please select at least two.\" response-identifier=\"RESPONSE3\" max-choices=\"0\" min-choices=\"2\"><qti-prompt>Demonstrates min-choices=\"2\" and <em>custom data-min-selections-message.</em></qti-prompt><qti-simple-choice identifier=\"H\">Hydrogen</qti-simple-choice><qti-simple-choice identifier=\"He\">Helium</qti-simple-choice><qti-simple-choice identifier=\"C\">Carbon</qti-simple-choice><qti-simple-choice identifier=\"O\">Oxygen</qti-simple-choice><qti-simple-choice identifier=\"N\">Nitrogen</qti-simple-choice><qti-simple-choice identifier=\"Cl\">Chlorine</qti-simple-choice></qti-choice-interaction></qti-item-body></qti-assessment-item>"
        },
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
      maxItems: 5,
      containerClass: 'qti3-player-container-fluid',
      colorClass: 'qti3-player-color-default',
      itemStates: new Map(),
      sessionControl: null,
      pnp: null,
      qti3Player: null,
      performResponseProcessing: false
    }
  },

  methods: {

    initialize () {
      // Score when navigating
      this.performResponseProcessing = true
      // Load pnp
      this.pnp = new PnpFactory()
      // Load sessionControl
      this.sessionControl = new SessionControlFactory()
      this.sessionControl.setValidateResponses(true)
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

      this.initiateNavigateNextItem()
    },

    handlePrevItem () {
      console.log('[Controller][PrevItem][' + this.currentItem + ']')
      if (this.currentItem === 0) return

      this.initiateNavigatePrevItem()
    },

    initiateNavigateNextItem () {
      if (this.performResponseProcessing)
        this.qti3Player.endAttempt('navigateNextItem')
      else
        this.qti3Player.getItemState('navigateNextItem')
    },

    navigateNextItem () {
      console.log('[NavigateNextItem]')

      this.currentItem += 1
      this.loadItemAtIndex(this.currentItem)
    },

    initiateNavigatePrevItem () {
      if (this.performResponseProcessing)
        this.qti3Player.endAttempt('navigatePrevItem')
      else
        this.qti3Player.getItemState('navigatePrevItem')
    },

    navigatePrevItem () {
      console.log('[NavigatePrevItem]')

      this.currentItem -= 1
      this.loadItemAtIndex(this.currentItem)
    },

    handleEndAttemptCompleted (data) {
      console.log('[EndAttemptCompleted]', data)
    },

    handleGetStateCompleted (data) {
      // Save our state
      this.setTestStateItemState(data.state)

      if (data.state.validationMessages.length > 0) {
        // Display validation messages
        this.displayInvalidResponseMessages(data.state.validationMessages)
        // Do not proceed if we have any validationMessages
        return
      }

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
      configuration.pnp = this.pnp.getPnp()
      configuration.sessionControl = this.sessionControl.getSessionControl()

      return configuration
    },

    displayItemAlertEvent (event) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: event.icon,
        html: event.message,
        showConfirmButton: false,
        showCloseButton: true,
        timer: 3000,
        timerProgressBar: true
      })
    },

    displayInvalidResponseMessages (messages) {
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
    },

    /**
     * @description Event handler for the QTI3Player component's 'notifyQti3PlayerReady'
     * event.  This event is fired upon mounting of the Qti3Player component.
     *
     * The Qti3Player is now ready for XML loading.
     * @param {Component} qti3Player - the Qti3Player component itself
     */
    handlePlayerReady (qti3Player) {
      this.qti3Player = qti3Player
    },

    /**
     * @description Event handler for the QTI3Player component's 'notifyQti3ItemReady'
     * event.  This event is fired upon completion of the qti-assessment-item
     * component's loading of XML.
     */
    handleItemReady () {
      // NOOP
    }

  },

  mounted () {
    this.initialize()
  }
}
</script>

<style>
</style>
