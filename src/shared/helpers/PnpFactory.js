export class PnpFactory {

  constructor () {
    this.pnp = this.defaultPnp()
    return this
  }

  constants = {
    // Limited support for foreground/background combinations
    // Default
    COLOR_DEFAULT: 'qti3-player-color-default',
    // Default - reverse polarity
    COLOR_DEFAULT_REVERSE: 'qti3-player-color-defaultreverse',
    // High contrast
    COLOR_BLACK_WHITE: 'qti3-player-color-blackwhite',
    // High contrast - reverse polarity
    COLOR_WHITE_BLACK: 'qti3-player-color-whiteblack',
    // Black on Rose
    COLOR_BLACK_ROSE: 'qti3-player-color-blackrose',
    // Rose on Black
    COLOR_ROSE_BLACK: 'qti3-player-color-roseblack',
    // Yellow on Blue
    COLOR_YELLOW_BLUE: 'qti3-player-color-yellowblue',
    // Rose on Black
    COLOR_BLUE_YELLOW: 'qti3-player-color-blueyellow',
    // Medium Gray on Dark Gray
    COLOR_MGRAY_DGRAY: 'qti3-player-color-mgraydgray',
    // Dark Gray on Medium Gray
    COLOR_DGRAY_MGRAY: 'qti3-player-color-dgraymgray',
    // Glossary on
    GLOSSARY_ON: 'glossary-on',
    // Glossary off
    GLOSSARY_OFF: 'glossary-off',

    // Keyword Trans off
    KEYWORD_TRANS_OFF: 'ktlang-off',
    // Keyword Trans Arabic
    KEYWORD_TRANS_AR: 'ktlang-ar',
    // Keyword Trans Burmese
    KEYWORD_TRANS_MY: 'ktlang-my',
    // Keyword Trans Cantonese
    KEYWORD_TRANS_YUE: 'ktlang-yue',
    // Keyword Trans Tagalog
    KEYWORD_TRANS_TL: 'ktlang-tl',
    // Keyword Trans Hmong
    KEYWORD_TRANS_HMN: 'ktlang-hmn',
    // Keyword Trans Korean
    KEYWORD_TRANS_KO: 'ktlang-ko',
    // Keyword Trans Mandarin
    KEYWORD_TRANS_CMN: 'ktlang-cmn',
    // Keyword Trans Punjabi
    KEYWORD_TRANS_PA: 'ktlang-pa',
    // Keyword Trans Russian
    KEYWORD_TRANS_RU: 'ktlang-ru',
    // Keyword Trans Somali
    KEYWORD_TRANS_SO: 'ktlang-so',
    // Keyword Trans Spanish
    KEYWORD_TRANS_ES: 'ktlang-es',
    // Keyword Trans Ukranian
    KEYWORD_TRANS_UK: 'ktlang-uk',
    // Keyword Trans Vietnamese
    KEYWORD_TRANS_VI: 'ktlang-vi',

    // Illustrated Glossary on
    EXT_SBAC_GLOSSARY_ILLUSTRATION_ON: 'sbacGlossaryIllustration-on',
    // Illustrated Glossary off
    EXT_SBAC_GLOSSARY_ILLUSTRATION_OFF: 'sbacGlossaryIllustration-off'
  }

  defaultPnp () {
    let pnp = {
      textAppearance: {
        colorStyle: this.constants.COLOR_DEFAULT
      },
      glossaryOnScreen: true,
      // Set to ISO 639-1 code when not ''
      keywordTranslationLanguage: '',
      extSbacGlossaryIllustration: false,
      layoutSingleColumn: false // unsupported
    }
    return pnp
  }

  setPnp (pnp) {
    if (typeof pnp === 'undefined') return

    if (pnp === null) {
      this.pnp = this.defaultPnp()
    }

    if (('textAppearance' in pnp) && (pnp.textAppearance !== null)) {
      if ('colorStyle' in pnp.textAppearance) {
        this.setColorStyle(pnp.textAppearance.colorStyle)
      }
    }

    if (('glossaryOnScreen' in pnp) && (pnp.glossaryOnScreen !== null)) {
      this.setGlossaryOnScreen(pnp.glossaryOnScreen)
    }

    if ('keywordTranslationLanguage' in pnp) {
      this.setKeywordTranslationLanguage(pnp.keywordTranslationLanguage)
    }

    if (('extSbacGlossaryIllustration' in pnp) && (pnp.extSbacGlossaryIllustration !== null)) {
      this.setExtSbacGlossaryIllustration(pnp.extSbacGlossaryIllustration)
    }

    if (('layoutSingleColumn' in pnp) && (pnp.layoutSingleColumn !== null)) {
      this.setLayoutSingleColumn(pnp.layoutSingleColumn)
    }
  }

  getPnp () {
    return this.pnp
  }

  getColorStyle () {
    return this.pnp.textAppearance.colorStyle
  }

  setColorStyle (colorStyle) {
    this.pnp.textAppearance.colorStyle = colorStyle
  }

  getGlossaryOnScreen () {
    return this.pnp.glossaryOnScreen
  }

  setGlossaryOnScreen (glossaryOnScreen) {
    this.pnp.glossaryOnScreen = glossaryOnScreen
  }

  getKeywordTranslationLanguage () {
    return this.pnp.keywordTranslationLanguage
  }

  setKeywordTranslationLanguage (keywordTranslationLanguage) {
    this.pnp.keywordTranslationLanguage = keywordTranslationLanguage
  }

  getExtSbacGlossaryIllustration () {
    return this.pnp.extSbacGlossaryIllustration
  }

  setExtSbacGlossaryIllustration (extSbacGlossaryIllustration) {
    this.pnp.extSbacGlossaryIllustration = extSbacGlossaryIllustration
  }

  getLayoutSingleColumn () {
    return this.pnp.layoutSingleColumn
  }

  setLayoutSingleColumn (layoutSingleColumn) {
    this.pnp.layoutSingleColumn = layoutSingleColumn
  }

  evaluatePnpEvent (event) {
    let flag = false

    switch (event) {
      case this.constants.GLOSSARY_ON:
        if (this.getGlossaryOnScreen() === false) {
          this.setGlossaryOnScreen(true)
          flag = true
        }
        break
      case this.constants.GLOSSARY_OFF:
        if (this.getGlossaryOnScreen() === true) {
          this.setGlossaryOnScreen(false)
          flag = true
        }
        break
      case this.constants.KEYWORD_TRANS_OFF:
        if (this.getKeywordTranslationLanguage() !== '') {
          this.setKeywordTranslationLanguage('')
          flag = true
        }
        break
      case this.constants.KEYWORD_TRANS_AR:
        if (this.getKeywordTranslationLanguage() !== 'ar') {
          this.setKeywordTranslationLanguage('ar')
          flag = true
        }
        break
      case this.constants.KEYWORD_TRANS_MY:
        if (this.getKeywordTranslationLanguage() !== 'my') {
          this.setKeywordTranslationLanguage('my')
          flag = true
        }
        break
      case this.constants.KEYWORD_TRANS_YUE:
        if (this.getKeywordTranslationLanguage() !== 'yue') {
          this.setKeywordTranslationLanguage('yue')
          flag = true
        }
        break
      case this.constants.KEYWORD_TRANS_TL:
        if (this.getKeywordTranslationLanguage() !== 'tl') {
          this.setKeywordTranslationLanguage('tl')
          flag = true
        }
        break
      case this.constants.KEYWORD_TRANS_HMN:
        if (this.getKeywordTranslationLanguage() !== 'hmn') {
          this.setKeywordTranslationLanguage('hmn')
          flag = true
        }
        break
      case this.constants.KEYWORD_TRANS_KO:
        if (this.getKeywordTranslationLanguage() !== 'ko') {
          this.setKeywordTranslationLanguage('ko')
          flag = true
        }
        break
      case this.constants.KEYWORD_TRANS_CMN:
        if (this.getKeywordTranslationLanguage() !== 'cmn') {
          this.setKeywordTranslationLanguage('cmn')
          flag = true
        }
        break
      case this.constants.KEYWORD_TRANS_PA:
        if (this.getKeywordTranslationLanguage() !== 'pa') {
          this.setKeywordTranslationLanguage('pa')
          flag = true
        }
        break
      case this.constants.KEYWORD_TRANS_RU:
        if (this.getKeywordTranslationLanguage() !== 'ru') {
          this.setKeywordTranslationLanguage('ru')
          flag = true
        }
        break
      case this.constants.KEYWORD_TRANS_SO:
        if (this.getKeywordTranslationLanguage() !== 'so') {
          this.setKeywordTranslationLanguage('so')
          flag = true
        }
        break
      case this.constants.KEYWORD_TRANS_ES:
        if (this.getKeywordTranslationLanguage() !== 'es') {
          this.setKeywordTranslationLanguage('es')
          flag = true
        }
        break
      case this.constants.KEYWORD_TRANS_UK:
        if (this.getKeywordTranslationLanguage() !== 'uk') {
          this.setKeywordTranslationLanguage('uk')
          flag = true
        }
        break
      case this.constants.KEYWORD_TRANS_VI:
        if (this.getKeywordTranslationLanguage() !== 'vi') {
          this.setKeywordTranslationLanguage('vi')
          flag = true
        }
        break
      case this.constants.EXT_SBAC_GLOSSARY_ILLUSTRATION_ON:
        if (this.getExtSbacGlossaryIllustration() === false) {
          this.setExtSbacGlossaryIllustration(true)
          flag = true
        }
        break
      case this.constants.EXT_SBAC_GLOSSARY_ILLUSTRATION_OFF:
        if (this.getExtSbacGlossaryIllustration() === true) {
          this.setExtSbacGlossaryIllustration(false)
          flag = true
        }
        break
      default:
    }

    return flag
  }

}
