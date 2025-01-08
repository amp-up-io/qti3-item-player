export class CatalogAudioPlayer {

  constructor (element) {
    // Raw <audio> element
    this.audioElement = element
    this.playPauseButton = null
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
    this.createAudioTemplate(this.isNestedAmpAudioElement(this.audioElement))
    return this
  }

  isNestedAmpAudioElement (audioElement) {
    return audioElement.parentNode.classList.contains('amp-audio__holder')
  }

  createAudioTemplate (isNestedAmpAudioElement) {
    this.outerWrapper = 
        (isNestedAmpAudioElement)
          ? this.createNestedAmpAudioWrapper(this.audioElement)
          : this.createAudioWrapper(this.audioElement)

    this.playerContainer = this.createPlayerContainer()
    this.outerWrapper.appendChild(this.playerContainer)
    this.addListeners()
  }

  createNestedAmpAudioWrapper (audioElement) {
    const outerWrapper = audioElement.parentNode.parentNode
    outerWrapper.classList.add('cat-audio__wrapper')
    // Remove AmpAudio controls and captions container
    const captionsContainer = outerWrapper.querySelector('.amp-audio-captions__container')
    if (captionsContainer != null) captionsContainer.remove()
    const audioContainer = outerWrapper.querySelector('.amp-audio__container')
    if (audioContainer != null) audioContainer.remove()
    return outerWrapper;
  }

  createAudioWrapper (audioElement) {
    const outerWrapper = document.createElement('div')
    outerWrapper.classList.add('cat-audio__wrapper')
    const wrapper = document.createElement('div')
    wrapper.classList.add('cat-audio__holder')
    audioElement.parentNode.appendChild(outerWrapper)
    audioElement.setAttribute('tabindex', '-1')
    outerWrapper.appendChild(wrapper)
    wrapper.appendChild(audioElement)
    return outerWrapper
  }

  createPlayerContainer () {
    const container = document.createElement('div')
    container.classList.add('cat-audio__container')
    this.setPlayPauseButton(this.createPlayPauseButton())
    container.appendChild(this.getPlayPauseButton())
    return container
  }

  getPlayPauseButton () {
    return this.playPauseButton
  }

  setPlayPauseButton (button) {
    this.playPauseButton = button
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
