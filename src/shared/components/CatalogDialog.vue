<template>
  <div ref="dialog" class="qti3-player-cat-dialog" role="dialog" style="display:none;">
    <div ref="header" class="qti3-player-cat-dialog-header">
      <span class="qti3-player-cat-dialog-term">{{content.term}}</span>
      <button ref="close" type="button" class="qti3-player-cat-dialog-close" aria-label="Close">×</button>
    </div>
    <div ref="body" class="qti3-player-cat-dialog-body">
    </div>
  </div>
</template>

<script>
import { CatalogDialogTabs } from '@/shared/components/CatalogDialogTabs'

export default {
  name: 'CatalogDialog',

  data() {
    return {
      /*
       * The state object is for maintaining the visual draggable
       * state of this Dialog
       */
      state: {
        isShown: false,
        dragging: false,
        hidden: true,
        xDiff: 0,
        yDiff: 0,
        x: 0,
        y: 0
      },
      /*
       * The content object is for maintaining the Catalog content
       * that is injected into this Dialog.
       */
      content: {
        term: ''
      },
      /*
       * The tabs property is for keeping a handle on the tabs
       * control of this Dialog.
       */
      tabs: null
    }
  },

  methods: {

    /**
     * @description Inject dialog content and generate the dialog's tab control.
     * @param {Object} content - contains properties for support definitions
     */
    setContent(content) {
      // Clear out existing content
      this.resetDialogContent()
      // Set term
      this.setDialogTerm(content.term)
      // Set support content
      this.setDialogContent(content)
      // Create Tab structure
      this.createTabs(this.content)
    },

    /**
     * @description Utility method to extract support information from
     * a Glossary Catalog Event.
     * @param {Object} content
     */
    setDialogContent (content) {
      if (!('data' in content)) return

      content.data.forEach((catalog) => {
        switch (catalog.support) {
          case 'glossary-on-screen':
            this.setDialogGlossary(catalog.card)
            break
          case 'keyword-translation':
            this.setDialogKeywordTranslation(catalog.card)
            break
          case 'ext:sbac-glossary-illustration':
            this.setDialogGlossaryIllustration(catalog.card)
            break
          default:
        }
      }, this)
    },

    /**
     * @description Utility method to clean out the content object.
     */
    resetDialogContent() {
      delete this.content.glossary
      delete this.content.keywordTranslation
      delete this.content.glossaryIllustration
    },

    setDialogTerm (term) {
      this.content.term = term
    },

    setDialogGlossary (glossary) {
      this.content.glossary = glossary
    },

    setDialogKeywordTranslation (keywordTranslation) {
      this.content.keywordTranslation = keywordTranslation
    },

    setDialogGlossaryIllustration (glossaryIllustration) {
      this.content.glossaryIllustration = glossaryIllustration
    },

    createTabs (content) {
      this.tabs.create(content)
    },

    show () {
      this.state.hidden = false
      this.render()

      // Center dialog if first time showing
      if (!this.state.isShown) {
        this.state.isShown = true
        this.center()
      }
    },

    hide () {
      this.state.hidden = true
      this.render()
    },

    center () {
      this.$refs.dialog.style.top = ((window.innerHeight/2) - (this.$refs.dialog.offsetHeight/2))+'px'
      this.$refs.dialog.style.left = ((window.innerWidth/2) - (this.$refs.dialog.offsetWidth/2))+'px'
    },

    /**
     * @description Method for hidding and re-centering
     * this component.  Typically, this is called before
     * loading a new item.
     */
    reset () {
      this.state.x = 0
      this.state.y = 0
      // isShown=false will result in center on next open
      this.state.isShown = false
      // hide it
      this.state.hidden = true
      this.render()
    },

    render () {
      if (this.state.hidden) {
        this.$refs.dialog.style.display = 'none'
      } else {
         this.$refs.dialog.style.display = ''
      }

      this.$refs.dialog.style.transform = 'translate(' + this.state.x + 'px, ' + this.state.y + 'px)'
    },

    addListeners () {
      this.$refs.header.addEventListener('mousedown',  this.onMouseDown.bind(this))
      this.$refs.header.addEventListener('mousemove',  this.onMouseMove.bind(this))
      this.$refs.header.addEventListener('mouseup',    this.onMouseUp.bind(this))
      this.$refs.header.addEventListener('mouseleave', this.onMouseUp.bind(this))
      this.$refs.header.addEventListener('touchstart', this.onTouchStart.bind(this))
      this.$refs.header.addEventListener('touchmove',  this.onTouchMove.bind(this))
      this.$refs.header.addEventListener('touchend',   this.onTouchEnd.bind(this))
      this.$refs.close.addEventListener('click',       this.hide.bind(this))
      this.$refs.close.addEventListener('touchend',    this.hide.bind(this))
    },

    removeListeners () {
      this.$refs.header.removeEventListener('mousedown',  this.onMouseDown)
      this.$refs.header.removeEventListener('mousemove',  this.onMouseMove)
      this.$refs.header.removeEventListener('mouseup',    this.onMouseUp)
      this.$refs.header.removeEventListener('mouseleave', this.onMouseUp)
      this.$refs.header.removeEventListener('touchstart', this.onTouchStart)
      this.$refs.header.removeEventListener('touchmove',  this.onTouchMove)
      this.$refs.header.removeEventListener('touchend',   this.onTouchEnd)
      this.$refs.close.removeEventListener('click',       this.hide)
      this.$refs.close.removeEventListener('touchend',    this.hide)
    },

    onMouseDown (event) {
      this.state.dragging = true
      this.state.xDiff = event.pageX - this.state.x
      this.state.yDiff = event.pageY - this.state.y
    },

    onTouchStart (event) {
      event.preventDefault()

      this.state.dragging = true
      this.state.xDiff = event.targetTouches[0].pageX - this.state.x
      this.state.yDiff = event.targetTouches[0].pageY - this.state.y
    },

    onMouseMove (event) {
      if (this.state.dragging) {
        this.state.x = event.pageX - this.state.xDiff
        this.state.y = event.pageY - this.state.yDiff
      }

      this.render()
    },

    onTouchMove (event) {
      // Prevent default in order to prevent
      // unwanted scrolling during drag.
      event.preventDefault()
      event.stopPropagation()

      if (this.state.dragging) {
        this.state.x = event.targetTouches[0].pageX - this.state.xDiff
        this.state.y = event.targetTouches[0].pageY - this.state.yDiff
      }

      this.render()
    },

    onMouseUp () {
      this.state.dragging = false
    },

    onTouchEnd (event) {
      event.preventDefault()
      this.state.dragging = false
    }

  },

  mounted() {
    this.tabs = new CatalogDialogTabs(this.$refs.body)
    this.addListeners()
  },

  beforeDestroy () {
    this.tabs.removeListeners()
    this.removeListeners()
  }
}
</script>

<style>
.qti3-player-cat-dialog {
  z-index: 1020;
  border: 1px solid;
  /* border-color: #999; */
  border-color: var(--foreground);
  border-radius: .25rem;
  color: var(--foreground);
  background-color: var(--background);
  outline: none;
  min-width: 250px;
  width: 300px;
  position: absolute;
  box-shadow: 5px 5px 10px rgba(0,0,0,0.06);
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  box-shadow: 10px 10px 15px rgba(0,0,0,0.06);
}

.qti3-player-cat-dialog .qti3-player-cat-dialog-header {
  padding: .5rem;
  cursor: move;
  border-bottom: 1px solid;
  border-color: var(--foreground);
}

.qti3-player-cat-dialog .qti3-player-cat-dialog-header .qti3-player-cat-dialog-term {
  font-size: 16px;
  font-weight: 500;
}

button {
  overflow: visible;
  text-transform: none;
  outline: 0 !important;
  margin: 0;
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  color: var(--foreground);
}

button:not(:disabled) {
  cursor: pointer;
}

button.qti3-player-cat-dialog-close {
  -webkit-appearance: button;
  padding: 0;
  margin: .1rem 0 0 auto;
  background-color: transparent;
  border: 1px solid transparent;
}

.qti3-player-cat-dialog-close {
  float: right;
  font-size: 1.3125rem;
  font-weight: 600;
  line-height: 1;
  color: var(--foreground);
  text-shadow: 0 1px 0 var(--background);
  opacity: .75;
}

.qti3-player-cat-dialog-close:focus {
  border-color: var(--foreground);
}

.qti3-player-cat-dialog-header .qti3-player-cat-dialog-close {
  cursor: pointer;
}

.qti3-player-cat-dialog .qti3-player-cat-dialog-body {
  display: flex;
  padding: .5rem;
  /* align-items: center; */
  flex-direction: column;
  justify-content: center;
}


.qti3-player-cat-dialog-body .qti3-player-cat-tabs {
  width: 100%;
}

.qti3-player-cat-dialog-body [role="tablist"] {
  margin: 0 0 -0.1em;
  overflow: visible;
}

.qti3-player-cat-dialog-body [role="tab"] {
  position: relative;
  margin: 0;
  padding: 0.3em 0.5em 0.4em;
  border: 1px solid hsl(219deg 1% 72%);
  border-radius: 0.2em 0.2em 0 0;
  /*box-shadow: 0 0 0.2em hsl(219deg 1% 72%);*/
  overflow: visible;
  font-family: inherit;
  font-size: inherit;
  background-color: var(--background);
}

.qti3-player-cat-dialog-body [role="tab"]:hover::before,
.qti3-player-cat-dialog-body [role="tab"]:focus::before {
  position: absolute;
  bottom: 100%;
  right: -1px;
  left: -1px;
  border-radius: 0.2em 0.2em 0 0;
  border-top: 3px solid;
  border-color: var(--foreground);
  content: "";
}

.qti3-player-cat-dialog-body [role="tab"][aria-selected="true"]::before {
  position: absolute;
  bottom: 100%;
  right: -1px;
  left: -1px;
  border-radius: 0.2em 0.2em 0 0;
  border-top: 5px solid;
  border-color: #0d6efd;
  content: "";
}

.qti3-player-cat-dialog-body [role="tab"][aria-selected="true"] {
  border-radius: 0;
  background-color: var(--background);
  outline: 0;
}

.qti3-player-cat-dialog-body [role="tab"][aria-selected="true"]:not(:focus):not(:hover)::before {
  border-top: 3px solid;
  /* blue */
  border-color: #0d6efd;
}

.qti3-player-cat-dialog-body [role="tab"][aria-selected="true"]::after {
  position: absolute;
  z-index: 3;
  bottom: -1px;
  right: 0;
  left: 0;
  height: 0.3em;
  background-color: var(--background);
  box-shadow: none;
  content: "";
}

.qti3-player-cat-dialog-body [role="tab"]:hover,
.qti3-player-cat-dialog-body [role="tab"]:focus,
.qti3-player-cat-dialog-body [role="tab"]:active {
  outline: 0;
  border-radius: 0;
  color: inherit;
}

.qti3-player-cat-dialog-body [role="tab"]:hover::before,
.qti3-player-cat-dialog-body [role="tab"]:focus::before {
  /* border-color: hsl(20deg 96% 48%); */
}

.qti3-player-cat-dialog-body [role="tabpanel"] {
  position: relative;
  z-index: 2;
  padding: 0.5em 0.5em 0.7em;
  border: 1px solid hsl(219deg 1% 72%);
  border-radius: 0 0.2em 0.2em;
}

.qti3-player-cat-dialog-body [role="tabpanel"].hidden {
  display: none;
}

.qti3-player-cat-dialog-body [role="tabpanel"]:focus {
  /*border-color: hsl(20deg 96% 48%);
  box-shadow: 0 0 0.2em hsl(20deg 96% 48%);*/
  outline: 0;
}

.qti3-player-cat-dialog-body [role="tabpanel"]:focus::after {
  position: absolute;
  bottom: 0;
  right: -1px;
  left: -1px;
  border-radius: 0 0 0.2em 0.2em;
  content: "";
}

.qti3-player-cat-dialog-body [role="tabpanel"] p {
  margin: 0;
}

.qti3-player-cat-dialog-body [role="tabpanel"] * + p {
  margin-top: 1em;
}

.qti3-player-cat-dialog-body audio {
  width: 100%;
}
</style>
