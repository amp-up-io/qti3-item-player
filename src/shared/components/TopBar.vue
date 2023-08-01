<template>
  <nav class="navbar navbar-expand-sm navbar-light bg-light navbar-bottom-shadow">
    <div class="container-fluid">
      <div class="navbar-brand router-link">
          <img src="@/assets/amp-up-io.svg" class="bi me-2" width="32" height="32" alt=""/>
          Test Runner
      </div>
      <button class="btn btn-outline-secondary" type="button" id="offcanvasSettingsLabel" data-bs-toggle="offcanvas" data-bs-target="#offcanvasSettingsPanel" aria-controls="offcanvasSettingsPanel">
        Settings
      </button>
    </div>
  </nav>
</template>

<script>
export default {
  name: 'TopBar',

  props: {
  },

  data () {
    return {
      colorMenuItems: null,
      paddingMenuItems: null
    }
  },

  methods: {

    initialize () {
      const settingsDropdown = document.querySelector('#settingsDropdown')
      if (settingsDropdown == null) return
      this.colorMenuItems = settingsDropdown.querySelectorAll('a.color-item')
      this.paddingMenuItems = settingsDropdown.querySelectorAll('a.padding-item')
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
.navbar-bottom-shadow {
  box-shadow: 0 2px 5px 0 rgba(0,0,0,0.16);
}

.navbar-brand.router-link a {
  text-decoration: none;
  color: inherit;
}

.navbar-brand.router-link a.router-link-exact-active {
}
</style>
