<template>
  <div class="amp-img">
    <div
      v-if="dataUrl"
      :style="{ background }"
      class="amp-img__placeholder"
    >
      <img :src="placeholder || dataUrl" alt="" v-bind="$attrs" />
    </div>
    <img
      :src="dataUrl"
      :alt="$attrs.alt || ''"
      v-bind="$attrs"
      class="amp-img__img"
    />
  </div>
</template>

<script>
export default {
  inheritAttrs: false,

  props: {
    src: {
      type: String,
      required: true,
    },
    placeholder: String,
    background: String,
  },

  computed: {
    dataUrl() {
      const { width, height } = this.$attrs
      if (!width || !height) return ""

      // create a tiny png with matching aspect ratio as img
      const w = 100
      const canvas = document.createElement("canvas")
      canvas.width = w
      canvas.height = (height / width) * w

      return canvas.toDataURL()
    },
  },

  mounted() {
    const { src, el } = this
    let timeOut

    const observer = new IntersectionObserver(([entry]) => {
      const img = el.querySelector(`.amp-img__img`)
      const placeholder = el.querySelector(`.amp-img__placeholder`)

      img.onload = function() {
        delete img.onload
        el.classList.add(`amp-img--loaded`)
        if (placeholder) {
          timeOut = setTimeout(() => {
            placeholder.remove()
          }, 300)
        }
      }
      if (entry.isIntersecting) {
        // Element is in viewport
        img.src = src
        observer.disconnect()
      }
    })
    observer.observe(el)

    this.$once("hook:beforeDestroy", () => {
      observer.disconnect()
      if (timeOut) {
        clearTimeout(timeOut)
      }
    })
  },
}
</script>

<style>
.amp-img {
  display: inline-block;
  position: relative;
}

.amp-img__placeholder {
  position: absolute;
  overflow: hidden;
}

.amp-img__placeholder img {
  transform: scale(1.05);
  filter: blur(10px);
}

.amp-img__img {
  opacity: 0;
  transition: opacity 300ms ease;
}

.amp-img--loaded .amp-img__img {
  opacity: 1;
}
</style>
