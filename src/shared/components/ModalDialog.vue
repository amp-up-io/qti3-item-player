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
/*
// .modal-open      - body class for killing the scroll
// .modal           - container to scroll within
// .modal-dialog    - positioning shell for the actual modal
// .modal-content   - actual modal w/ bg and corners and stuff
*/

.modal-open .modal {
  overflow-x: hidden;
  overflow-y: auto;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1050;
  display: none;
  width: 100%;
  height: 100%;
  overflow: hidden;
  outline: 0;
}

.modal-dialog {
  position: relative;
  width: auto;
  margin: 0.5rem;
  pointer-events: none;
}

.modal-dialog-centered {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-align: center;
     -ms-flex-align: center;
        align-items: center;
  min-height: calc(100% - 1rem);
}

.modal-dialog-centered::before {
  display: block;
  height: calc(100vh - 1rem);
  height: -webkit-min-content;
  height: -moz-min-content;
  height: min-content;
  content: "";
}

@media (min-width: 576px) {
  .modal-dialog {
      max-width: 500px;
      margin: 1.75rem auto;
  }

  .modal-dialog-centered {
    min-height: calc(100% - 3.5rem);
  }

  .modal-dialog-centered::before {
      height: calc(100vh - 3.5rem);
      height: -webkit-min-content;
      height: -moz-min-content;
      height: min-content;
  }

}

.modal-content {
  position: relative;
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-orient: vertical;
  -webkit-box-direction: normal;
  -ms-flex-direction: column;
  flex-direction: column;
  width: 100%;
  pointer-events: auto;
  color: var(--foreground);
  background-color: var(--background);
  background-clip: padding-box;
  border: 1px solid #f4f8f9;
  border-radius: .5rem;
  outline: 0;
}

.modal.show {
  display: block;
}

.modal.show .modal-content {
  z-index: 1050;
}

.modal-header {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-align: start;
     -ms-flex-align: start;
  align-items: flex-start;
  -webkit-box-pack: justify;
     -ms-flex-pack: justify;
  justify-content: space-between;
  padding: .5rem .5rem;
  /* border-bottom: 1px solid var(--light); */
  border-top-left-radius: calc(.5rem - 1px);
  border-top-right-radius: calc(.5rem - 1px);
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

button.close {
  -webkit-appearance: button;
  padding: 0;
  background-color: transparent;
  border: 0;
}

.close {
  float: right;
  font-size: 1.3125rem;
  font-weight: 600;
  line-height: 1;
  color: var(--foreground);
  text-shadow: 0 1px 0 var(--background);
  opacity: .75;
}

.modal-header .close {
  padding: 1rem 1rem;
  margin: -1rem -1rem -1rem auto;
  cursor: pointer;
}

.modal-body {
  position: relative;
  -webkit-box-flex: 1;
          -ms-flex: 1 1 auto;
              flex: 1 1 auto;
  padding: .5rem;
}

.modal-footer {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -ms-flex-wrap: wrap;
  flex-wrap: wrap;
  -webkit-box-align: center;
  -ms-flex-align: center;
  align-items: center;
  -webkit-box-pack: end;
  -ms-flex-pack: end;
  justify-content: flex-end;
  padding: .25rem;
  margin: .25rem;
  border-top: 1px solid var(--secondary);
  border-bottom-right-radius: calc(.5rem - 1px);
  border-bottom-left-radius: calc(.5rem - 1px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}

.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1040;
  width: 100vw;
  height: 100vh;
  background-color: var(--foreground);
  opacity: .5;
}
</style>
