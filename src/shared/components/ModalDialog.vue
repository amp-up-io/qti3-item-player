<template>
  <transition name="fade">
    <div ref="mymodal" class="modal">
      <div class="modal-dialog modal-md modal-dialog-centered">
        <span tabindex="0"></span>
        <div class="modal-content">
          <header class="modal-header">
            <slot name="header"/>
            <button type="button" class="close"  aria-label="Close"  @click="hide()">×</button>
          </header>

          <div class="modal-body">
            <slot name="body"/>
          </div>

          <footer class="modal-footer">
            <slot name="footer"/>
          </footer>
        </div>
        <span tabindex="0"></span>
      </div>

      <div class="modal-backdrop" @click="hide()"/>
    </div>
  </transition>
</template>

<script>
export default {
  name: 'ModalDialog',
  data() {
    return {
    }
  },
  methods: {

    hide () {
      this.$refs.mymodal.classList.remove('fade', 'show')
      document.querySelector('body').classList.remove('modal-open')
    },

    show () {
      this.$refs.mymodal.classList.add('fade', 'show')
      // Remove any scrollbars from the body of the page
      document.querySelector('body').classList.add('modal-open')
    }
  }
};
</script>


<style scoped>
.modal.show {
  display:block;
}

.modal.show .modal-content {
  z-index: 1050;
}

.modal-header {
  padding: .5rem .5rem;
  cursor: move;
}

.modal-body {
  padding: .5rem;
}

.modal-footer {
  padding: .25rem;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>
