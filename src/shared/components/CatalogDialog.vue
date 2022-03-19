<template>
  <div ref="dialog" class="qti3-player-cat-dialog" style="display:none;">
    <span tabindex="0"></span>
    <div ref="header" class="qti3-player-cat-dialog-header">
      <span class="qti3-player-cat-dialog-term">{{content.term}}</span>
      <button ref="close" type="button" class="qti3-player-cat-dialog-close" aria-label="Close">×</button>
    </div>
    <div class="qti3-player-cat-dialog-body" v-html="content['glossary-on-screen'].definition">
    </div>
    <span tabindex="0"></span>
  </div>
</template>

<script>
export default {
  name: 'CatalogDialog',

  data() {
    return {
      state: {
        isShown: false,
        dragging: false,
        hidden: true,
        xDiff: 0,
        yDiff: 0,
        x: 0,
        y: 0
      },
      content: {
        term: 'Glossary Dialog',
        'glossary-on-screen': {
          definition: '<p>This is a draggable dialog which is created using HTML CSS & JavaScript. You can <em>move</em> this dialog anywhere on the document or page.</p>'
        }
      }
    }
  },

  methods: {

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
    this.addListeners()
  },

  beforeDestroy () {
    this.removeListeners()
  }
}
</script>

<style scoped>
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
  width: 280px;
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
  padding: .5rem .5rem .5rem 1rem;
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
  padding: 1rem;
  /* align-items: center; */
  flex-direction: column;
  justify-content: center;
}
</style>
