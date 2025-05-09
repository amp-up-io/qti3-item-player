<template>
  <div>
    <slot></slot>
  </div>
</template>

<script>
export default {
  name: 'CustomOption',

  props: {
  },

  data () {
    return {
      content: ''
    }
  },

  methods: {
    /**
     * @description Iterate through the slots
     * and gather up the text.
     */
    processChildren (slots) {
      slots.forEach((slot) => {
        this.content += slot.text
      }, this)
    }
  },

  mounted () {
    this.processChildren(this.$slots.default)
  }
}
</script>

<style scoped>
div {
  display: none;
}
</style>
