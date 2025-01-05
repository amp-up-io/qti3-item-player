<template>
  <div ref="videocontainer" class="amp-video">
    <div class="amp-video__holder">
      <video
        ref="player"
        tabIndex="-1"
        class="amp-video__video"
        v-bind="$attrs">
        <slot></slot>
      </video>
    </div>

    <div ref="controller" class="amp-video__container">
      <button
        ref="playpause"
        class="amp-video-playpause__container">
        <svg
          v-show="!isPlaying"
          class="amp-playpause-button"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
            clip-rule="evenodd"
          />
        </svg>
        <svg
          v-show="isPlaying"
          class="amp-playpause-button"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fill-rule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
            clip-rule="evenodd"
          />
        </svg>
      </button>

      <div ref="playtimer" class="amp-playtimer__container" v-show="showPlayTimer">
        <span>{{displayCurrentTime}}</span>
        <span> / </span>
        <span>{{displayDuration}}</span>
      </div>

      <div class="amp-progress__container" v-show="showProgress">
        <input
          ref="progress"
          v-model="currentTime"
          type="range"
          min="0"
          :max="duration"
          class="slider"
        />
      </div>

      <div
        ref="cc"
        class="amp-video-cc__container"
        v-show="showCaptions"
        aria-label="Captions menu">
        CC
      </div>

      <div
        ref="volume"
        class="amp-video-volumemute__container" 
        v-show="showVolumeMute"
        aria-label="Volume mute or unmute">
        <svg
          v-show="!isMuted"
          class="amp-volumemute-button"
          aria-hidden="true"
          role="img"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 576 512">
          <path fill="currentColor" d="M215.03 71.05L126.06 160H24c-13.26 0-24 10.74-24 24v144c0 13.25 10.74 24 24 24h102.06l88.97 88.95c15.03 15.03 40.97 4.47 40.97-16.97V88.02c0-21.46-25.96-31.98-40.97-16.97zm233.32-51.08c-11.17-7.33-26.18-4.24-33.51 6.95-7.34 11.17-4.22 26.18 6.95 33.51 66.27 43.49 105.82 116.6 105.82 195.58 0 78.98-39.55 152.09-105.82 195.58-11.17 7.32-14.29 22.34-6.95 33.5 7.04 10.71 21.93 14.56 33.51 6.95C528.27 439.58 576 351.33 576 256S528.27 72.43 448.35 19.97zM480 256c0-63.53-32.06-121.94-85.77-156.24-11.19-7.14-26.03-3.82-33.12 7.46s-3.78 26.21 7.41 33.36C408.27 165.97 432 209.11 432 256s-23.73 90.03-63.48 115.42c-11.19 7.14-14.5 22.07-7.41 33.36 6.51 10.36 21.12 15.14 33.12 7.46C447.94 377.94 480 319.54 480 256zm-141.77-76.87c-11.58-6.33-26.19-2.16-32.61 9.45-6.39 11.61-2.16 26.2 9.45 32.61C327.98 228.28 336 241.63 336 256c0 14.38-8.02 27.72-20.92 34.81-11.61 6.41-15.84 21-9.45 32.61 6.43 11.66 21.05 15.8 32.61 9.45 28.23-15.55 45.77-45 45.77-76.88s-17.54-61.32-45.78-76.86z"></path>
        </svg>
        <svg
          v-show="isMuted"
          class="amp-volumemute-button"
          aria-hidden="true"
          role="img"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 512 512">
          <path fill="currentColor" d="M215.03 71.05L126.06 160H24c-13.26 0-24 10.74-24 24v144c0 13.25 10.74 24 24 24h102.06l88.97 88.95c15.03 15.03 40.97 4.47 40.97-16.97V88.02c0-21.46-25.96-31.98-40.97-16.97zM461.64 256l45.64-45.64c6.3-6.3 6.3-16.52 0-22.82l-22.82-22.82c-6.3-6.3-16.52-6.3-22.82 0L416 210.36l-45.64-45.64c-6.3-6.3-16.52-6.3-22.82 0l-22.82 22.82c-6.3 6.3-6.3 16.52 0 22.82L370.36 256l-45.63 45.63c-6.3 6.3-6.3 16.52 0 22.82l22.82 22.82c6.3 6.3 16.52 6.3 22.82 0L416 301.64l45.64 45.64c6.3 6.3 16.52 6.3 22.82 0l22.82-22.82c6.3-6.3 6.3-16.52 0-22.82L461.64 256z"></path>
        </svg>
      </div>
    </div>
  </div>
</template>

<script>
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'

const qtiAttributeValidation = new QtiAttributeValidation()

export default {
  name: 'AmpVideo',

  props: {
  },

  data () {
    return {
      video: null,
      videoSubType: null,
      currentTime: 0,
      duration: 0,
      displayCurrentTime: '00:00',
      displayDuration: '00:00',
      videoLoaded: false,
      isPlaying: false,
      isMuted: false,
      isTimeUpdateListening: true,
      showPlayTimer: false,
      showVolumeMute: false,
      showProgress: false,
      showCaptions: false,
      textTracksMap: null,
      mediaInteractionChild: false,
      subtitlesMenu: null,
      subtitleMenuButtons: [],
      isDisabled: false,
      isQtiValid: true
    }
  },

  methods: {

    disable () {
      this.isDisabled = true
      this.pauseVideo()
      this.disableController()
    },

    enable () {
      this.isDisabled = false
      this.enableController()
    },

    disableController () {
      this.$refs.playpause.setAttribute('tabindex', '-1')
      this.$refs.playpause.classList.add('disabled')
      this.$refs.progress.setAttribute('tabindex', '-1')
      this.$refs.progress.classList.add('disabled')
      this.$refs.cc.setAttribute('tabindex', '-1')
      this.$refs.cc.classList.add('disabled')
      this.$refs.volume.setAttribute('tabindex', '-1')
      this.$refs.volume.classList.add('disabled')
      this.$refs.playtimer.classList.add('disabled')
    },

    enableController () {
      this.$refs.playpause.setAttribute('tabindex', '0')
      this.$refs.playpause.classList.remove('disabled')
      this.$refs.progress.setAttribute('tabindex', '0')
      this.$refs.progress.classList.remove('disabled')
      this.$refs.cc.setAttribute('tabindex', '0')
      this.$refs.cc.classList.remove('disabled')
      this.$refs.volume.setAttribute('tabindex', '0')
      this.$refs.volume.classList.remove('disabled')
      this.$refs.playtimer.classList.remove('disabled')
    },

    handleLoaded () {
      if (this.video) {
        // Bind the controller's listeners
        this.addControllerEventListeners()
        // Display duration
        this.duration = Math.round(this.video.duration)
        this.displayDuration = this.convertTime(this.duration)

        // Only emit mediaLoaded when we are nested inside a Media Interaction,
        // in which case we might be asked to autostart.
        if (this.isMediaInteractionChild()) {
          this.$parent.$emit('mediaLoaded', { node: this })
        }
      }
    },

    handleEnded () {
      this.isPlaying = false

      // Only emit mediaEnded when we are nested inside a Media Interaction.
      if (this.isMediaInteractionChild()) {
        this.$parent.$emit('mediaEnded', {})
      }
    },

    /**
     * @description This is here for legacy reasons.  
     * Caution: the 'canplay' event does not fire
     * on Safari iOS.
     */
    handleCanPlay () {
      this.videoLoaded = true
    },

    handleTimeUpdate () {
      if (!this.isTimeUpdateListening) return
      if (!this.video) return

      let currTime = Math.round(this.video.currentTime)
      // Update the progress bar model
      this.currentTime = currTime
      // Update the visible display time
      this.displayCurrentTime = this.convertTime(currTime)
    },

    handlePlayPauseClick () {
      if (this.isDisabled) return
      this.toggleVideo()
    },

    handlePlayPauseKeydown (event) {
      if (this.isDisabled) return

      let flag = false

      switch (event.code) {
        case 'Space':
        case 'Enter':
          this.toggleVideo()
          flag = true
          break
        default:
          break
      }

      if (flag) {
        event.stopPropagation()
        event.preventDefault()
      }
    },

    handleProgressMouseDown () {
      if (this.isDisabled) return

      // Mouse down on the slider we pause the player and
      // suspend the TimeUpdate listener
      this.isTimeUpdateListening = false
      if (!this.video.paused) {
        this.wasPlaying = true
        this.video.pause()
        this.isPlaying = false
      } else {
        this.wasPlaying = false
      }
    },

    handleProgressInput (event) {
      if (this.isDisabled) return

      // Audio should be paused.  Just update the time.  No setPosition.
      this.displayCurrentTime = this.convertTime(event.target.valueAsNumber)
    },

    handleProgressChange (event) {
      if (this.isDisabled) return

      this.setPosition(event.target.valueAsNumber)
      this.isTimeUpdateListening = true

      // Play the video if it was playing when the progress slider change began.
      if (this.wasPlaying && this.video.paused) {
        this.wasPlaying = false
        this.toggleVideo()
      }
    },

    handleCaptionsClick () {
      if (this.isDisabled) return

      this.toggleCaptionsMenu()
    },

    handleCaptionsKeydown (event) {
      if (this.isDisabled) return

      let flag = false

      switch (event.code) {
        case 'Space':
        case 'Enter':
          this.toggleCaptionsMenu()
          flag = true
          break
        default:
          break
      }

      if (flag) {
        event.stopPropagation()
        event.preventDefault()
      }
    },

    toggleCaptionsMenu () {
      this.subtitlesMenu.style.display =
        (this.subtitlesMenu.style.display === 'block')
          ? 'none' 
          : 'block'
    },

    handleVolumeMuteClick () {
      if (this.isDisabled) return
      this.toggleVolume()
    },

    handleVolumeMuteKeydown (event) {
      if (this.isDisabled) return

      let flag = false

      switch (event.code) {
        case 'Space':
        case 'Enter':
          this.toggleVolume()
          flag = true
          break
        default:
          break
      }

      if (flag) {
        event.stopPropagation()
        event.preventDefault()
      }
    },

    handleCueChange () {
      // NOOP
    },

    setPosition (position) {
      this.video.currentTime = position
      this.displayCurrentTime = this.convertTime(position)
    },

    toggleVideo () {
      if (!this.video) return

      if (this.isPlaying) {
        this.isPlaying = false
        this.video.pause()
      } else {
        this.isPlaying = true
        this.video.play()
      }
    },

    playVideo () {
      if (!this.video) return
      this.video.play()
      this.isPlaying = true
    },

    pauseVideo () {
      if (!this.video) return
      this.video.pause()
      this.isPlaying = false
    },

    toggleVolume () {
      if (!this.video) return

      if (this.video.muted) {
          this.video.muted = false
          this.isMuted = false
      } else {
          this.video.muted = true
          this.isMuted = true
      }
    },

    initSlider () {
      if (this.video) {
        this.duration = Math.round(this.video.duration)
      }
    },

    convertTime (seconds) {
      let hhmmss = new Date(seconds * 1000).toISOString().substr(11, 8)
      if (hhmmss.indexOf('00:') === 0) {
        hhmmss = hhmmss.substr(3)
      }
      return hhmmss
    },

    setVideoSubType (subtype) {
      this.videoSubType = subtype
      if (this.videoSubType === 'ampvideo-default') {
        // By default, turn everything on
        this.showProgress = true
        this.showPlayTimer = true
        this.showVolumeMute = true
      }
    },

    getVideoSubType () {
      return 'ampvideo-default' 
    },

    /**
     * @description Try to detect a class of video player that we recognize.
     * @param {String} clazz - class
     */
    detectVideoSubType (clazz) {
      return this.getVideoSubType(clazz)
    },

    isMediaInteractionChild () {
      return this.mediaInteractionChild
    },

    /**
     * @description Examine the parent element to determine
     * if the parent has the proper class.
     */
    detectMediaInteractionChild () {
      this.mediaInteractionChild = this.$parent.$el.classList.contains('qti3-player-media-group')
    },

    /**
     * Iterate through the child nodes
     */
    processChildren () {
      this.video = this.$refs.player
      // Disable controls on the video player.  We add our own controller.
      this.video.removeAttribute('controls')
      // Remove the horrible autoplay
      this.video.removeAttribute('autoplay')
      // Fuss around with width, if video has a width attribute.
      if (this.video.hasAttribute('width')) {
        const width = `${this.video.getAttribute('width')}`
        const widthStyle = !width.endsWith('%') ? `width:${width}px` : `width:${width}`
        this.$refs.videocontainer.setAttribute('style', widthStyle)
        this.$refs.controller.setAttribute('style', widthStyle)
      } else {
        this.video.setAttribute('width', '100%')
      }
      this.textTracksMap = this.filterTextTracks(this.video.querySelectorAll('track'))
    },

    /**
     * @description Iterate through all the text tracks - looking for captions
     * and subtitle tracks.  Build a hashmap of tracks.
     * @return (Map) - textTracksMap
     */
    filterTextTracks (tracks) {
      let textTracksMap = new Map()
      tracks.forEach((track) => {
        switch (track.getAttribute('kind')) {
          case 'subtitles':
          case 'captions':
            // Generate an id if track element has none.  Use the id as hashkey
            if (!track.hasAttribute('id')) {
              track.setAttribute('id', 'track-' + qtiAttributeValidation.randomString (5, 'a'))
            }
            textTracksMap.set(track.getAttribute('id'), track)
            break

          default:
        }
      }, this)

      return (textTracksMap)
    },

    isDefaultTextTrack (trackElement) {
      return (trackElement.hasAttribute('default'))
    },

    addTextTrackCueEventListener () {
      if (!this.video) return
      if (this.video.textTracks.length === 0) return

      // We have textTracks.  Show the CC control.  Create the CC menu.
      this.showCaptions = true
      this.initializeSubtitlesMenu()

      for (let i=0; i<this.video.textTracks.length; i++) {
        // Captions and subtitles added to textTracksMap during validation
        const textTrack = this.video.textTracks[i]
        // Hide the track by default
        textTrack.mode = 'hidden'
        // Add the track to the Subtitles menu
        this.addSubtitlesMenuItem(textTrack)
        // Set up a cuechange listener.
        const trackElement = this.textTracksMap.get(textTrack.id)
        if (typeof trackElement !== 'undefined') {
          // handleCueChange is a noop for now, but set it up anyway.
          textTrack.addEventListener('cuechange', this.handleCueChange)
        }
      }

      // Dock the subtitles menu to the video container
      this.$refs.videocontainer.appendChild(this.subtitlesMenu)
    },

    removeTextTrackCueEventListener () {
      if (!this.video) return
      if (this.video.textTracks.length === 0) return

      // Remove the button click listener
      this.subtitleMenuButtons.forEach((button) => {
        button.removeEventListener('click', this.handleSubtitleButtonClick)
      })

      for (let i=0; i<this.video.textTracks.length; i++) {
        const textTrack = this.video.textTracks[i]
        const trackElement = this.textTracksMap.get(textTrack.id)
        if (typeof trackElement !== 'undefined') {
          textTrack.removeEventListener('cuechange', this.handleCueChange)
        }
      }
    },

    initializeSubtitlesMenu () {
      const df = document.createDocumentFragment()
      this.subtitlesMenu = df.appendChild(document.createElement('ul'))
      this.subtitlesMenu.className = 'ampvideo-subtitles-menu'
      this.subtitlesMenu.appendChild(this.createMenuItem('subtitles-off', '', 'Off'))      
    },

    addSubtitlesMenuItem (textTrack) {
      this.subtitlesMenu
          .appendChild(
            this.createMenuItem(
              `subtitles-${textTrack.language}`,
              textTrack.language,
              textTrack.label,
            ),
          )
    },

    createMenuItem (id, lang, label) {
      const li = document.createElement('li')
      const button = li.appendChild(document.createElement('button'))
      button.setAttribute('id', id)
      button.className = 'ampvideo-subtitles-button'
      if (lang.length > 0) {
        button.setAttribute('lang', lang)
      }
      button.value = label

      // If this is the Off button, make it active
      // because subtitles are off by default.
      if (lang === '')
        button.setAttribute('data-state', 'active')
      else
        button.setAttribute('data-state', 'inactive')

      button.appendChild(document.createTextNode(label))
      button.addEventListener('click', this.handleSubtitleButtonClick)
      this.subtitleMenuButtons.push(button)
      return li
    },

    handleSubtitleButtonClick (event) {
      const button = event.currentTarget

      // Set all buttons to inactive
      this.subtitleMenuButtons.forEach((button) => {
        button.setAttribute('data-state', 'inactive')
      })

      // Find the language to activate
      const lang = button.getAttribute('lang')
      for (let i=0; i<this.video.textTracks.length; i++) {
          // For the 'subtitles-off' button, the first condition will never 
          // match so all subtitles be turned off
          if (this.video.textTracks[i].language === lang) {
            this.video.textTracks[i].mode = 'showing'
            button.setAttribute('data-state', 'active')
          } else {
            this.video.textTracks[i].mode = 'hidden'
          }
      }

      // If this is the Off button, activate it.
      if (lang === null) {
        button.setAttribute('data-state', 'active')
      }

      // Hide the subtitles menu
      this.subtitlesMenu.style.display = 'none'
    },

    addControllerEventListeners () {
      this.$refs.playpause.addEventListener('click', this.handlePlayPauseClick)
      this.$refs.playpause.addEventListener('keydown', this.handlePlayPauseKeydown)
      this.$refs.progress.addEventListener('input', this.handleProgressInput)
      this.$refs.progress.addEventListener('change',this.handleProgressChange)
      this.$refs.progress.addEventListener('mousedown', this.handleProgressMouseDown)
      this.$refs.cc.addEventListener('click', this.handleCaptionsClick)
      this.$refs.cc.addEventListener('keydown', this.handleCaptionsKeydown)
      this.$refs.volume.addEventListener('click', this.handleVolumeMuteClick)
      this.$refs.volume.addEventListener('keydown', this.handleVolumeMuteKeydown)
    },

    removeControllerEventListeners () {
      this.$refs.playpause.removeEventListener('click', this.handlePlayPauseClick)
      this.$refs.playpause.removeEventListener('keydown', this.handlePlayPauseKeydown)
      this.$refs.progress.removeEventListener('input', this.handleProgressInput)
      this.$refs.progress.removeEventListener('change',this.handleProgressChange)
      this.$refs.progress.removeEventListener('mousedown', this.handleProgressMouseDown)
      this.$refs.cc.removeEventListener('click', this.handleCaptionsClick)
      this.$refs.cc.removeEventListener('keydown', this.handleCaptionsKeydown)
      this.$refs.volume.removeEventListener('click', this.handleVolumeMuteClick)
      this.$refs.volume.removeEventListener('keydown', this.handleVolumeMuteKeydown)
    }

  },

  created() {
    this.setVideoSubType(this.detectVideoSubType(this.$vnode.data.staticClass))
  },

  mounted() {
    if (this.isQtiValid) {
      try {
        this.detectMediaInteractionChild()

        this.processChildren()

        // nextTick code will run only after the entire view has been rendered
        this.$nextTick(function() {
          if (this.video) {
            this.video.addEventListener('loadedmetadata', this.handleLoaded)
            this.video.addEventListener('canplay', this.handleCanPlay)
            this.video.addEventListener('timeupdate', this.handleTimeUpdate)
            this.video.addEventListener('ended', this.handleEnded)
            this.addTextTrackCueEventListener()

            // Important:
            // controllerEventListeners are added upon completion of the video's 
            // 'canplay' event
          }
        })

        // Only emit mediaMounted when we are nested inside a Media Interaction.
        if (this.isMediaInteractionChild()) {
          this.$parent.$emit('mediaMounted', { node: this, mediaType: 'video' })
          return
        }

        this.enable()

      } catch (err) {
        this.isQtiValid = false
        throw new QtiValidationException(err.message)
      }
    }
  },

  beforeDestroy () {
    if (this.video) {
      this.video.removeEventListener('loadedmetadata', this.handleLoaded)
      this.video.removeEventListener('canplay', this.handleCanPlay)
      this.video.removeEventListener('timeupdate', this.handleTimeUpdate)
      this.video.removeEventListener('ended', this.handleEnded)
      this.removeTextTrackCueEventListener()
    }
    this.removeControllerEventListeners()
  }
}
</script>

<style>
.amp-video {
  position: relative;
	margin-top:8px;
	margin-top:.5rem;
  margin-bottom:8px;
	margin-bottom:.5rem;
	padding: 0;
}

.amp-video__holder {
  position: relative;
  width: 100%;
  height: 100%;
  font-size: 0;
  line-height: 0;
}

/* Disable right-click */
video.amp-video__video {
  pointer-events: none;
}

.amp-video__container,
.amp-video-captions__container {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  border: 1px solid var(--table-border-color);
  border-bottom-left-radius: 2px;
  border-bottom-right-radius: 2px;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
  width: 100%;
}

.amp-video-captions__container.hidden {
  display: none;
}

.amp-video-playpause__container,
.amp-video-volumemute__container {
  outline: none;
  border: 1px solid transparent;
  background: none;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  cursor: pointer;
}

.amp-video-cc__container {
  outline: none;
  border: 1px solid transparent;
  background: none;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  cursor: pointer;
}


.amp-video-playpause__container.disabled,
.amp-playtimer__container.disabled,
.amp-video-volumemute__container.disabled,
.amp-video-cc__container.disabled {
  pointer-events: none;
  color: var(--well-bg);
}

.amp-video-playpause__container:focus,
.amp-video-volumemute__container:focus,
.amp-video-cc__container:focus
 {
  border: 1px solid transparent;
  border-radius: 2px;
  border-color: var(--choice-focus-border);
}

.amp-playpause-button {
  height: 2.0rem;
  width: 2.0rem;
}

.amp-volumemute-button {
  height: 1.6rem;
  width: 1.6rem;
}

.amp-playtimer__container {
  font-size: .75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 4.0rem;
  height: 2.5rem;
  pointer-events: none;
  margin-right: 0.5rem;
  margin-left: 0.2rem;
  -webkit-user-select: none; /* Safari */
  -moz-user-select: none; /* Firefox */
  -ms-user-select: none; /* IE10+/Edge */
  user-select: none; /* Standard */
}

/* Timer disappears on big zooming */
@media screen and (max-width:576px) {
  .amp-playtimer__container {
    display: none;
  }
}

.amp-progress__container {
  display: flex;
  flex-grow: 1;
  flex-shrink: 1;
  height: 2.5rem;
  border: 1px solid transparent;
}

.amp-video-captions {
  font-size: .8rem;
  display: flex;
  flex-grow: 1;
  flex-shrink: 1;
  flex-wrap: wrap;
  justify-content: flex-start;
  height: 5rem;
  border: 1px solid transparent;
  padding: 0.2rem;
  -webkit-user-select: none; /* Safari */
  -moz-user-select: none; /* Firefox */
  -ms-user-select: none; /* IE10+/Edge */
  user-select: none; /* Standard */
  overflow-y: scroll;
}

input[type=range]{
  -webkit-appearance: none;
  appearance: none;
  cursor: pointer;
  margin-right: 4px;
  width: 100%;
  background: transparent;
}

input[type=range].disabled {
  pointer-events: none;
}

input[type=range]:focus {
  outline: none;
}

input[type=range]::-webkit-slider-runnable-track {
  width: 100%;
  height: 11px;
  background: var(--slider-track);
  border: none;
  border-radius: 10px;
}

input[type=range].disabled::-webkit-slider-runnable-track {
  background: var(--well-bg);
}

input[type=range]:focus::-webkit-slider-runnable-track {
  -webkit-appearance: none;
  appearance: none;
  background: var(--slider-focus-track);
}

input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  border: none;
  height: 15px;
  width: 15px;
  border-radius: 50%;
  background: var(--foreground);
  margin-top: -2.5px;
}

input[type=range].disabled::-webkit-slider-thumb {
  background: var(--well-bg);
}

input[type=range]:focus::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  border: 1px solid var(--well-border);
  background: var(--foreground);
}

input[type=range].disabled:focus::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  border: none;
  background: var(--well-bg);
}

input[type=range].disabled:focus::-webkit-slider-runnable-track {
  background: var(--well-bg);
}

input[type=range]::-moz-range-track {
  width: 100%;
  height: 11px;
  background: var(--slider-track);
  border: none;
  border-radius: 10px;
}

input[type=range]::-moz-range-thumb {
  border: none;
  height: 15px;
  width: 15px;
  border-radius: 50%;
  background: var(--foreground);
}

input[type=range]:focus::-moz-range-thumb {
  border: 1px solid var(--well-border);
  background: var(--foreground);
}

/*hide the outline behind the border*/
input[type=range]:-moz-focusring{
  outline: 1px solid var(--white);
  outline-offset: -1px;
}

input[type=range]:focus::-moz-range-track {
  background: var(--slider-focus-track);
}

input[type=range].disabled::-moz-range-thumb,
input[type=range].disabled::-moz-range-track,
input[type=range].disabled:focus::-moz-range-track {
  background: var(--well-bg);
}

input[type=range]::-ms-track {
  width: 100%;
  height: 5px;
  /*remove bg colour from the track, we'll use ms-fill-lower and ms-fill-upper instead */
  background: transparent;
  /*leave room for the larger thumb to overflow with a transparent border */
  border-color: transparent;
  border-width: 6px 0;
  /*remove default tick marks*/
  color: transparent;
}

input[type=range]::-ms-fill-lower {
  background: #777;
  border-radius: 10px;
}
input[type=range]::-ms-fill-upper {
  background: #ddd;
  border-radius: 10px;
}
input[type=range]::-ms-thumb {
  border: none;
  height: 15px;
  width: 15px;
  border-radius: 50%;
  background: var(--dark);
}
input[type=range]:focus::-ms-fill-lower {
  background: #888;
}
input[type=range]:focus::-ms-fill-upper {
  background: #ddd;
}

/* subtitles menu */
.ampvideo-subtitles-menu {
	display:none;
	position:absolute;
	bottom:14.8%;
	right:20px;
	background: var(--lightgray);
	list-style-type:none;
	margin:0;
	padding:0;
	width:100px;
	padding:10px;
}
.ampvideo-subtitles-menu li {
	padding:0;
	text-align:center;
  margin-bottom: 4px;
}

.ampvideo-subtitles-menu li:last-child {
  margin-bottom: 0;
}

.ampvideo-subtitles-menu li button {
	border:none;
	background:#000;
	color:#fff;
	cursor:pointer;
	width:90%;
	padding:2px 5px;
	-moz-border-radius:2px;
	-webkit-border-radius:2px;
	border-radius:2px;
  font-size: small;
}

.ampvideo-subtitles-menu li button:hover,
.ampvideo-subtitles-menu li button:focus,
.ampvideo-subtitles-menu li button[data-state="active"] {
	opacity:0.5;
}
</style>
