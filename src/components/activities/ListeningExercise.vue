<template>
  <div class="listening-exercise-container">
    <div class="exercise-instruction-block">
      <h3 class="game-instruction">{{ data?.instruction }}</h3>
      <p class="game-translation"><em>Listen carefully and type what you hear.</em></p>
    </div>

    <div class="audio-playback-deck">
      <button 
        class="audio-trigger-btn" 
        :class="{ 'is-playing': isPlaying }" 
        :disabled="isPlaying"
        @click="playAudioTrack"
      >
        <span class="audio-icon-wrapper">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="vector-icon" :class="{ 'pulse-animation': isPlaying }">
            <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.063.922-2.063 2.063v4.875c0 1.141.922 2.062 2.063 2.062h1.932l4.5 4.5c.944.945 2.56.276 2.56-1.06V4.06z" />
            <path v-if="isPlaying" d="M18.5 12c0-2.185-1.143-4.103-2.857-5.183a.75.75 0 00-.786 1.28c1.233.778 2.043 2.155 2.043 3.722a4.391 4.391 0 01-2.043 3.722.75.75 0 00.786 1.28c1.714-1.08 2.857-2.998 2.857-5.183z" />
          </svg>
        </span>
        <span class="btn-audio-label">{{ isPlaying ? 'Playing...' : 'Play audio' }}</span>
      </button>
    </div>

    <div class="transcript-entry-zone">
      <label for="transcript-input" class="input-field-label">Your answer:</label>
      <textarea
        id="transcript-input"
        v-model="userTranscript"
        class="form-control transcript-textarea"
        placeholder="Type exactly what you heard..."
        rows="3"
        :disabled="isPlaying"
      ></textarea>
    </div>

    <div class="exercise-action-panel">
      <button 
        class="btn btn-primary action-submit-btn" 
        :disabled="!userTranscript.trim() || isPlaying" 
        @click="evaluateSubmission"
      >
        Check answer
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, inject } from 'vue'

const props = defineProps({
  data: { type: Object, required: true }
})
const emit = defineEmits(['answered'])
// Provided by ExerciseDashboard from languages.json (e.g. 'pt-BR', 'fr-FR')
const speechLang = inject('speechLang', null)

const userTranscript = ref('')
const isPlaying = ref(false)
let currentUtterance = null

const clearUtteranceListeners = () => {
  if (currentUtterance) {
    currentUtterance.onend = null
    currentUtterance.onerror = null
    currentUtterance = null
  }
}

const stopAudioPlayback = () => {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel()
  }
  clearUtteranceListeners()
  isPlaying.value = false
}

const playAudioTrack = () => {
  if (!props.data?.transcript || isPlaying.value) return

  stopAudioPlayback()
  isPlaying.value = true

  currentUtterance = new SpeechSynthesisUtterance(props.data.transcript)
  currentUtterance.lang = props.data?.audioLang || speechLang?.value || 'en-US'
  currentUtterance.rate = props.data?.playbackRate || 0.85

  currentUtterance.onend = () => {
    isPlaying.value = false
    clearUtteranceListeners()
  }

  currentUtterance.onerror = () => {
    isPlaying.value = false
    clearUtteranceListeners()
  }

  window.speechSynthesis.speak(currentUtterance)
}

// Lowercase, drop punctuation and collapse spaces so "Bom dia, como..." and
// "bom dia como..." compare equal. Accents are kept here on purpose.
const sanitizeText = (str) => {
  return str
    .toLowerCase()
    .replace(/[.,/#!¡?¿$%^&*;:{}=\-_`~()"'«»]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

const evaluateSubmission = () => {
  const cleanInput = sanitizeText(userTranscript.value)
  // The exact transcript plus any variations the deck author accepts
  // (e.g. the same sentence typed without accents).
  const acceptedAnswers = [props.data?.transcript || '', ...(props.data?.acceptedVariations || [])]
    .map(sanitizeText)
    .filter(Boolean)

  emit('answered', {
    exerciseId: props.data.id,
    isCorrect: acceptedAnswers.includes(cleanInput),
    provided: userTranscript.value.trim(),
    expected: props.data?.transcript
  })
}

watch(() => props.data, () => {
  userTranscript.value = ''
  stopAudioPlayback()
}, { deep: true })

onMounted(() => { userTranscript.value = '' })
onBeforeUnmount(stopAudioPlayback)
</script>