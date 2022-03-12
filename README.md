# amp-up.io QTI 3 Player Component

[![MIT License][license-shield]][license-url]

The amp-up.io QTI 3 Player Component ("QTI 3 Player") is a 100% JavaScript component that aims to encapsulate the best practices and behaviors of the IMS Global QTI 3 Assessment Item specification which can be found here:

[IMS Global QTI v3 Best Practices and Implementation Guide](https://www.imsglobal.org/spec/qti/v3p0/impl)

A conforming QTI 3 authoring or exporting system can construct a QTI 3 Item XML solution that will "play" authentically and reliably in the QTI 3 Player component - according to the Best Practices Implementation Guide.

For a complete list of the QTI3 XML elements supported by the QTI 3 Player component, please refer to the [QTI 3 Player Item Reference](https://docs.google.com/document/d/1KCImUAk-2uBqSOHRO1lJa1orrzF4b8cl/#heading=h.gjdgxs).

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


[license-shield]: https://img.shields.io/github/license/othneildrew/Best-README-Template.svg?style=for-the-badge
[license-url]: https://github.com/othneildrew/Best-README-Template/blob/master/LICENSE.txt
