export class XmlFilters {

  #rxTrackSource = null

  /**
   * @description Helper Class for transforming the QTI XML
   */
  constructor() {
    // Regex matching closed 'track' and 'source' elements
    this.#rxTrackSource = new RegExp(/<(track|source)[^>]+?\/>/g)
  }

  /**
   * @description Remove CDATA from the XML.
   */
  filterCdata (xml) {
    return xml.replaceAll('<![CDATA[', '').replaceAll(']]>', '')
  }

  /**
   * @description Transform the <style> element into something
   * that can be digested more easily by the qti-assessment-item component.
   */
  filterStyle (xml) {
    return xml.replaceAll('<style>','<amp-style>').replaceAll('</style>','</amp-style>')
  }

  /**
   * @description Transform an audio element to an amp-audio element which loads
   * the custom amp-up.io audio player instead of the the default html5 audio player.
   * @NOTE UPDATE: transform any closed <source> or <track> elements.
   */
  filterAudio (xml) {
    return this.filterTrackSource(xml)
    //return xml.replaceAll('<audio ','<amp-audio ').replaceAll('</audio>','</amp-audio>')
  }

  /**
   * @description Transform closed <source /> and <track /> elements into
   * required HTML5 **open** elements.  Without this, <video> and <audio> elements
   * do not work on Safari.
   */
  filterTrackSource (xml) {
    return xml.replace(this.#rxTrackSource, (match) => {
      return match.replace(/\/>/g, '>')
    })
  }
}
