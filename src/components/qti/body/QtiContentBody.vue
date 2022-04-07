<template>
  <div ref="root" class="qti-content-body">
    <slot></slot>
  </div>
</template>

<script>

export default {
  name: 'QtiContentBody',

  data () {
    return {
      isQtiValid: true
    }
  },

  mounted () {
  }

}
</script>

<style>
.qti-content-body {
  font-size: inherit;
  font-weight: inherit;
  line-height: inherit;
}
/*
.qti-content-body {
  font-size: 16px;
  font-weight: 400;
  line-height: 1.6;
}

.mxl-feedback-inline-msg {
  display: inline-block;
  margin-left: 2px;
}
*/
</style>
