<template>
  <div class="offcanvas offcanvas-end" data-bs-scroll="true" data-bs-backdrop="false" tabindex="-1" id="offcanvasSettingsPanel" aria-labelledby="offcanvasSettingsLabel" style="width: 280px;">

    <div class="offcanvas-header pb-2">
      <span class="offcanvas-title fs-5 fw-semibold" id="offcanvasSettingsLabel">Settings</span>
      <button type="button" class="btn-close text-reset" data-bs-dismiss="offcanvas" aria-label="Close"></button>
    </div>
    <div class="offcanvas-body pt-1">
      <div class="flex-shrink-0 p-1 bg-white">
        <ul id="settingsDropdown" class="list-unstyled ps-0">
          <li class="mb-1">
            <button class="btn btn-toggle align-items-center rounded collapsed" data-bs-toggle="collapse" data-bs-target="#colors-collapse" aria-expanded="false">
              Colors
            </button>
            <div class="collapse" id="colors-collapse">
              <ul class="btn-toggle-nav list-unstyled fw-normal pb-1 small">
                <li><a class="link-dark rounded color-item" href="#" @click.prevent="handleMenuClick('colors:default')">Default
                  <span class="ms-1 checkmark menu-container-checked" data-color="colors:default">
                    <img src="@/assets/check-solid.svg" class="bi" width="14" height="14"/>
                  </span></a>
                </li>
                <li><a class="link-dark rounded color-item" href="#" @click.prevent="handleMenuClick('colors:default-reverse')">Default Reverse
                  <span class="ms-1 checkmark menu-container-unchecked" data-color="colors:default-reverse">
                    <img src="@/assets/check-solid.svg" class="bi" width="14" height="14"/>
                  </span></a>
                </li>
                <li><a class="link-dark rounded color-item" href="#" @click.prevent="handleMenuClick('colors:highcontrast')">High Contrast
                  <span class="ms-1 checkmark menu-container-unchecked" data-color="colors:highcontrast">
                    <img src="@/assets/check-solid.svg" class="bi" width="14" height="14"/>
                  </span></a>
                </li>
                <li><a class="link-dark rounded color-item" href="#" @click.prevent="handleMenuClick('colors:highcontrast-reverse')">High Contrast Reverse
                  <span class="ms-1 checkmark menu-container-unchecked" data-color="colors:highcontrast-reverse">
                    <img src="@/assets/check-solid.svg" class="bi" width="14" height="14"/>
                  </span></a>
                </li>
                <li><a class="link-dark rounded color-item" href="#" @click.prevent="handleMenuClick('colors:blackrose')">Black on Rose
                  <span class="ms-1 checkmark menu-container-unchecked" data-color="colors:blackrose">
                    <img src="@/assets/check-solid.svg" class="bi" width="14" height="14"/>
                  </span></a>
                </li>
                <li><a class="link-dark rounded color-item" href="#" @click.prevent="handleMenuClick('colors:roseblack')">Rose on Black
                  <span class="ms-1 checkmark menu-container-unchecked" data-color="colors:roseblack">
                    <img src="@/assets/check-solid.svg" class="bi" width="14" height="14"/>
                  </span></a>
                </li>
                <li><a class="link-dark rounded color-item" href="#" @click.prevent="handleMenuClick('colors:mgraydgray')">Medium Gray on Dark Gray
                  <span class="ms-1 checkmark menu-container-unchecked" data-color="colors:mgraydgray">
                    <img src="@/assets/check-solid.svg" class="bi" width="14" height="14"/>
                  </span></a>
                </li>
                <li><a class="link-dark rounded color-item" href="#" @click.prevent="handleMenuClick('colors:dgraymgray')">Dark Gray on Medium Gray
                  <span class="ms-1 checkmark menu-container-unchecked" data-color="colors:dgraymgray">
                    <img src="@/assets/check-solid.svg" class="bi" width="14" height="14"/>
                  </span></a>
                </li>
                <li><a class="link-dark rounded color-item" href="#" @click.prevent="handleMenuClick('colors:yellowblue')">Yellow on Blue
                  <span class="ms-1 checkmark menu-container-unchecked" data-color="colors:yellowblue">
                    <img src="@/assets/check-solid.svg" class="bi" width="14" height="14"/>
                  </span></a>
                </li>
                <li><a class="link-dark rounded color-item" href="#" @click.prevent="handleMenuClick('colors:blueyellow')">Blue on Yellow
                  <span class="ms-1 checkmark menu-container-unchecked" data-color="colors:blueyellow">
                    <img src="@/assets/check-solid.svg" class="bi" width="14" height="14"/>
                  </span></a>
                </li>
                <li><a class="link-dark rounded color-item" href="#" @click.prevent="handleMenuClick('colors:blackcyan')">Black on Cyan
                  <span class="ms-1 checkmark menu-container-unchecked" data-color="colors:blackcyan">
                    <img src="@/assets/check-solid.svg" class="bi" width="14" height="14"/>
                  </span></a>
                </li>
                <li><a class="link-dark rounded color-item" href="#" @click.prevent="handleMenuClick('colors:cyanblack')">Cyan on Black
                  <span class="ms-1 checkmark menu-container-unchecked" data-color="colors:cyanblack">
                    <img src="@/assets/check-solid.svg" class="bi" width="14" height="14"/>
                  </span></a>
                </li>
                <li><a class="link-dark rounded color-item" href="#" @click.prevent="handleMenuClick('colors:blackcream')">Black on Cream
                  <span class="ms-1 checkmark menu-container-unchecked" data-color="colors:blackcream">
                    <img src="@/assets/check-solid.svg" class="bi" width="14" height="14"/>
                  </span></a>
                </li>
                <li><a class="link-dark rounded color-item" href="#" @click.prevent="handleMenuClick('colors:creamblack')">Cream on Black
                  <span class="ms-1 checkmark menu-container-unchecked" data-color="colors:creamblack">
                    <img src="@/assets/check-solid.svg" class="bi" width="14" height="14"/>
                  </span></a>
                </li>
              </ul>
            </div>
          </li>

          <li class="border-top my-2"></li>

          <li class="mb-1">
            <button class="btn btn-toggle align-items-center rounded collapsed" data-bs-toggle="collapse" data-bs-target="#pnp-collapse" aria-expanded="false">
              PNP Settings
            </button>
            <div class="collapse" id="pnp-collapse">
              <ul class="btn-toggle-nav list-unstyled fw-normal pb-1 small">
                <li class="mb-1 mt-2 ms-3">
                  <button class="btn btn-toggle align-items-center rounded collapsed" data-bs-toggle="collapse" data-bs-target="#glossary-collapse" aria-expanded="false">
                    Glossary
                  </button>
                  <div class="collapse mt-1" id="glossary-collapse">
                    <ul class="btn-toggle-nav list-unstyled fw-normal pb-1 small">
                      <li><a class="link-dark rounded glossary-item" href="#" @click.prevent="handleMenuClick('glossary:off')">Off
                        <span ref="menuItemGlossaryOff" class="ms-1 checkmark menu-container-unchecked">
                          <img src="@/assets/check-solid.svg" class="bi" width="14" height="14"/>
                        </span></a>
                      </li>
                      <li><a class="link-dark rounded glossary-item" href="#" @click.prevent="handleMenuClick('glossary:on')">On
                        <span ref="menuItemGlossaryOn" class="ms-1 checkmark menu-container-checked">
                          <img src="@/assets/check-solid.svg" class="bi" width="14" height="14"/>
                        </span></a>
                      </li>
                    </ul>
                  </div>
                </li>

                <li class="mb-1 mt-2 ms-3">
                  <button class="btn btn-toggle align-items-center rounded collapsed" data-bs-toggle="collapse" data-bs-target="#kt-collapse" aria-expanded="false">
                    Keyword Translation
                  </button>
                  <div class="collapse mt-1" id="kt-collapse">
                    <ul class="btn-toggle-nav list-unstyled fw-normal pb-1 small">
                      <li><a class="link-dark rounded kt-item" href="#" @click.prevent="handleMenuClick('ktlang:off')">Off
                        <span ref="menuItemKtLangOff" class="ms-1 checkmark menu-container-checked">
                          <img src="@/assets/check-solid.svg" class="bi" width="14" height="14"/>
                        </span></a>
                      </li>
                      <li><a class="link-dark rounded kt-item" href="#" @click.prevent="handleMenuClick('ktlang:ar')">Arabic
                        <span ref="menuItemKtLangAR" class="ms-1 checkmark menu-container-unchecked">
                          <img src="@/assets/check-solid.svg" class="bi" width="14" height="14"/>
                        </span></a>
                      </li>
                      <li><a class="link-dark rounded kt-item" href="#" @click.prevent="handleMenuClick('ktlang:my')">Burmese
                        <span ref="menuItemKtLangMY" class="ms-1 checkmark menu-container-unchecked">
                          <img src="@/assets/check-solid.svg" class="bi" width="14" height="14"/>
                        </span></a>
                      </li>
                      <li><a class="link-dark rounded kt-item" href="#" @click.prevent="handleMenuClick('ktlang:yue')">Cantonese
                        <span ref="menuItemKtLangYUE" class="ms-1 checkmark menu-container-unchecked">
                          <img src="@/assets/check-solid.svg" class="bi" width="14" height="14"/>
                        </span></a>
                      </li>
                      <li><a class="link-dark rounded kt-item" href="#" @click.prevent="handleMenuClick('ktlang:en')">English
                        <span ref="menuItemKtLangEN" class="ms-1 checkmark menu-container-unchecked">
                          <img src="@/assets/check-solid.svg" class="bi" width="14" height="14"/>
                        </span></a>
                      </li>
                      <li><a class="link-dark rounded kt-item" href="#" @click.prevent="handleMenuClick('ktlang:tl')">Filipino (Ilokano + Tagalog)
                        <span ref="menuItemKtLangTL" class="ms-1 checkmark menu-container-unchecked">
                          <img src="@/assets/check-solid.svg" class="bi" width="14" height="14"/>
                        </span></a>
                      </li>
                      <li><a class="link-dark rounded kt-item" href="#" @click.prevent="handleMenuClick('ktlang:de')">German
                        <span ref="menuItemKtLangDE" class="ms-1 checkmark menu-container-unchecked">
                          <img src="@/assets/check-solid.svg" class="bi" width="14" height="14"/>
                        </span></a>
                      </li>
                      <li><a class="link-dark rounded kt-item" href="#" @click.prevent="handleMenuClick('ktlang:hmn')">Hmong
                        <span ref="menuItemKtLangHMN" class="ms-1 checkmark menu-container-unchecked">
                          <img src="@/assets/check-solid.svg" class="bi" width="14" height="14"/>
                        </span></a>
                      </li>
                      <li><a class="link-dark rounded kt-item" href="#" @click.prevent="handleMenuClick('ktlang:ja')">Japanese
                        <span ref="menuItemKtLangJA" class="ms-1 checkmark menu-container-unchecked">
                          <img src="@/assets/check-solid.svg" class="bi" width="14" height="14"/>
                        </span></a>
                      </li>
                      <li><a class="link-dark rounded kt-item" href="#" @click.prevent="handleMenuClick('ktlang:ko')">Korean
                        <span ref="menuItemKtLangKO" class="ms-1 checkmark menu-container-unchecked">
                          <img src="@/assets/check-solid.svg" class="bi" width="14" height="14"/>
                        </span></a>
                      </li>
                      <li><a class="link-dark rounded kt-item" href="#" @click.prevent="handleMenuClick('ktlang:cmn')">Mandarin
                        <span ref="menuItemKtLangCMN" class="ms-1 checkmark menu-container-unchecked">
                          <img src="@/assets/check-solid.svg" class="bi" width="14" height="14"/>
                        </span></a>
                      </li>
                      <li><a class="link-dark rounded kt-item" href="#" @click.prevent="handleMenuClick('ktlang:pa')">Punjabi
                        <span ref="menuItemKtLangPA" class="ms-1 checkmark menu-container-unchecked">
                          <img src="@/assets/check-solid.svg" class="bi" width="14" height="14"/>
                        </span></a>
                      </li>
                      <li><a class="link-dark rounded kt-item" href="#" @click.prevent="handleMenuClick('ktlang:ru')">Russian
                        <span ref="menuItemKtLangRU" class="ms-1 checkmark menu-container-unchecked">
                          <img src="@/assets/check-solid.svg" class="bi" width="14" height="14"/>
                        </span></a>
                      </li>
                      <li><a class="link-dark rounded kt-item" href="#" @click.prevent="handleMenuClick('ktlang:so')">Somali
                        <span ref="menuItemKtLangSO" class="ms-1 checkmark menu-container-unchecked">
                          <img src="@/assets/check-solid.svg" class="bi" width="14" height="14"/>
                        </span></a>
                      </li>
                      <li><a class="link-dark rounded kt-item" href="#" @click.prevent="handleMenuClick('ktlang:es')">Spanish
                        <span ref="menuItemKtLangES" class="ms-1 checkmark menu-container-unchecked">
                          <img src="@/assets/check-solid.svg" class="bi" width="14" height="14"/>
                        </span></a>
                      </li>
                      <li><a class="link-dark rounded kt-item" href="#" @click.prevent="handleMenuClick('ktlang:uk')">Ukrainian
                        <span ref="menuItemKtLangUK" class="ms-1 checkmark menu-container-unchecked">
                          <img src="@/assets/check-solid.svg" class="bi" width="14" height="14"/>
                        </span></a>
                      </li>
                      <li><a class="link-dark rounded kt-item" href="#" @click.prevent="handleMenuClick('ktlang:vi')">Vietnamese
                        <span ref="menuItemKtLangVI" class="ms-1 checkmark menu-container-unchecked">
                          <img src="@/assets/check-solid.svg" class="bi" width="14" height="14"/>
                        </span></a>
                      </li>
                    </ul>
                  </div>
                </li>

                <li class="mb-1 mt-2 ms-3">
                  <button class="btn btn-toggle align-items-center rounded collapsed" data-bs-toggle="collapse" data-bs-target="#illgloss-collapse" aria-expanded="false">
                    Illustrated Glossary
                  </button>
                  <div class="collapse mt-1" id="illgloss-collapse">
                    <ul class="btn-toggle-nav list-unstyled fw-normal pb-1 small">
                      <li><a class="link-dark rounded glossary-item" href="#" @click.prevent="handleMenuClick('sbacGlossaryIllustration:off')">Off
                        <span ref="menuItemGlossaryIllustrationOff" class="ms-1 checkmark menu-container-checked">
                          <img src="@/assets/check-solid.svg" class="bi" width="14" height="14"/>
                        </span></a>
                      </li>
                      <li><a class="link-dark rounded glossary-item" href="#" @click.prevent="handleMenuClick('sbacGlossaryIllustration:on')">On
                        <span ref="menuItemGlossaryIllustrationOn" class="ms-1 checkmark menu-container-unchecked">
                          <img src="@/assets/check-solid.svg" class="bi" width="14" height="14"/>
                        </span></a>
                      </li>
                    </ul>
                  </div>
                </li>
              </ul>
            </div>
          </li>

          <li class="border-top my-2"></li>

          <li class="mb-2">
            <button class="btn btn-toggle align-items-center rounded collapsed" data-bs-toggle="collapse" data-bs-target="#container-collapse" aria-expanded="false">
              Container Width
            </button>
            <div class="collapse" id="container-collapse">
              <ul class="btn-toggle-nav list-unstyled fw-normal pb-1 small">
                <li><a class="link-dark rounded" href="#" @click.prevent="handleMenuClick('container:fluid')">QTI 3 Player - Full Width
                  <span ref="menuItemContainerFluid" class="ms-1 menu-container-checked">
                    <img src="@/assets/check-solid.svg" class="bi" width="14" height="14"/>
                  </span></a>
                </li>
                <li><a class="link-dark rounded" href="#" @click.prevent="handleMenuClick('container:responsive')">QTI 3 Player - Responsive
                  <span ref="menuItemContainerResponsive" class="ms-1 menu-container-unchecked">
                    <img src="@/assets/check-solid.svg" class="bi" width="14" height="14"/>
                  </span></a>
                </li>
              </ul>
            </div>
          </li>

          <li class="mb-1">
            <button class="btn btn-toggle align-items-center rounded collapsed" data-bs-toggle="collapse" data-bs-target="#padding-collapse" aria-expanded="false">
              Container Padding
            </button>
            <div class="collapse" id="padding-collapse">
              <ul class="btn-toggle-nav list-unstyled fw-normal pb-1 small">
                <li><a class="link-dark rounded padding-item" href="#" @click.prevent="handleMenuClick('containerpadding:0')">QTI 3 Player - Padding 0
                  <span ref="menuItemContainerPadding0" class="ms-1 checkmark menu-container-checked">
                    <img src="@/assets/check-solid.svg" class="bi" width="14" height="14"/>
                  </span></a>
                </li>
                <li><a class="link-dark rounded padding-item" href="#" @click.prevent="handleMenuClick('containerpadding:1')">QTI 3 Player - Padding 1
                  <span ref="menuItemContainerPadding1" class="ms-1 checkmark menu-container-unchecked">
                    <img src="@/assets/check-solid.svg" class="bi" width="14" height="14"/>
                  </span></a>
                </li>
                <li><a class="link-dark rounded padding-item" href="#" @click.prevent="handleMenuClick('containerpadding:2')">QTI 3 Player - Padding 2
                  <span ref="menuItemContainerPadding2" class="ms-1 checkmark menu-container-unchecked">
                    <img src="@/assets/check-solid.svg" class="bi" width="14" height="14"/>
                  </span></a>
                </li>
                <li><a class="link-dark rounded padding-item" href="#" @click.prevent="handleMenuClick('containerpadding:3')">QTI 3 Player - Padding 3
                  <span ref="menuItemContainerPadding3" class="ms-1 checkmark menu-container-unchecked">
                    <img src="@/assets/check-solid.svg" class="bi" width="14" height="14"/>
                  </span></a>
                </li>
                <li><a class="link-dark rounded padding-item" href="#" @click.prevent="handleMenuClick('containerpadding:4')">QTI 3 Player - Padding 4
                  <span ref="menuItemContainerPadding4" class="ms-1 checkmark menu-container-unchecked">
                    <img src="@/assets/check-solid.svg" class="bi" width="14" height="14"/>
                  </span></a>
                </li>
                <li><a class="link-dark rounded padding-item" href="#" @click.prevent="handleMenuClick('containerpadding:5')">QTI 3 Player - Padding 5
                  <span ref="menuItemContainerPadding5" class="ms-1 checkmark menu-container-unchecked">
                    <img src="@/assets/check-solid.svg" class="bi" width="14" height="14"/>
                  </span></a>
                </li>
              </ul>
            </div>
          </li>

        </ul>
      </div>

    </div>
  </div>
</template>

<script>
export default {
  name: 'SettingsPanel',

  props: {
  },

  data () {
    return {
      colorMenuItems: null,
      paddingMenuItems: null,
      ktMenuItems: null
    }
  },

  methods: {

    initialize () {
      const settingsDropdown = document.querySelector('#settingsDropdown')
      if (settingsDropdown == null) return
      this.colorMenuItems = settingsDropdown.querySelectorAll('a.color-item')
      this.paddingMenuItems = settingsDropdown.querySelectorAll('a.padding-item')
      this.ktMenuItems = settingsDropdown.querySelectorAll('a.kt-item')
    },

    handleMenuClick (param) {
      let colorClass = null

      switch (param) {
        case 'colors:default':
          colorClass = 'qti3-player-color-default'
          break
        case 'colors:default-reverse':
          colorClass = 'qti3-player-color-defaultreverse'
          break
        case 'colors:highcontrast':
          colorClass = 'qti3-player-color-blackwhite'
          break
        case 'colors:highcontrast-reverse':
          colorClass = 'qti3-player-color-whiteblack'
          break
        case 'colors:blackrose':
          colorClass = 'qti3-player-color-blackrose'
          break
        case 'colors:roseblack':
          colorClass = 'qti3-player-color-roseblack'
          break
        case 'colors:mgraydgray':
          colorClass = 'qti3-player-color-mgraydgray'
          break
        case 'colors:dgraymgray':
          colorClass = 'qti3-player-color-dgraymgray'
          break
        case 'colors:yellowblue':
          colorClass = 'qti3-player-color-yellowblue'
          break
        case 'colors:blueyellow':
          colorClass = 'qti3-player-color-blueyellow'
          break
        case 'colors:blackcyan':
          colorClass = 'qti3-player-color-blackcyan'
          break
        case 'colors:cyanblack':
          colorClass = 'qti3-player-color-cyanblack'
          break
        case 'colors:blackcream':
          colorClass = 'qti3-player-color-blackcream'
          break
        case 'colors:creamblack':
          colorClass = 'qti3-player-color-creamblack'
          break
        case 'container:fluid':
          this.showCheck(this.$refs.menuItemContainerFluid)
          this.hideCheck(this.$refs.menuItemContainerResponsive)
          this.$emit('menuContainerClick', 'qti3-player-container-fluid')
          break
        case 'container:responsive':
          this.showCheck(this.$refs.menuItemContainerResponsive)
          this.hideCheck(this.$refs.menuItemContainerFluid)
          this.$emit('menuContainerClick', 'qti3-player-container')
          break
        case 'containerpadding:0':
          this.removeAllContainerPaddingChecks()
          this.showCheck(this.$refs.menuItemContainerPadding0)
          this.$emit('menuContainerPaddingClick', 'qti3-player-container-padding-0')
          break
        case 'containerpadding:1':
          this.removeAllContainerPaddingChecks()
          this.showCheck(this.$refs.menuItemContainerPadding1)
          this.$emit('menuContainerPaddingClick', 'qti3-player-container-padding-1')
          break
        case 'containerpadding:2':
          this.removeAllContainerPaddingChecks()
          this.showCheck(this.$refs.menuItemContainerPadding2)
          this.$emit('menuContainerPaddingClick', 'qti3-player-container-padding-2')
          break
        case 'containerpadding:3':
          this.removeAllContainerPaddingChecks()
          this.showCheck(this.$refs.menuItemContainerPadding3)
          this.$emit('menuContainerPaddingClick', 'qti3-player-container-padding-3')
          break
        case 'containerpadding:4':
          this.removeAllContainerPaddingChecks()
          this.showCheck(this.$refs.menuItemContainerPadding4)
          this.$emit('menuContainerPaddingClick', 'qti3-player-container-padding-4')
          break
        case 'containerpadding:5':
          this.removeAllContainerPaddingChecks()
          this.showCheck(this.$refs.menuItemContainerPadding5)
          this.$emit('menuContainerPaddingClick', 'qti3-player-container-padding-5')
          break
        case 'glossary:on':
          this.hideCheck(this.$refs.menuItemGlossaryOff)
          this.showCheck(this.$refs.menuItemGlossaryOn)
          this.$emit('menuPnpChange', 'glossary-on')
          break
        case 'glossary:off':
          this.hideCheck(this.$refs.menuItemGlossaryOn)
          this.showCheck(this.$refs.menuItemGlossaryOff)
          this.$emit('menuPnpChange', 'glossary-off')
          break
        case 'ktlang:off':
          this.removeAllKeywordTranslationChecks()
          this.showCheck(this.$refs.menuItemKtLangOff)
          this.$emit('menuPnpChange', 'ktlang-off')
          break
        case 'ktlang:ar':
          this.removeAllKeywordTranslationChecks()
          this.showCheck(this.$refs.menuItemKtLangAR)
          this.$emit('menuPnpChange', 'ktlang-ar')
          break
        case 'ktlang:my':
          this.removeAllKeywordTranslationChecks()
          this.showCheck(this.$refs.menuItemKtLangMY)
          this.$emit('menuPnpChange', 'ktlang-my')
          break
        case 'ktlang:yue':
          this.removeAllKeywordTranslationChecks()
          this.showCheck(this.$refs.menuItemKtLangYUE)
          this.$emit('menuPnpChange', 'ktlang-yue')
          break
        case 'ktlang:en':
          this.removeAllKeywordTranslationChecks()
          this.showCheck(this.$refs.menuItemKtLangEN)
          this.$emit('menuPnpChange', 'ktlang-en')
          break
        case 'ktlang:tl':
          this.removeAllKeywordTranslationChecks()
          this.showCheck(this.$refs.menuItemKtLangTL)
          this.$emit('menuPnpChange', 'ktlang-tl')
          break
        case 'ktlang:de':
          this.removeAllKeywordTranslationChecks()
          this.showCheck(this.$refs.menuItemKtLangDE)
          this.$emit('menuPnpChange', 'ktlang-de')
          break
        case 'ktlang:hmn':
          this.removeAllKeywordTranslationChecks()
          this.showCheck(this.$refs.menuItemKtLangHMN)
          this.$emit('menuPnpChange', 'ktlang-hmn')
          break
        case 'ktlang:ja':
          this.removeAllKeywordTranslationChecks()
          this.showCheck(this.$refs.menuItemKtLangJA)
          this.$emit('menuPnpChange', 'ktlang-ja')
          break
        case 'ktlang:ko':
          this.removeAllKeywordTranslationChecks()
          this.showCheck(this.$refs.menuItemKtLangKO)
          this.$emit('menuPnpChange', 'ktlang-ko')
          break
        case 'ktlang:cmn':
          this.removeAllKeywordTranslationChecks()
          this.showCheck(this.$refs.menuItemKtLangCMN)
          this.$emit('menuPnpChange', 'ktlang-cmn')
          break
        case 'ktlang:pa':
          this.removeAllKeywordTranslationChecks()
          this.showCheck(this.$refs.menuItemKtLangPA)
          this.$emit('menuPnpChange', 'ktlang-pa')
          break
        case 'ktlang:ru':
          this.removeAllKeywordTranslationChecks()
          this.showCheck(this.$refs.menuItemKtLangRU)
          this.$emit('menuPnpChange', 'ktlang-ru')
          break
        case 'ktlang:so':
          this.removeAllKeywordTranslationChecks()
          this.showCheck(this.$refs.menuItemKtLangSO)
          this.$emit('menuPnpChange', 'ktlang-so')
          break
        case 'ktlang:es':
          this.removeAllKeywordTranslationChecks()
          this.showCheck(this.$refs.menuItemKtLangES)
          this.$emit('menuPnpChange', 'ktlang-es')
          break
        case 'ktlang:uk':
          this.removeAllKeywordTranslationChecks()
          this.showCheck(this.$refs.menuItemKtLangUK)
          this.$emit('menuPnpChange', 'ktlang-uk')
          break
        case 'ktlang:vi':
          this.removeAllKeywordTranslationChecks()
          this.showCheck(this.$refs.menuItemKtLangVI)
          this.$emit('menuPnpChange', 'ktlang-vi')
          break
        case 'sbacGlossaryIllustration:on':
          // For ext:sbacGlossaryIllustration - on
          this.hideCheck(this.$refs.menuItemGlossaryIllustrationOff)
          this.showCheck(this.$refs.menuItemGlossaryIllustrationOn)
          this.$emit('menuPnpChange', 'sbacGlossaryIllustration-on')
          break
        case 'sbacGlossaryIllustration:off':
          // For ext:sbacGlossaryIllustration - off
          this.hideCheck(this.$refs.menuItemGlossaryIllustrationOn)
          this.showCheck(this.$refs.menuItemGlossaryIllustrationOff)
          this.$emit('menuPnpChange', 'sbacGlossaryIllustration-off')
          break
        default:
      }

      if (colorClass !== null) {
        // Notify parent
        this.$emit('menuColorClick', colorClass)
        // Show/Hide checkmarks
        this.removeAllColorChecks()
        this.checkColor(param)
      }
    },

    showCheck (element) {
      element.classList.remove('menu-container-unchecked')
      element.classList.add('menu-container-checked')
    },

    hideCheck (element) {
      element.classList.remove('menu-container-checked')
      element.classList.add('menu-container-unchecked')
    },

    removeAllColorChecks () {
      this.colorMenuItems.forEach((item) => {
        const el = item.querySelector('span.checkmark')
        if (el == null) return
        this.hideCheck(el)
      }, this)
    },

    removeAllContainerPaddingChecks () {
      this.paddingMenuItems.forEach((item) => {
        const el = item.querySelector('span.checkmark')
        if (el == null) return
        this.hideCheck(el)
      }, this)
    },

    removeAllKeywordTranslationChecks () {
      this.ktMenuItems.forEach((item) => {
        const el = item.querySelector('span.checkmark')
        if (el == null) return
        this.hideCheck(el)
      }, this)
    },

    checkColor (color) {
      this.colorMenuItems.forEach((item) => {
        const el = item.querySelector("span[data-color='" + color + "']")
        if (el == null) return
        this.showCheck(el)
      }, this)
    }
  },

  mounted () {
    this.initialize()
  }
}
</script>

<style>
.b-example-divider {
  flex-shrink: 0;
  width: 1.5rem;
  height: 100vh;
  background-color: rgba(0, 0, 0, .1);
  border: solid rgba(0, 0, 0, .15);
  border-width: 1px 0;
  box-shadow: inset 0 .5em 1.5em rgba(0, 0, 0, .1), inset 0 .125em .5em rgba(0, 0, 0, .15);
}

.dropdown-toggle { outline: 0; }

.nav-flush .nav-link {
  border-radius: 0;
}

.btn-toggle {
  display: inline-flex;
  align-items: center;
  padding: .25rem .5rem;
  font-weight: 600;
  color: rgba(0, 0, 0, .65);
  background-color: transparent;
  border: 0;
}
.btn-toggle:hover,
.btn-toggle:focus {
  color: rgba(0, 0, 0, .85);
  background-color: #d2f4ea;
}

.btn-toggle::before {
  width: 1.25em;
  line-height: 0;
  content: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='rgba%280,0,0,.5%29' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M5 14l6-6-6-6'/%3e%3c/svg%3e");
  transition: transform .35s ease;
  transform-origin: .5em 50%;
}

.btn-toggle[aria-expanded="true"] {
  color: rgba(0, 0, 0, .85);
}
.btn-toggle[aria-expanded="true"]::before {
  transform: rotate(90deg);
}

.btn-toggle-nav a {
  display: inline-flex;
  padding: .1875rem .5rem;
  margin-top: .125rem;
  margin-left: 1.25rem;
  text-decoration: none;
}
.btn-toggle-nav a:hover,
.btn-toggle-nav a:focus {
  background-color: #d2f4ea;
}

.scrollarea {
  overflow-y: auto;
}

.fw-semibold { font-weight: 600; }
.lh-tight { line-height: 1.25; }

.menu-container-unchecked {
  display: none;
}

.menu-container-checked {
  display: inline;
}
</style>
