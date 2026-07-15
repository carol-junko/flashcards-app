<template>
  <div class="hub-container">
    
    <!-- Loading Screen -->
    <div v-if="isLoading" class="hub-status loading">
      <div class="spinner"></div>
      <p>Loading your flashcards...</p>
    </div>

    <!-- Error Screen -->
    <div v-else-if="fetchError" class="hub-status error">
      <span>⚠️</span>
      <p>{{ fetchError }}</p>
      <button @click="goBack" class="btn-return-menu">Return to Dashboard</button>
    </div>

    <!-- Main Flashcards Playground -->
    <div v-else class="flashcards-workspace animate-fade-in">
      
      <!-- Top Workspace Tracker Row -->
      <div class="workspace-controls">
        <button @click="goBack" class="btn-return-menu">✕ Close</button>
        
        <!-- Voice Actor Selector Dropdown -->
        <div v-if="availableVoices.length > 0" class="voice-selector-container">
          <label for="voiceSelect">🗣️ Voice:</label>
          <select id="voiceSelect" v-model="selectedVoiceIndex" class="voice-dropdown">
            <option v-for="(voice, idx) in availableVoices" :key="voice.name" :value="idx">
              {{ voice.name }} ({{ voice.lang }})
            </option>
          </select>
        </div>

        <div class="progress-container">
          <div class="progress-text-row">
            <span>Card {{ currentIndex + 1 }} of {{ totalCards }}       </span>
            <span>{{ progressPercent }}% Done</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
          </div>
        </div>
      </div>

      <!-- 3D Interactive Card Matrix -->
      <div class="card-stage">
        <div class="flashcard-perspective" @click="toggleFlip">
          <div class="flashcard-inner" :class="{ 'is-flipped': isFlipped }">
            
            <!-- FRONT FACE PANEL: Displays English First (Pure Reading) -->
            <div class="face front-face">
              <div class="face-header">
                <span class="badge badge-front">English (Prompt)</span>
              </div>
              
              <div class="card-center">
                <h1 class="meaning-display">{{ currentCard?.back }}</h1>
              </div>
              
              <span class="interaction-hint">Tap card interface to reveal Portuguese</span>
            </div>

            <!-- BACK FACE PANEL: Displays Portuguese Translation (Audio Core) -->
            <div class="face back-face">
              <div class="face-header">
                <span class="badge badge-back">Português (Target)</span>
                <!-- Replay option allows endless practice loops -->
                <button 
                  @click.stop="triggerAudioVoice(currentCard?.front || '')" 
                  class="btn-speak-icon"
                >
                  🔊 Ouvir de novo
                </button>
              </div>
              
              <div class="card-center">
                <h1 class="term-display">{{ currentCard?.front }}</h1>
                <p v-if="currentCard?.pronunciation" class="phonetic-display">{{ currentCard.pronunciation }}</p>
                <p v-if="currentCard?.context" class="context-bubble">
                  <strong>Context:</strong> {{ currentCard.context }}
                </p>
              </div>
              
              <span class="interaction-hint">Tap card interface to flip back</span>
            </div>

          </div>
        </div>

        <!-- Lower Navigation Row Controls -->
        <footer class="deck-navigation">
          <button 
            @click="prevCard" 
            :disabled="currentIndex === 0" 
            class="btn-nav-step"
          >
            ← Previous
          </button>
          <button 
            @click="nextCard" 
            :disabled="currentIndex === totalCards - 1" 
            class="btn-nav-step primary-action"
          >
            Next Card →
          </button>
        </footer>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const cards = ref([])
const currentIndex = ref(0)
const isFlipped = ref(false)
const isLoading = ref(true)
const fetchError = ref(null)

// Native Speech Synthesis System Voices
const availableVoices = ref([])
const selectedVoiceIndex = ref(0)

const lang = computed(() => {
  const rawLang = route.params.lang || history.state?.lang || 'br'
  return String(rawLang).toLowerCase()
})

const level = computed(() => {
  const rawLevel = route.params.level || history.state?.level || 'beginner'
  return String(rawLevel).toLowerCase()
})

const deckId = computed(() => route.params.deckId || '')

const currentCard = computed(() => cards.value[currentIndex.value] || null)
const totalCards = computed(() => cards.value.length)

const progressPercent = computed(() => {
  if (!totalCards.value) return 0
  return Math.round(((currentIndex.value + 1) / totalCards.value) * 100)
})

function shuffleDeck(array) {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}

function loadSystemVoices() {
  if ('speechSynthesis' in window) {
    const allVoices = window.speechSynthesis.getVoices()
    
    // Filters to isolate target language options (Portuguese / pt-BR)
    availableVoices.value = allVoices.filter(v => v.lang.startsWith('pt'))
    
    // 👑 Target Luciana explicitly by checking system voice identifiers
    const lucianaIdx = availableVoices.value.findIndex(v => 
      v.name.toLowerCase().includes('luciana')
    )
    
    if (lucianaIdx !== -1) {
      selectedVoiceIndex.value = lucianaIdx
    } else if (availableVoices.value.length > 0) {
      // Fallback to whatever premium pt-BR speaker is active if Luciana isn't installed
      selectedVoiceIndex.value = 0
    }
  }
}

onMounted(async () => {
  try {
    if (!deckId.value) {
      throw new Error("Missing structural identification parameters.")
    }

    const jsonPath = `/data/${lang.value}/${level.value}/${deckId.value}/flashcards.json`
    
    const response = await fetch(jsonPath)
    if (!response.ok) {
      throw new Error(`Could not find resource folder asset layout at destination destination point.`)
    }
    
    const rawData = await response.json()
    cards.value = shuffleDeck(rawData)
    
    loadSystemVoices()
    if ('speechSynthesis' in window && window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadSystemVoices
    }
  } catch (error) {
    console.error("Flashcards system exception:", error)
    fetchError.value = "Unable to process flashcard payload data models."
  } finally {
    isLoading.value = false
  }
})

onBeforeUnmount(() => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
})

function toggleFlip() {
  isFlipped.value = !isFlipped.value
  
  // 💥 Auto-play text execution precisely when flipping over to reveal target language answers
  if (isFlipped.value && currentCard.value) {
    setTimeout(() => {
      triggerAudioVoice(currentCard.value.front)
    }, 280) // 280ms pause coordinates with the mid-point of the 3D rotation flip
  }
}

function nextCard() {
  if (currentIndex.value < totalCards.value - 1) {
    isFlipped.value = false
    setTimeout(() => { currentIndex.value++ }, 150)
  }
}

function prevCard() {
  if (currentIndex.value > 0) {
    isFlipped.value = false
    setTimeout(() => { currentIndex.value-- }, 150)
  }
}

function triggerAudioVoice(text) {
  if (!text) return
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    
    const activeVoice = availableVoices.value[selectedVoiceIndex.value]
    if (activeVoice) {
      utterance.voice = activeVoice
    } else {
      utterance.lang = 'pt-BR'
    }
    
    utterance.rate = 0.82 // Slightly adjusted for beautiful, crisp pronounciation timing
    window.speechSynthesis.speak(utterance)
  }
}

function goBack() {
  router.back()
}
</script>