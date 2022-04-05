export class CatalogAudioPlayer {

  constructor (element) {
    this.audioElement = element
    this.isPaused = true
    // Initialize the event handler function references
    this.onPlayPauseClick = this.playPauseClickHandler.bind(this)
    this.onKeyDown = this.keydownHandler.bind(this)
    this.onEnded = this.endedHandler.bind(this)
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
    this.playButton.addEventListener('click',   this.onPlayPauseClick)
    this.playButton.addEventListener('keydown', this.onKeyDown)
    this.audioElement.addEventListener('ended', this.onEnded)
  }

  removeListeners () {
    this.playButton.removeEventListener('click',   this.onPlayPauseClick)
    this.playButton.removeEventListener('keydown', this.onKeyDown)
    this.audioElement.removeEventListener('ended', this.onEnded)
  }

  playPauseClickHandler () {
    this.toggleAudio()
  }

  keydownHandler (event) {
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

  endedHandler () {
    // Return the PlayPause button to its Play state
    this.playButton.classList.remove('pause')
    this.playButton.classList.add('play')
    this.isPaused = true
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
