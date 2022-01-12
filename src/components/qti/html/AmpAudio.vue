<template>
  <div class="amp-audio">
    <div class="amp-audio__holder">
      <audio
        ref="player"
        tabIndex="-1"
        @ended="handleEnded"
        v-bind="$attrs">
        <slot></slot>
      </audio>
    </div>

    <div class="amp-audio__container">
      <div
        @click="handlePlayPauseClick"
        @keydown="handlePlayPauseKeydown"
        tabIndex="0"
        class="amp-audio-playpause__container">
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
      </div>

      <div class="amp-playtimer__container" v-show="showPlayTimer">
        <span>{{displayCurrentTime}}</span>
        <span> / </span>
        <span>{{displayDuration}}</span>
      </div>

      <div class="amp-progress__container" v-show="showProgress">
        <input
          v-model="currentTime"
          @input="handleProgressInput"
          @change="handleProgressChange"
          @mousedown="handleProgressMouseDown"
          type="range"
          min="0"
          :max="duration"
          class="slider"
        />
      </div>

      <div
        @click="handleVolumeMuteClick"
        @keydown="handleVolumeMuteKeydown"
        tabIndex="0"
        class="amp-audio-volumemute__container" v-show="showVolumeMute">
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
    <!-- For captions -->
    <div class="amp-audio-captions__container hidden">
      <div class="amp-audio-captions" ref="captions">
      </div>
    </div>
  </div>
</template>

<script>
import QtiValidationException from '@/shared/qti/exceptions/QtiValidationException'
import QtiAttributeValidation from '@/shared/qti/validation/QtiAttributeValidation'

const qtiAttributeValidation = new QtiAttributeValidation()

export default {
  name: 'AmpAudio',

  props: {
  },

  inheritAttrs: false,

  data () {
    return {
      audio: null,
      audioSubType: null,
      currentTime: 0,
      duration: 0,
      displayCurrentTime: '00:00',
      displayDuration: '00:00',
      audioLoaded: false,
      isPlaying: false,
      isMuted: false,
      isTimeUpdateListening: true,
      showPlayTimer: false,
      showVolumeMute: false,
      showProgress: false,
      showCaptions: false,
      textTracksMap: null,
      isQtiValid: true
    }
  },

  methods: {

    handleLoaded () {
      if (this.audio) {
        this.duration = Math.round(this.audio.duration)
        this.displayDuration = this.convertTime(this.duration)
      }
    },

    handleEnded () {
      this.isPlaying = false
    },

    handleCanPlay () {
      this.audioLoaded = true
    },

    handleTimeUpdate () {
      if (!this.isTimeUpdateListening) return

      let currTime = Math.round(this.audio.currentTime)
      // Update the progress bar model
      this.currentTime = currTime
      // Update the visible display time
      this.displayCurrentTime = this.convertTime(currTime)
    },

    handlePlayPauseClick () {
      this.toggleAudio()
    },

    handlePlayPauseKeydown (event) {
      let flag = false

      switch (event.code) {
        case 'Space':
        case 'Enter':
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
    },

    handleProgressMouseDown () {
      // Mouse down on the slider we pause the player and
      // suspend the TimeUpdate listener
      this.isTimeUpdateListening = false
      if (!this.audio.paused) {
        this.wasPlaying = true
        this.audio.pause()
        this.isPlaying = false
      } else {
        this.wasPlaying = false
      }
    },

    handleProgressInput (event) {
      // Audio should be paused.  Just update the time.  No setPosition.
      this.displayCurrentTime = this.convertTime(event.target.valueAsNumber)
    },

    handleProgressChange (event) {
      this.setPosition(event.target.valueAsNumber)
      this.isTimeUpdateListening = true

      // Play the audio if it was playing when the progress slider change began.
      if (this.wasPlaying && this.audio.paused) {
        this.wasPlaying = false
        this.toggleAudio()
      }
    },

    handleVolumeMuteClick () {
      this.toggleVolume()
    },

    handleVolumeMuteKeydown (event) {
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

    handleCueChange (event) {
      const cues = event.target.activeCues
      if ((cues.length > 0) && this.showCaptions) {
        const currentCue = cues[0].text.replace(/\n/g, '<br/>')
        console.log('[AmpAudio][currentCue]', currentCue)
        this.$refs.captions.innerHTML = currentCue
      }
    },

    setPosition (position) {
      this.audio.currentTime = position
      this.displayCurrentTime = this.convertTime(position)
    },

    toggleAudio () {
      if (this.audio.paused) {
          this.audio.play()
          this.isPlaying = true
      } else {
          this.audio.pause()
          this.isPlaying = false
      }
    },

    toggleVolume () {
      if (this.audio.muted) {
          this.audio.muted = false
          this.isMuted = false
      } else {
          this.audio.muted = true
          this.isMuted = true
      }
    },

    initSlider () {
      if (this.audio) {
        this.duration = Math.round(this.audio.duration)
      }
    },

    convertTime (seconds) {
      let hhmmss = new Date(seconds * 1000).toISOString().substr(11, 8)
      if (hhmmss.indexOf('00:') === 0) {
        hhmmss = hhmmss.substr(3)
      }
      //return (hhmmss.indexOf('0') === 0) ? hhmmss.substr(1) : hhmmss
      return hhmmss
    },

    getAudioSubType (clazz) {
      if ((clazz === null) || clazz.length == 0) return null

      // Return the first supported audio player subtype we find
      const clazzTokens = clazz.split(' ')
      for (let index = 0; index < clazzTokens.length; index++) {
        switch (clazzTokens[index]) {
          case 'sbaudio':
          case 'audioprogress':
            this.showProgress = true
            this.showPlayTimer = true
            this.showVolumeMute = true
            this.showCaptions = true
            return 'audioprogress'

          default:
        }
      }
      return null
    },

    /**
     * @description attempt to parse the audio subtype
     * from the staticClass property of this $vnode.
     * @param staticClass property of the $vnode.data object
     */
    detectAudioSubType (staticClass) {
      const audioSubType = this.getAudioSubType(staticClass)
      return audioSubType
    },

    /**
     * Iterate through the child nodes
     */
    validateChildren () {
      this.audio = this.$refs.player
      console.log('querySelectorAll(track)', this.audio.querySelectorAll('track'))
      this.textTracksMap = this.filterTextTracks(this.audio.querySelectorAll('track'))
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
      if (this.audio.textTracks.length === 0) return

      this.audio.textTracks.forEach((track) => {
        // captions and subtitles added to textTracksMap during validation
        const trackElement = this.textTracksMap.get(track.id)
        if ((typeof trackElement !== 'undefined') && this.isDefaultTextTrack(trackElement)) {
          track.addEventListener('cuechange', this.handleCueChange)
          return
        }
      }, this)
    },

    removeTextTrackCueEventListener () {
      if (this.audio.textTracks.length === 0) return

      this.audio.textTracks.forEach((track) => {
        // captions and subtitles added to textTracksMap during validation
        const trackElement = this.textTracksMap.get(track.id)
        if ((typeof trackElement !== 'undefined') && this.isDefaultTextTrack(trackElement)) {
          // We found explicit default text track. Remove this listener.
          track.removeEventListener('cuechange', this.handleCueChange)
          return
        }
      }, this)
    }

  },

  created() {
    this.audioSubType = this.detectAudioSubType(this.$vnode.data.staticClass)
  },

  mounted() {
    if (this.isQtiValid) {
      try {
        this.validateChildren()

        // nextTick code will run only after the entire view has been rendered
        this.$nextTick(function() {
          if (this.audio) {
            this.audio.addEventListener('loadedmetadata', this.handleLoaded)
            this.audio.addEventListener('canplay', this.handleCanPlay)
            this.audio.addEventListener('timeupdate', this.handleTimeUpdate)
            this.addTextTrackCueEventListener()
          }
        })

      } catch (err) {
        this.isQtiValid = false
        throw new QtiValidationException(err.message)
      }
    }
  },

  beforeDestroy () {
    if (this.audio) {
      this.audio.removeEventListener('loadedmetadata', this.handleLoaded)
      this.audio.removeEventListener('canplay', this.handleCanPlay)
      this.audio.removeEventListener('timeupdate', this.handleTimeUpdate)
      this.removeTextTrackCueEventListener()
    }
  }
}
</script>

<style scoped>
.amp-audio {
  display: inline-block;
  position: relative;
  --white: #fff;
  --light: #eff2f7;
  --lightgray: #ddd;
  --focusgray: #ccc;
  --gray: #7c8a96;
  --dark: #343a40;
  --primary: #3d8ef8;
  --focusblue: rgba(82, 168, 236, 0.8);
}

.amp-audio__holder {
  position:fixed !important;
  overflow: hidden;
  clip: rect(1px 1px 1px 1px);
  height: 1px;
  width: 1px;
  border: 0;
  margin: -1px;
}

.amp-audio__container,
.amp-audio-captions__container {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  border: 1px solid var(--dark);
  border-radius: 2px;
}

.amp-audio-captions__container.hidden {
  display: none;
}

.amp-audio-playpause__container,
.amp-audio-volumemute__container {
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

.amp-audio-playpause__container:focus,
.amp-audio-volumemute__container:focus {
  border: 1px solid transparent;
  border-radius: 2px;
  border-color: var(--focusblue);
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

.amp-progress__container {
  display: flex;
  flex-grow: 1;
  flex-shrink: 1;
  height: 2.5rem;
  border: 1px solid transparent;
}

.amp-audio-captions {
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
  cursor: pointer;
  margin-right: 4px;
  width: 100%;
}

input[type=range]::-webkit-slider-runnable-track {
  width: 100%;
  height: 11px;
  background: var(--lightgray);
  border: none;
  border-radius: 10px;
}

input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none;
  border: none;
  height: 15px;
  width: 15px;
  border-radius: 50%;
  background: var(--dark);
  margin-top: -2.5px;
}

input[type=range]:focus::-webkit-slider-thumb {
  -webkit-appearance: none;
  border: 1px solid var(--dark);
  background: var(--primary);
}

input[type=range]:focus {
  outline: none;
}

input[type=range]:focus::-webkit-slider-runnable-track {
  background: var(--focusgray);
}

input[type=range]::-moz-range-track {
  width: 100%;
  height: 11px;
  background: var(--lightgray);
  border: none;
  border-radius: 10px;
}

input[type=range]::-moz-range-thumb {
  border: none;
  height: 15px;
  width: 15px;
  border-radius: 50%;
  background: var(--dark);
}

input[type=range]:focus::-moz-range-thumb {
  border: 1px solid var(--dark);
  background: var(--primary);
}

/*hide the outline behind the border*/
input[type=range]:-moz-focusring{
  outline: 1px solid var(--white);
  outline-offset: -1px;
}

input[type=range]:focus::-moz-range-track {
  background: var(--focusgray);
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
</style>
