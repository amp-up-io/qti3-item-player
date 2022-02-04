export class XmlFilters {
  /**
   * @description Helper Class for transforming the QTI XML
   */
  constructor() {
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
   */
  filterAudio (xml) {
    return xml.replaceAll('<audio ','<amp-audio ').replaceAll('</audio>','</amp-audio>')
  }

}
