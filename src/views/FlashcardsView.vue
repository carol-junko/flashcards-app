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

    <!-- Nothing to study right now (or session finished) -->
    <div v-else-if="!currentCard" class="srs-done-panel animate-fade-in">
      <div class="srs-done-icon">{{ reviewedCount ? '🎉' : '✅' }}</div>
      <h2>{{ reviewedCount ? 'Session complete!' : 'All caught up!' }}</h2>

      <p v-if="reviewedCount" class="srs-done-summary">
        You reviewed <strong>{{ reviewedCount }}</strong> card{{ reviewedCount === 1 ? '' : 's' }}
        and remembered <strong>{{ recallPercent }}%</strong> on the first try.
      </p>

      <ul class="srs-stats-row">
        <li><strong>{{ stats.mastered }}</strong> mastered</li>
        <li><strong>{{ stats.seen - stats.mastered }}</strong> learning</li>
        <li><strong>{{ stats.unseen }}</strong> not started</li>
      </ul>

      <p class="srs-next-due">
        <template v-if="stats.unseen && !stats.newToday">
          You've reached today's {{ NEW_CARDS_PER_DAY }} new cards. Come back tomorrow for more.<br />
        </template>
        <template v-if="stats.nextDue">Next review: <strong>{{ formatWhen(stats.nextDue) }}</strong></template>
      </p>

      <div class="srs-done-actions">
        <button class="btn btn-secondary" @click="goBack">Back to deck</button>
        <button v-if="stats.seen" class="btn btn-primary" @click="startSession(true)">
          Review all {{ cards.length }} cards anyway
        </button>
      </div>
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
            <span>{{ queue.length }} left in this session</span>
            <span class="srs-card-tag" :class="isNewCard ? 'tag-new' : 'tag-review'">
              {{ isNewCard ? 'New card' : 'Review' }}
            </span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
          </div>
        </div>
      </div>

      <!-- 3D Interactive Card Matrix -->
      <div class="card-stage">
        <div
          class="flashcard-perspective"
          role="button"
          tabindex="0"
          :aria-label="isFlipped ? 'Show the English side' : 'Reveal the answer'"
          @click="toggleFlip"
        >
          <div class="flashcard-inner" :class="{ 'is-flipped': isFlipped }">

            <!-- FRONT FACE PANEL: English prompt — the learner recalls the target language -->
            <div class="face front-face">
              <div class="face-header">
                <span class="badge badge-front">English (Prompt)</span>
              </div>

              <div class="card-center">
                <h1 class="meaning-display">{{ currentCard.back }}</h1>
              </div>

              <span class="interaction-hint">Say it out loud, then tap (or press Space) to check</span>
            </div>

            <!-- BACK FACE PANEL: target-language side, read aloud on flip -->
            <div class="face back-face">
              <div class="face-header">
                <span class="badge badge-back">{{ language?.nativeName || 'Target' }}</span>
                <button @click.stop="triggerAudioVoice(currentCard.front)" class="btn-speak-icon">
                  🔊 Play again
                </button>
              </div>

              <div class="card-center">
                <h1 class="term-display">{{ currentCard.front }}</h1>
                <p v-if="currentCard.pronunciation" class="phonetic-display">{{ currentCard.pronunciation }}</p>
                <p v-if="currentCard.context" class="context-bubble">
                  <strong>Context:</strong> {{ currentCard.context }}
                </p>
              </div>

              <span class="interaction-hint">How well did you remember it?</span>
            </div>

          </div>
        </div>

        <!-- Before the flip: one big button. After: the four FSRS ratings. -->
        <footer class="deck-navigation">
          <button v-if="!isFlipped" class="btn-nav-step primary-action" @click="toggleFlip">
            Show answer <kbd>Space</kbd>
          </button>
          <template v-else>
            <button
              v-for="rating in RATINGS"
              :key="rating.value"
              class="btn-nav-step srs-rate-btn"
              :class="`rate-${rating.label.toLowerCase()}`"
              @click="rate(rating.value)"
            >
              <span class="rate-label">{{ rating.label }}</span>
              <span class="rate-interval">{{ intervals[rating.value] }}</span>
              <kbd>{{ rating.key }}</kbd>
            </button>
          </template>
        </footer>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { deckDataPath } from '@/utils/deckPaths'
import { getLanguage, pickVoices } from '@/utils/languages'
import { OFFLINE_DECK_MESSAGE } from '@/utils/offline'
import {
  RATINGS, Rating, NEW_CARDS_PER_DAY, createProgressStore,
  buildQueue, reviewCard, previewIntervals, deckStats,
} from '@/utils/srs'

const route = useRoute()
const router = useRouter()
const store = createProgressStore()

const cards = ref([])          // every card in the deck
const progress = ref({})       // cardId -> FSRS memory state (from localStorage)
const queue = ref([])          // cards still to study in this session
const isFlipped = ref(false)
const isLoading = ref(true)
const fetchError = ref(null)
const language = ref(null)     // entry from languages.json (name, speechLang, preferredVoice)
const reviewedCount = ref(0)   // answers given this session
const firstTryRecalled = ref(0)
const sessionSize = ref(0)
const seenThisSession = new Set()
const now = ref(new Date())

// Native Speech Synthesis System Voices
const availableVoices = ref([])
const selectedVoiceIndex = ref(0)

const deckId = computed(() => route.params.deckId || '')
const deckKey = computed(() => `${route.params.langId}/${deckId.value}`)
const currentCard = computed(() => queue.value[0] || null)
const isNewCard = computed(() => currentCard.value && !progress.value[currentCard.value.id])
const intervals = computed(() =>
  currentCard.value ? previewIntervals(progress.value[currentCard.value.id], now.value) : {}
)
const stats = computed(() => deckStats(progress.value, cards.value.length, now.value))
const recallPercent = computed(() =>
  reviewedCount.value ? Math.round((firstTryRecalled.value / seenThisSession.size) * 100) : 0
)
const progressPercent = computed(() => {
  if (!sessionSize.value) return 0
  return Math.round((1 - queue.value.length / sessionSize.value) * 100)
})

function shuffleDeck(array) {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}

function startSession(reviewAll = false) {
  now.value = new Date()
  progress.value = store.getDeck(deckKey.value)
  // "Review all" is extra practice: every card, in random order
  queue.value = reviewAll ? shuffleDeck(cards.value) : buildQueue(cards.value, progress.value, now.value)
  sessionSize.value = queue.value.length
  reviewedCount.value = 0
  firstTryRecalled.value = 0
  seenThisSession.clear()
  isFlipped.value = false
}

function rate(rating) {
  const card = currentCard.value
  if (!card || !isFlipped.value) return

  now.value = new Date()
  const updated = reviewCard(progress.value[card.id], rating, now.value)
  progress.value = { ...progress.value, [card.id]: updated }
  store.saveCard(deckKey.value, card.id, updated)

  reviewedCount.value++
  if (!seenThisSession.has(card.id)) {
    seenThisSession.add(card.id)
    if (rating !== Rating.Again) firstTryRecalled.value++
  }

  isFlipped.value = false
  const rest = queue.value.slice(1)
  // Cards in short-term learning (due within ~20 minutes) come back later in this
  // same session; everything else waits for its scheduled day.
  const comesBackSoon = updated.due - now.value < 20 * 60 * 1000
  setTimeout(() => {
    queue.value = comesBackSoon ? [...rest, card] : rest
  }, 150)
}

function loadSystemVoices() {
  if ('speechSynthesis' in window) {
    if (!language.value) return
    // Best voices for this language come first (preferred voice, then exact locale)
    availableVoices.value = pickVoices(
      window.speechSynthesis.getVoices(),
      language.value.speechLang,
      language.value.preferredVoice
    )
    selectedVoiceIndex.value = 0
  }
}

function onKeydown(event) {
  if (!currentCard.value || event.target.closest('select, input, textarea')) return
  if (event.code === 'Space' || event.key === 'Enter') {
    event.preventDefault()
    if (!isFlipped.value) toggleFlip()
    return
  }
  const rating = RATINGS.find((r) => r.key === event.key)
  if (rating && isFlipped.value) rate(rating.value)
}

onMounted(async () => {
  try {
    if (!deckId.value) {
      throw new Error("Missing structural identification parameters.")
    }

    language.value = await getLanguage(route.params.langId)
    const jsonPath = `${deckDataPath(route.params.langId, deckId.value)}/flashcards.json`

    const response = await fetch(jsonPath)
    if (!response.ok) {
      throw new Error(`Could not find resource folder asset layout at destination destination point.`)
    }

    cards.value = await response.json()
    startSession()

    loadSystemVoices()
    if ('speechSynthesis' in window && window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadSystemVoices
    }
  } catch (error) {
    console.error("Flashcards system exception:", error)
    fetchError.value = navigator.onLine ? "Unable to load this deck's flashcards." : OFFLINE_DECK_MESSAGE
  } finally {
    isLoading.value = false
  }
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
})

function toggleFlip() {
  isFlipped.value = !isFlipped.value

  // Auto-play the target language when the answer is revealed
  if (isFlipped.value && currentCard.value) {
    const text = currentCard.value.front
    setTimeout(() => triggerAudioVoice(text), 280) // mid-point of the 3D flip
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
      utterance.lang = language.value?.speechLang || 'en-US'
    }

    utterance.rate = 0.82 // a little slower than normal speech, for learners
    window.speechSynthesis.speak(utterance)
  }
}

function formatWhen(date) {
  const ms = date - now.value
  if (ms < 60 * 60 * 1000) return `in ${Math.max(1, Math.round(ms / 60000))} minutes`
  if (ms < 24 * 60 * 60 * 1000) return `in ${Math.round(ms / 3600000)} hours`
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })
}

function goBack() {
  router.push({ name: 'ExerciseHub', params: { langId: route.params.langId, deckId: deckId.value } })
}
</script>
