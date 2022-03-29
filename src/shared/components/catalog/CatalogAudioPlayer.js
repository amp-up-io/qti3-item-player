export class CatalogAudioPlayer {

  constructor (element) {
    this.audioElement = element
    this.isPaused = true
    return this
  }

  constants = {
    keys: {
      ENTER: 13,
      SPACE: 32
    }
  }

  create () {
    this.createAudioTemplate()
    return this
  }

  createAudioTemplate () {
    this.outerWrapper = document.createElement('div')
    this.outerWrapper.classList.add('cat-audio__wrapper')
    this.wrapper = document.createElement('div')
    this.wrapper.classList.add('cat-audio__holder')
    this.audioElement.parentNode.appendChild(this.outerWrapper)
    this.audioElement.setAttribute('tabindex', '-1')
    this.outerWrapper.appendChild(this.wrapper)
    this.wrapper.appendChild(this.audioElement)
    this.playerContainer = this.createPlayerContainer()
    this.outerWrapper.appendChild(this.playerContainer)
    this.addListeners()
  }

  createPlayerContainer () {
    const container = document.createElement('div')
    container.classList.add('cat-audio__container')
    container.appendChild(this.createPlayPauseButton())
    return container
  }

  createPlayPauseButton () {
    const btn = document.createElement('button')
    btn.classList.add('cat-audio-playpause__container')
    btn.classList.add('play')
    btn.setAttribute('tabindex', '0')
    return btn
  }

  addListeners () {
    this.playButton = this.playerContainer.querySelector('.cat-audio-playpause__container')
    this.playButton.addEventListener('click', this.onPlayPauseClick.bind(this))
    this.playButton.addEventListener('keydown', this.onKeyDown.bind(this))
  }

  removeListeners () {
    this.playButton.removeEventListener('click', this.handlePlayPauseClick)
    this.playButton.removeEventListener('keydown', this.onKeyDown)
  }

  onPlayPauseClick () {
    this.toggleAudio()
  }

  onKeyDown (event) {
    let flag = false
    const key = event.keyCode

    switch (key) {
      case this.constants.keys.SPACE:
      case this.constants.keys.ENTER:
        this.toggleAudio()
        flag = true
        break
      default:
        break
    }

    if (flag) {
      event.stopPropagation()
      event.preventDefault()
    }
  }

  toggleAudio () {
    if (this.isPaused) {
      this.play()
    } else {
      this.pause()
    }
  }

  play () {
    this.playButton.classList.remove('play')
    this.playButton.classList.add('pause')
    this.isPaused = false
    this.audioElement.play()
  }

  pause () {
    this.playButton.classList.remove('pause')
    this.playButton.classList.add('play')
    this.isPaused = true
    this.audioElement.pause()
  }

}
