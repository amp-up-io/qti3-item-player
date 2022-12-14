# amp-up.io QTI 3 Player Component

<div id="top"></div>

[![MIT License][license-shield]][license-url]

The amp-up.io QTI 3 Player Component ("QTI 3 Player") is a 100% JavaScript component that aims to encapsulate the best practices and behaviors of the IMS Global QTI 3 Assessment Item specification.  A conforming QTI 3 authoring or exporting system can construct a QTI 3 Item XML solution that will "play" authentically and reliably in the QTI 3 Player - according to the Best Practices Implementation Guide which can be found here:

[IMS Global QTI v3 Best Practices and Implementation Guide](https://www.imsglobal.org/spec/qti/v3p0/impl)

For a complete list of the QTI3 XML elements supported by the QTI 3 Player component, please refer to the [QTI 3 Player Item Reference](https://docs.google.com/document/d/1KCImUAk-2uBqSOHRO1lJa1orrzF4b8cl/#heading=h.gjdgxs).

<p align="right">(<a href="#top">back to top</a>)</p>


## About The Project

The QTI 3 Player has API's, interfaces, and capabilities which are optimized for formative or classroom assessment settings.  Such settings typically require sophisticated QTI features such as adaptive items, item templating (sometimes called item "cloning"), template processing, and full response processing; i.e., scoring.  The QTI 3 Player implements the full expressive QTI 3 Item XML vocabulary according to best practices.  Consequently, you don't have to know anything about QTI.  Just install the component in your project, inject XML, and go!  In the following demo, a "TestRunner" application embeds the QTI 3 Player component for Item Rendering.

<a href="https://qti.amp-up.io/testrunner/" target="_blank">View TestRunner Demo</a>

<div align="center">
  <p><b>Thumbnails of Items/Rendering</b></p>

<img src="https://user-images.githubusercontent.com/898605/158195206-4f82d851-f3f0-47f6-9756-fbee098c7dcf.png" width="320" height="270">
<img src="https://user-images.githubusercontent.com/898605/158033033-dbb00c44-6d95-4ec0-9591-9d3459fcc1b8.png" width="320" height="270">
<img src="https://user-images.githubusercontent.com/898605/158033144-d19063f0-43c4-48e4-a2d1-6e4de6439fc9.png" width="320" height="270">
<img src="https://user-images.githubusercontent.com/898605/158032910-d739e359-c248-4bad-be30-935bb23aa6ff.png" width="320" height="270">
</div>

<p align="right">(<a href="#top">back to top</a>)</p>



## Getting Started

### 1. Clone the repo
```sh
git clone https://github.com/amp-up-io/qti3-item-player.git
```

### 2. Installation
```sh
npm install
```

### 3. Compiles and hot-reloads for development
```sh
npm run serve
```

### 4. Compiles, minifies, creates package
```sh
npm run build:npm
```

<p align="right">(<a href="#top">back to top</a>)</p>



## Usage

The [Demo TestRunner](https://github.com/amp-up-io/qti3-item-player-controller) is a good way to get familiar with QTI 3 Player usage.  Specifically, please see the [TestRunner.vue](https://github.com/amp-up-io/qti3-item-player-controller/blob/main/src/views/TestRunner.vue) sub-component.


### 1. Import QTI 3 Player and QTI 3 Player CSS

```js
// The Qti3Player component and built-in CSS
import Qti3Player from 'qti3-item-player'
import 'qti3-item-player/dist/qti3Player.css'
```
<p align="right">(<a href="#top">back to top</a>)</p>


### 2. Load the QTI 3 Player component in your Page or Template

```html
<Qti3Player
  ref="qti3player"
  :container-class="containerClass"
  :container-padding-class="containerPaddingClass"
  :color-class="colorClass"
  suppress-alert-messages
  suppress-invalid-response-messages
  @notifyQti3PlayerReady="handlePlayerReady"
  @notifyQti3ItemReady="handleItemReady"
  @notifyQti3SuspendAttemptCompleted="handleSuspendAttemptCompleted"
  @notifyQti3EndAttemptCompleted="handleEndAttemptCompleted"
  @notifyQti3ItemAlertEvent="displayItemAlertEvent"
  @notifyQti3ItemCatalogEvent="handleItemCatalogEvent"
/>
```
<p align="right">(<a href="#top">back to top</a>)</p>


### 3. Listen for the QTI 3 Player 'notifyQti3PlayerReady' event

This event signifies that the QTI 3 Player component is loaded and ready for action.  The following snippet is a sample handler for the `notifyQti3PlayerReady` event.  QTI 3 Player hands itself as an argument to the `notifyQti3PlayerReady` event, thus simplifying further QTI 3 Player API calls.

```js
/**
 * @description Event handler for the QTI 3 Player component's 'notifyQti3PlayerReady'
 * event.  This event is fired upon mounting of QTI 3 Player.
 *
 * The Qti3Player is now ready for loading XML.
 * @param {Component} qti3Player - the QTI 3 Player component itself
 */
handlePlayerReady (qti3Player) {
  this.qti3Player = qti3Player
}
```
<p align="right">(<a href="#top">back to top</a>)</p>


### 4. Load a QTI 3 Item into QTI 3 Player

Once QTI 3 Player is loaded and ready (see #3 above), QTI 3 Item XML can be loaded directly into QTI 3 Player via the Player's `loadItemFromXML` method which takes two arguments `xml {String}` and `configuration {Object}`.  

```js
// Load item XML with a configuration.  Use the 'this.qti3Player' reference
// saved in the notifyQti3PlayerReady event handler.
this.qti3Player.loadItemFromXml(xml, configuration)
```

#### 4a) About a Configuration

The `configuration` object is used to specify runtime context to QTI 3 Player during the item session loaded in `loadItemFromXml`.  A configuration object has the following structure:

```js
configuration: {
  guid: <{String} identifier used to track item state>,
  pnp: <{Object} used to define Personal Needs and Preferences>,
  sessionControl: <{Object} used to define Item Session Control>,
  state: <{Object} used to RESTORE prior state saved from a prior Item Session>
}
```

#### 4b) Constructing a Configuration

The following snippet is an example of how an application can construct a `configuration`.

```js
// Intialize
const configuration = {}

// Stamp an item's tracking guid (if any) onto the configuration
configuration.guid = myItemTrackingGuid

// QTI 3 Player includes a helper class called 'PnpFactory' which can be used
// to build a Personal Needs and Preferences definition.
// The Default pnp object in the PnpFactory is:
const pnp = {
  textAppearance: {
    colorStyle: 'qti3-player-color-default'
  },
  // Glossary is universal support turned on (true) by default
  glossaryOnScreen: true,
  // Keyword translation is off ('') by default
  keywordTranslationLanguage: '',
  // Custom SBAC Illustrated Glossary is off (false) by default
  extSbacGlossaryIllustration: false,
  layoutSingleColumn: false // unsupported - see Roadmap (Simplified Layout)
}

// Set the configuration's 'pnp' property
configuration.pnp = pnp

// QTI 3 Player includes a helper class called 'SessionControlFactory' which can be
// used to build an Item Session Control definition.
// The Default sessionControl object in the SessionControlFactory is:
const defaultItemSessionControl = {
  max_attempts: 0, // no limit
  show_feedback: false,
  validate_responses: false
}

// Set the configuration's 'sessionControl' property
configuration.sessionControl = defaultItemSessionControl

// OPTIONAL
// If a 'state' property is in a configuration then QTI 3 Player will
// use this to restore a prior item state - including all
// template, context, outcome, and response variables.
const state = testController.getTestStateItemState(myItemTrackingGuid)
if (typeof state !== 'undefined') configuration.state = state
 ```

In the absence of a `pnp` property, QTI 3 Player will use defaults, or previous settings, for presentation and accessibility supports.  In the absence of a `sessionControl` property, QTI 3 Player will use defaults, or previous settings, for the Item Session Control definition.

<p align="right">(<a href="#top">back to top</a>)</p>


### 5. Listen for the QTI 3 Player 'notifyQti3ItemReady' Event

QTI 3 Player triggers a `notifyQti3ItemReady` event upon completion of the Player's `loadItemFromXML` method.  The following snippet is a sample handler for the `notifyQti3ItemReady` event.

```js
/**
 * @description Event handler for the QTI3Player component's 'notifyQti3ItemReady'
 * event.  This event is fired upon completion of the qti-assessment-item
 * component's loading of XML.
 */
handleItemReady () {
  console.log('QTI 3 Item XML is loaded and rendered!  The latest "attempt" has officially begun.')
}
```
<p align="right">(<a href="#top">back to top</a>)</p>


### 6. Retrieving Item State

After item XML is loaded and an attempt has begun, a test controller may retrieve the item's current state via two methods:

* **endAttempt**

  This performs response validation (if validateResponses=true), ends the attempt, _executes response processing_, and produces the state of all item variables.  Typical use is when `submissionMode: "individual"`, or when you want to generate a raw score from the responses and the response processing.  Note that Feedback (inline, block, modal) is also displayed if `showFeedback: true`

* **suspendAttempt**

    This performs response validation (if `validateResponses: true`) and produces the state of all item variables.  _No response processing is executed._  Typical use is when `submissionMode: "simultaneous"`.

The `endAttempt` and `suspendAttempt` methods may take a considerable amount of time to complete.  QTI 3 Player triggers the `notifyQti3EndAttemptCompleted` and `notifyQti3SuspendAttemptCompleted` events, respectively, upon completion of an `endAttempt` or a `suspendAttempt` method call.

#### 6a) Calling endAttempt and handling the notifyQti3EndAttemptCompleted event

```js
// Call the endAttempt method, passing a string/target action that will be
// echoed back in the notifyQti3EndAttemptCompleted event payload.
this.qti3Player.endAttempt('navigateNextItem')
```

```js
/**
 * @description Example event handler for the QTI3Player component's 'notifyQti3EndAttemptCompleted'
 * event.  This event is fired upon completion of the endAttempt method.
 * @param {Object} data - the item's state, including outcomes from response processing
 */
handleEndAttemptCompleted (data) {
  // 'data' contains the item state, including any validation messages,
  // response variable values, outcome variable values, template variable values,
  // and context variable values.
  // ... do something ...
}
```

#### 6b) Calling suspendAttempt and handling the notifyQti3SuspendAttemptCompleted event

```js
// Call the suspendAttempt method, passing a string/target action that will be
// echoed back in the notifyQti3SuspendAttemptCompleted event payload.
this.qti3Player.suspendAttempt('navigateNextItem')
```

```js
/**
 * @description Example event handler for the QTI3Player component's 'notifyQti3SuspendAttemptCompleted'
 * event.  This event is fired upon completion of the suspendAttempt method.
 * @param {Object} data - the item's state
 */
handleSuspendAttemptCompleted (data) {
  // 'data' contains the item state, including any validation messages,
  // response variable values, outcome variable values, template variable values,
  // and context variable values.
  // ... do something ...
}
```
<p align="right">(<a href="#top">back to top</a>)</p>


### 7. About Item State

#### Item State Object Structure

The `endAttempt` and `suspendAttempt` methods produce a `state` object with the following properties/structure:

```js
"state": {
  "identifier": "<qti-assessment-item identifier>",
  "guid": "<tracking guid passed in the configuration>",
  "contextVariables": [ <built-in and declared context variables> ],
  "responseVariables": [ <built-in and declared response variables> ],
  "outcomeVariables": [ <built-in and declared outcome variables> ],
  "templateVariables": [ <declared template variables> ],
  "validationMessages": [ <validation messages (if validateResponses: true, and response constraints not met)> ]
}
```

#### Full Item State Example Payload

In this item, there are two qti-choice-interaction's, each with single cardinality.  This item is not adaptive; i.e., `adaptive="false"`, and the item's XML contains no response processing that changes the original value of `completionStatus`.

```js
{
  "state": {
    "identifier": "q2-choice-interaction-single-sv-4a",
    "guid": "0000-0002-0001",
    "contextVariables": [
      {
        "identifier": "QTI_CONTEXT",
        "cardinality": "record",
        "value": {}
      }
    ],
    "responseVariables": [
      {
        "identifier": "numAttempts",
        "cardinality": "single",
        "value": 1,
        "state": null
      },
      {
        "identifier": "duration",
        "cardinality": "single",
        "value": 0,
        "state": null
      },
      {
        "identifier": "RESPONSE1",
        "cardinality": "single",
        "value": "ChoiceA",
        "state": {
          "order": [
            "ChoiceA",
            "ChoiceB",
            "ChoiceC"
          ]
        },
        "correctResponse": null
      },
      {
        "identifier": "RESPONSE2",
        "cardinality": "single",
        "value": "ChoiceB",
        "state": {
          "order": [
            "ChoiceA",
            "ChoiceB",
            "ChoiceC"
          ]
        },
        "correctResponse": null
      }
    ],
    "outcomeVariables": [
      {
        "identifier": "SCORE",
        "cardinality": "single",
        "value": 0
      },
      {
        "identifier": "completionStatus",
        "cardinality": "single",
        "value": "not_attempted"
      }
    ],
    "templateVariables": [],
    "validationMessages": []
  },
  "target": "navigateNextItem"
}
```
<p align="right">(<a href="#top">back to top</a>)</p>


### 8. Item Session 'Alert' Messages and the notifyQti3ItemAlertEvent

An item session 'alert' message is triggered by QTI 3 Player when a person exceeds an interaction's max-choices or max-associations threshold.  QTI 3 Player uses a built-in messaging/toast component to display such alerts to the candidate.  

An encapsulating application may instrument the QTI 3 Player to _not display alert messages_ by specifying the boolean attribute `suppress-alert-messages`.  Example:

```html
<Qti3Player
  ref="qti3player"
  suppress-alert-messages
  @notifyQti3ItemAlertEvent="displayItemAlertEvent"
/>
```

An encapsulating application should implement a handler for the `notifyQti3ItemAlertEvent` when instrumenting QTI 3 Player to suppress its internal alert message display.  Example:

```js
/**
 * @description Handler for QTI item alert messages such as max selections messages.
 * @param {Object} event - object containing an icon property and a message property
 */
displayItemAlertEvent (event) {
  // This example uses the sweetalert component to display messages as toasts
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
}
```
<p align="right">(<a href="#top">back to top</a>)</p>


### 9. Item Session 'Invalid Response' Messages

An item session 'invalid response' message is triggered by QTI 3 Player when,  

* `SessionControl.validateResponses=true`, and
* A response validity requirement is not met on an interaction in the loaded item  

As with item session 'alert' messages, QTI 3 Player uses a built-in messaging/toast component to display such 'invalid response' messages to the candidate.  

An encapsulating application may instrument the QTI 3 Player to _not display invalid response messages_ by specifying the boolean attribute `suppress-invalid-response-messages`.  Example:

```html
<Qti3Player
  ref="qti3player"
  suppress-invalid-response-messages
/>
```

All violations of response validity are reported in the `validationMessages` property of the state object returned to the notifyQti3EndAttemptCompleted and notifyQti3SuspendAttemptCompleted event handlers.

```js
"state": {
  "identifier": "<qti-assessment-item identifier>",
  "guid": "<tracking guid passed in the configuration>",
  "contextVariables": [ <built-in and declared context variables> ],
  "responseVariables": [ <built-in and declared response variables> ],
  "outcomeVariables": [ <built-in and declared outcome variables> ],
  "templateVariables": [ <declared template variables> ],
  "validationMessages": [
    {
      "identifier": "RESPONSE3",
      "message": "Not enough selected! Please select at least two."
    }
  ]
}
```

This permits an encapsulating application to handle and display validation messages using its own UX.

<p align="right">(<a href="#top">back to top</a>)</p>


### 10. Item 'Catalog' Events

An item 'catalog' event is triggered by QTI 3 Player when a user selects a control (such as a highlighted term) within the item's presentation that is bound to an item's catalog.  As of QTI 3 Player version 0.3.1, the only supported catalog event () is a 'glossary' event.  QTI 3 Player will display its own Catalog Glossary Dialog component when a user selects a control within the item's presentation that is bound to a 'glossary' event.


<div align="center">
  <p><b>Example of QTI 3 Player Glossary Dialog</b></p>
<img src="https://user-images.githubusercontent.com/898605/161848852-6cec8b3d-f843-403c-a651-99b284946f65.png" width="260" height="240">
</div>


An encapsulating application may instrument the QTI 3 Player to _not display its internal Catalog Dialog component_ by specifying the boolean attribute `suppress-catalog-messages`.  When instrumenting QTI 3 Player to suppress its internal catalog message display, an application should implement a handler for the `notifyQti3ItemCatalogEvent`.  This permits an application to handle and display catalog event messages using its own UX.  Example:

```html
<Qti3Player
  ref="qti3player"
  suppress-catalog-messages
  @notifyQti3ItemCatalogEvent="handleItemCatalogEvent"
/>
```

```js
    /**
     * @description Handler for QTI item catalog events such as 'glossary' events.
     * @param {Object} event - object containing a catalog event payload
     * Sample event schema:
     * {
     *   type: "glossary",
     *   term: "acronym",
     *   catalogIdRef: "glosscat",
     *   data: [
     *     {
     *       support: "glossary-on-screen",
     *       card: {
     *         content: ""<p>An abbreviation.</p>"",
     *         properties: {
     *           name: "qti-html-content"
     *         }
     *       }
     *     }
     *     ... additional Card supports in Catalog based on PNP ...
     *   ]
     * }
     */
    handleItemCatalogEvent (event) {
      console.log('[ItemCatalogEvent][Type: ' + event.type + ']', event)
      switch (event.type) {
        case 'glossary':
          // Do something!
          break
        default:
      }
    },
```

#### Supported Keyword Translation Language Codes ####

QTI 3 Player groups PNP 'glossary-on-screen', 'keyword-translation', and 'ext:sbac-glossary-illustration' supports into 'glossary' events that will trigger a Catalog event of type 'glossary'.

As of the 0.3.4 release, QTI 3 Player supports the following IS0 639 language codes for keyword translations:

`{ ar | cmn | de | en | es | fr | hmn | it | ja | ko | my | nl | pa | ru | so | tl | uk | vi | yue | zh }`

<p align="right">(<a href="#top">back to top</a>)</p>


### 11. About Dynamic Catalog Rebinding

Under most use-cases, a PNP is passed into QTI 3 Player as part of the configuration (see 4b Constructing a Configuration) as an item's XML is loaded.  However, _after an item is loaded_, an encapsulating application may update PNP settings and then force a catalog rebinding with the updated PNP settings.  QTI 3 Player implements a `bindCatalog` API method for this use-case.

```js
// 1) Use the PnpFactory helper class to build an updated PNP.
let pnpFactory = new PnpFactory()
// Example: turn off glossary
pnpFactory.setGlossaryOnScreen(false)
// Example: turn on Spanish keyword translations
pnpFactory.setKeywordTranslationLanguage('es')
// Example: turn on ext:sbac-glossary-illustration
pnpFactory.setExtSbacGlossaryIllustration(true)

// 2) Set QTI 3 Player's current PNP to our new PNP constructed in 1) above.
this.qti3Player.setItemContextPnp(pnpFactory.getPnp())

// 3) Even with a new Item Context PNP (step 2) above, QTI 3 Player will not
// automatically rebind the PNP + Catalog.  
// Force QTI3 Player to bind (rebind) the Catalog.
this.qti3Player.bindCatalog()
```

<p align="right">(<a href="#top">back to top</a>)</p>



## QTI 3 Player Presentation Attributes

QTI 3 Player has several attributes to instrument presentation within an encapsulating application/web page. These attributes are `container-class`, `container-padding-class`, and `color-class`

### container-class

Container classes are used to contain and pad content within them. QTI 3 Player comes with built-in support for two container classes: `qti3-player-container-fluid` and `qti3-player-container`.

* qti3-player-container-fluid **DEFAULT**

  This container is a width=100%, padding=0 container at all widths.

* qti3-player-container

  This container has responsive breakpoints at screen widths of 1200px, 980px, and 768px.  

<a href="https://qti.amp-up.io/testrunner/test/1" target="testrunner">Experiment with the Container Class</a> Note: Click the "Settings" menu in the top-right corner of the TestRunner application.


### container-padding-class

Container padding classes are for setting the padding between the QTI 3 Player container and the qti-assessment-item rendered content.  QTI 3 Player comes with built-in support for six container padding classes.

* qti3-player-container-padding-0 { padding: 0; } **DEFAULT**
* qti3-player-container-padding-1 { padding: 0.25rem; }
* qti3-player-container-padding-2 { padding: 0.5rem; }
* qti3-player-container-padding-3 { padding: 1rem; }
* qti3-player-container-padding-4 { padding: 1.5rem; }
* qti3-player-container-padding-5 { padding: 3rem; }

<a href="https://qti.amp-up.io/testrunner/test/1" target="testrunner">Experiment with the Container Padding Class</a> Note: Click the "Settings" menu in the top-right corner of the TestRunner application.


### color-class

QTI 3 Player has built-in support for fourteen foreground / background color combinations (a.k.a. color "themes") in accordance with best practices for many forms of color blindness or other visual impairments.  In addition to setting a colorClass in a PNP, color settings may also be applied dynamically.

* qti3-player-color-default **DEFAULT**
* qti3-player-color-defaultreverse (Default - Reverse Polarity)
* qti3-player-color-blackwhite (High Contrast - foreground color: black, background color: white)
* qti3-player-color-whiteblack (High Contrast - foreground color: white, background color: black)
* qti3-player-color-blackrose (foreground color: black, background color: rose)
* qti3-player-color-roseblack (foreground color: rose, background color: black)
* qti3-player-color-dgraymgray (foreground color: dark gray, background color: medium gray)
* qti3-player-color-mgraydgray (foreground color: medium gray, background color: dark gray)
* qti3-player-color-yellowblue (foreground color: yellow, background color: blue)
* qti3-player-color-blueyellow (foreground color: blue, background color: yellow)
* qti3-player-color-blackcyan (foreground color: black, background color: lblue)
* qti3-player-color-cyanblack (foreground color: lblue, background color: black)
* qti3-player-color-blackcream (foreground color: black, background color: lemonchiffon)
* qti3-player-color-creamblack (foreground color: lemonchiffon, background color: black)

<a href="https://qti.amp-up.io/testrunner/test/1" target="testrunner">Experiment with the Color Class</a> Note: Click the "Settings" menu in the top-right corner of the TestRunner application.


<p align="right">(<a href="#top">back to top</a>)</p>



## Roadmap

The QTI3 Item Player 2022 development roadmap includes all features and capabilities included in QTI 3 Delivery System Level 1 and Level 2 conformance.

- [x] Support for the 14 Standard Color Combinations/Themes
- [x] Support for Template Processing and all Template Rules
- [x] Support for Template Math Variables
- [x] Support for Response Processing and all Response Processing Rules
- [x] Support for Smarter Balanced-style Choice Interaction
- [x] Support for Smarter Balanced-style Audio player
- [x] Support for Adaptive Items and QtiEndAttemptInteraction
- [x] Catalog Support for Glossary and Keyword Translation
- [x] Catalog Support for Smarter Balanced Illustrated Glossary
- [x] Rubric Block Support
- [x] QtiStylesheet Support
- [ ] Shared Stimulus Support
- [ ] QtiMatch, QtiGapMatch, QtiGraphicGapMatch Interaction Support
- [ ] QtiHottext Interaction Support
- [ ] QtiHotspot Interaction Support
- [x] QtiOrder Interaction Support
- [ ] Scoring API Examples
- [ ] Improved Audio Player
- [ ] Improved Video Player

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- LICENSE -->
## License

Distributed under the MIT License. See `LICENSE` for more information.

<p align="right">(<a href="#top">back to top</a>)</p>



## Built With

The QTI3 Item Player is built with the Vue.js (v2) framework.

* [Vue.js](https://vuejs.org/)

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- CONTACT -->
## Contact

Paul Grudnitski - paul.grudnitski@amp-up.io

Project Link: [https://github.com/amp-up-io/qti3-item-player](https://github.com/amp-up-io/qti3-item-player)

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- ACKNOWLEDGMENTS -->
## Acknowledgments

This component would not be possible were it not for a fortuitous decision by the aQTI Task Force (the original name of the QTI 3 Working Group) - meeting at CITO headquarters in Arnhem, NE, January 2015 - to make the aQTI / QTI 3 specification "web component friendly".  

<p align="right">(<a href="#top">back to top</a>)</p>


[license-shield]: https://img.shields.io/github/license/amp-up-io/qti3-item-player?label=License&style=for-the-badge
[license-url]: https://github.com/amp-up-io/qti3-item-player/blob/main/LICENSE
