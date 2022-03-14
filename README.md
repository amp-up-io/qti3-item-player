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
<p>Thumbnails of Items/Rendering</p>

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

### 2. Load a QTI 3 Item into QTI 3 Player

QTI 3 Item XML can be loaded directly into QTI 3 Player via the Player's `loadItemFromXML` method which takes two arguments `xml {String}` and `configuration {Object}`.  

```js
// Load item XML with a configuration
this.qti3Player.loadItemFromXml(xml, configuration)
```

#### 2a) About a Configuration

The `configuration` object is used to specify runtime context to QTI 3 Player during the item session loaded in `loadItemFromXml`.  A configuration object has the following structure:

```js
configuration: {
  guid: <{String} identifier used to track item state>,
  pnp: <{Object} used to define Personal Needs and Preferences>,
  sessionControl: <{Object} used to defined Item Session Control>,
  state: <{Object} used to RESTORE prior state saved from a prior Item Session>
}
```

#### 2b) Constructing a Configuration

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
  glossaryOnScreen: true, // unsupported - see Roadmap
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


<!-- ROADMAP -->
## Roadmap

The QTI3 Item Player 2022 development roadmap includes all features and capabilities included in QTI 3 Delivery System Level 1 and Level 2 conformance. 

- [x] Support for the 10 Standard Color Combinations
- [x] Support for Template Processing and all Template Rules
- [x] Support for Template Math Variables
- [x] Support for Response Processing and all Response Processing Rules
- [x] Support for Smarter Balanced-style Choice Interaction
- [x] Support for Smarter Balanced-style Audio player
- [x] Support for Adaptive Items and QtiEndAttemptInteraction
- [ ] Catalog Support for Glossary and Keyword Translation
- [ ] Shared Stimulus Support
- [ ] Simplified Layout
- [ ] QtiMatch, QtiGapMatch, QtiGraphicGapMatch Interaction Support
- [ ] QtiHottext Interaction Support
- [ ] QtiHotspot Interaction Support
- [ ] QtiOrder Interaction Support
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
