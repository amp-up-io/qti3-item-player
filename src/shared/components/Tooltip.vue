<template>
  <div ref="template" style="display: none;">
    <span :class="tooltipStyle">{{message}}</span>
  </div>
</template>

<script>
/**
 * @description General-purpose tooltip component.
 */
import tippy from 'tippy.js'
import 'tippy.js/dist/tippy.css'

export default {
  name: 'Tooltip',

  props: {
    target: {
      required: true,
      type: Function
    },
    message: {
      required: false,
      type: String,
      default: ''
    },
    colorStyle: {
      required: false,
      type: String,
      default: ''
    },
    placement: {
      required: false,
      type: String,
      default: 'top'
    }
  },

  computed: {
    tooltipStyle () {
      return this.colorStyle + ' __tooltipMessage'
    }
  },

  data() {
    return {
      targetElement: null,
      tippy: null,
      zIndex: 101
    }
  },

  methods: {
    hide () {
      this.tippy.hide()
    },

    show () {
      this.tippy.show()
    }
  },

  mounted () {
    this.targetElement = this.target()

    console.log('this.placement:', this.placement)

    this.tippy = tippy(this.targetElement, {
      content: this.$refs.template.innerHTML,
      allowHTML: true,
      trigger: 'manual',
      theme: this.colorStyle,
      placement: this.placement,
      zIndex: 101
    })
  },

  beforeDestroy () {
    if (this.tippy !== null) {
      this.tippy.destroy()
    }
  }
}
</script>


<style>
.__tooltipMessage {
  --white: #fff;
  --black: #000;
  --rose: #ffd0ff;
  --blue: #003398;
  --yellow: #ffcc00;
  --dgray: #666;
  --mgray: #e5e5e5;
  font-size: 1rem;
  /* Use same font-family as the Qti3Player */
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "Liberation Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
}

/* Default
   High Contrast */
.qti3-player-color-default.__tooltipMessage,
.qti3-player-color-blackwhite.__tooltipMessage {
  color: var(--white);
  background-color: var(--black);
}

/* Default - reverse polarity
   High contrast - reverse polarity */
.qti3-player-color-defaultreverse.__tooltipMessage,
.qti3-player-color-whiteblack.__tooltipMessage {
  color: var(--black);
  background-color: var(--white);
}

/* Black on Rose */
.qti3-player-color-blackrose.__tooltipMessage {
  color: var(--rose);
  background-color: var(--black);
}

/* Rose on Black */
.qti3-player-color-roseblack.__tooltipMessage {
  color: var(--black);
  background-color: var(--rose);
}

/* Dgray on Mgray */
.qti3-player-color-dgraymgray.__tooltipMessage {
  color: var(--mgray);
  background-color: var(--dgray);
}

/* Mgray on Dgray */
.qti3-player-color-mgraydgray.__tooltipMessage {
  color: var(--dgray);
  background-color: var(--mgray);
}

/* Dgray on Mgray */
.qti3-player-color-yellowblue.__tooltipMessage {
  color: var(--blue);
  background-color: var(--yellow);
}

/* Mgray on Dgray */
.qti3-player-color-blueyellow.__tooltipMessage {
  color: var(--yellow);
  background-color: var(--blue);
}

/* =======================
   Tippy background styles
   ======================= */
.tippy-box[data-theme="qti3-player-color-default"],
.tippy-box[data-theme="qti3-player-color-blackwhite"],
.tippy-box[data-theme="qti3-player-color-blackrose"] {
  background-color: black;
}

.tippy-box[data-theme="qti3-player-color-default"] > .tippy-arrow,
.tippy-box[data-theme="qti3-player-color-blackwhite"] > .tippy-arrow,
.tippy-box[data-theme="qti3-player-color-blackrose"] > .tippy-arrow {
  color: black;
}

.tippy-box[data-theme="qti3-player-color-defaultreverse"],
.tippy-box[data-theme="qti3-player-color-whiteblack"] {
  background-color: white;
}

.tippy-box[data-theme="qti3-player-color-defaultreverse"] > .tippy-arrow,
.tippy-box[data-theme="qti3-player-color-whiteblack"] > .tippy-arrow{
  color: white;
}

.tippy-box[data-theme="qti3-player-color-roseblack"] {
  background-color: #ffd0ff;
}

.tippy-box[data-theme="qti3-player-color-roseblack"] > .tippy-arrow {
  color: #ffd0ff;
}

/* Medium Gray on Dark Gray */
.tippy-box[data-theme="qti3-player-color-mgraydgray"] {
  background-color: #e5e5e5;
}

.tippy-box[data-theme="qti3-player-color-mgraydgray"] > .tippy-arrow {
  color: #e5e5e5;
}

/* Dark Gray on Medium Gray */
.tippy-box[data-theme="qti3-player-color-dgraymgray"] {
  background-color: #666;
}

.tippy-box[data-theme="qti3-player-color-dgraymgray"] > .tippy-arrow {
  color: #666;
}

/* Yellow on Blue */
.tippy-box[data-theme="qti3-player-color-yellowblue"] {
  background-color: #ffcc00;
}

.tippy-box[data-theme="qti3-player-color-yellowblue"] > .tippy-arrow {
  color: #ffcc00;
}

/* Blue on Yellow */
.tippy-box[data-theme="qti3-player-color-blueyellow"] {
  background-color: #003398;
}

.tippy-box[data-theme="qti3-player-color-blueyellow"] > .tippy-arrow {
  color: #003398;
}
</style>
