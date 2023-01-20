/**
 * @description Class to encapsulate QTI shared presentation vocabulary
 * for a qti-hotspot-interaction.
 */
class HotspotPresentationFactory {

  constructor(classList) {
    this.constants = {
      // QTI 3 Shared Vocabulary constants

      // Defines the color theme of the hotspots/selections
      QTI_SELECTIONS_LIGHT: 'qti-selections-light',
      QTI_SELECTIONS_DARK: 'qti-selections-dark',
      QTI_UNSELECTED_HIDDEN: 'qti-unselected-hidden',

      // Theme light properties
      THEME_LIGHT: {
        selectedOpacity: '1.0',
        unselectedOpacity: '0.5',
        fillColor: 'orange',
        fillOpacity: '0',
        strokeColor: 'orange',
        strokeWidth: 2,
        selectedStrokeWidth: 4
      },

      // Theme dark properties
      THEME_DARK: {
        selectedOpacity: '1.0',
        unselectedOpacity: '0.5',
        fillColor: '#0088CC',
        fillOpacity: '0',
        strokeColor: 'blue',
        strokeWidth: 2,
        selectedStrokeWidth: 4
      },

      // Theme hidden light properties
      THEME_HIDDEN_LIGHT: {
        selectedOpacity: '1.0',
        unselectedOpacity: '0',
        fillColor: 'orange',
        fillOpacity: '0',
        strokeColor: 'orange',
        strokeWidth: 2,
        selectedStrokeWidth: 4
      },

      // Theme hidden dark properties
      THEME_HIDDEN_DARK: {
        selectedOpacity: '1.0',
        unselectedOpacity: '0',
        fillColor: 'blue',
        fillOpacity: '0',
        strokeColor: 'blue',
        strokeWidth: 2,
        selectedStrokeWidth: 4
      }
    }

    this.classList = classList

    // Default is dark / blue theme
    this.presentation_Theme = this.constants.QTI_SELECTIONS_DARK
    this.theme = this.constants.THEME_DARK
    this.presentation_UnselectedHidden = false

    // Sniff for shared CSS vocabulary
    this.processClassAttribute()
    return this
  }

  /**
   * @description The class attribute on the interaction may contain
   * QTI 3 shared vocabulary.
   */
  processClassAttribute () {
    if ((typeof this.classList === 'undefined') || (this.classList === null) || (this.classList.length == 0)) {
      return
    }

    const clazzTokens = this.classList.split(' ')
    for (let index = 0; index < clazzTokens.length; index++) {
      switch (clazzTokens[index]) {
        case this.constants.QTI_SELECTIONS_DARK:
          this.presentation_Theme = this.constants.QTI_SELECTIONS_DARK
          break
        case this.constants.QTI_SELECTIONS_LIGHT:
          this.presentation_Theme = this.constants.QTI_SELECTIONS_LIGHT
          break
        case this.constants.QTI_UNSELECTED_HIDDEN:
          this.presentation_UnselectedHidden = true
          break
        default:
      }
    }

    switch (this.presentation_Theme) {
      case this.constants.QTI_SELECTIONS_DARK:

        if (this.presentation_UnselectedHidden)
          this.theme = this.constants.THEME_HIDDEN_DARK

        break

      case this.constants.QTI_SELECTIONS_LIGHT:

        if (this.presentation_UnselectedHidden)
          this.theme = this.constants.THEME_HIDDEN_LIGHT
        else
          this.theme = this.constants.THEME_LIGHT

        break

      default:
    }
  }

  getThemeColors () {
    return this.theme
  }

}

export default HotspotPresentationFactory
