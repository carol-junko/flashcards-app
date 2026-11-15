<script setup>
import { ref, computed, onMounted, provide } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getLanguage } from '@/utils/languages'
import { loadExercises } from '@/utils/exercises'

// 1. Import the complete fleet of 8 gamified components
import ClozeExercise from '@/components/activities/ClozeExercise.vue'
import ScrambleExercise from '@/components/activities/ScrambleExercise.vue'
import MatchExercise from '@/components/activities/MatchExercise.vue'
import ConjugationExercise from '@/components/activities/ConjugationExercise.vue'
import PrepositionExercise from '@/components/activities/PrepositionExercise.vue'
import ListeningExercise from '@/components/activities/ListeningExercise.vue'
import DialogueExercise from '@/components/activities/DialogueExercise.vue'
import NounArticleExercise from '@/components/activities/NounArticleExercise.vue'

const route = useRoute()
const router = useRouter()

// State management variables
const activeIndex = ref(0)
const evaluationReview = ref(null)
const exerciseFleet = ref([])
const isLoading = ref(true)
const errorMessage = ref(null)
const isFinished = ref(false)
// First answer per exercise counts for the score; retries are for learning
const firstAttempts = ref({}) // exerciseId -> { isCorrect, correctAnswer, instruction }

const deckId = computed(() => route.params.deckId)

// Exercises that speak (listening) read the voice language from here
const speechLang = ref(null)
provide('speechLang', speechLang)

// 2. Comprehensive Component Mapping Registry
const componentMapping = {
  cloze: ClozeExercise,
  scramble: ScrambleExercise,
  match: MatchExercise,
  conjugation: ConjugationExercise,
  preposition: PrepositionExercise,
  listening: ListeningExercise,
  dialogue: DialogueExercise,
  nounArticle: NounArticleExercise
}

async function loadSession() {
  isLoading.value = true
  errorMessage.value = null
  try {
    const [language, exercises] = await Promise.all([
      getLanguage(route.params.langId).catch(() => null),
      loadExercises(route.params.langId, deckId.value),
    ])
    speechLang.value = language?.speechLang || null
    // Skip any exercise type this version of the app doesn't know
    exerciseFleet.value = exercises.filter((ex) => componentMapping[ex.type])
  } catch (error) {
    console.error('Failed to load exercises:', error)
    errorMessage.value = 'Something went wrong while loading the exercises for this deck.'
  } finally {
    isLoading.value = false
  }
}

onMounted(loadSession)

// Computed System Metrics
const totalExercises = computed(() => exerciseFleet.value.length)
const currentExercise = computed(() => exerciseFleet.value[activeIndex.value] || null)
const isLastExercise = computed(() => activeIndex.value >= totalExercises.value - 1)
const completionPercentage = computed(() => {
  if (totalExercises.value === 0) return 0
  const done = activeIndex.value + (evaluationReview.value ? 1 : 0)
  return (done / totalExercises.value) * 100
})
const score = computed(() => Object.values(firstAttempts.value).filter((a) => a.isCorrect).length)
const missed = computed(() => Object.values(firstAttempts.value).filter((a) => !a.isCorrect))

const resolveActiveExerciseComponent = computed(() => {
  if (!currentExercise.value) return null
  return componentMapping[currentExercise.value.type] || null
})

// Business Event Handlers
const handleExerciseCompleted = (evaluationPayload) => {
  evaluationReview.value = evaluationPayload
  const id = currentExercise.value.id
  if (!firstAttempts.value[id]) {
    firstAttempts.value[id] = {
      isCorrect: evaluationPayload.isCorrect,
      correctAnswer: evaluationPayload.correctAnswer,
      instruction: currentExercise.value.payload?.instruction,
    }
  }
}

const clearEvaluationReview = () => {
  evaluationReview.value = null
}

const advanceToNextExercise = () => {
  clearEvaluationReview()
  if (!isLastExercise.value) {
    activeIndex.value++
  } else {
    isFinished.value = true
  }
}

const restartSession = () => {
  activeIndex.value = 0
  firstAttempts.value = {}
  isFinished.value = false
  clearEvaluationReview()
}

const goBack = () => {
  router.push({ name: 'ExerciseHub', params: { langId: route.params.langId, deckId: deckId.value } })
}
</script>

<template>
  <div class="engine-workspace-container">
    <!-- Session Global Header & Tracking Metrics -->
    <header class="engine-session-header">
      <div class="session-meta-info">
        <button class="btn-return-menu" @click="goBack">✕ Close</button>
        <h2 class="session-title">Activities</h2>
      </div>

      <!-- Progress Bar Tracker -->
      <div class="session-progress-wrapper" v-if="!isLoading && totalExercises > 0 && !isFinished">
        <div class="progress-track-rail">
          <div
            class="progress-fill-bar"
            :style="{ width: `${completionPercentage}%` }"
          ></div>
        </div>
        <span class="progress-numeric-label">
          {{ activeIndex + 1 }} of {{ totalExercises }}
        </span>
      </div>
    </header>

    <!-- Component Dynamic Mount Pipeline Zone -->
    <main class="engine-viewport-card">
      <!-- Loading State UI -->
      <div v-if="isLoading" class="engine-loading-state">
        <p>Loading exercises...</p>
      </div>

      <!-- Error State UI -->
      <div v-else-if="errorMessage" class="engine-error-state">
        <p>{{ errorMessage }}</p>
        <button class="btn btn-secondary" @click="loadSession">Try again</button>
      </div>

      <!-- End-of-session summary -->
      <div v-else-if="isFinished" class="exercise-summary">
        <div class="srs-done-icon">{{ score === totalExercises ? '🏆' : '🎯' }}</div>
        <h3>{{ score }} / {{ totalExercises }} correct on the first try</h3>
        <p v-if="!missed.length">Perfect round. Great work!</p>
        <template v-else>
          <p>Worth another look:</p>
          <ul class="missed-list">
            <li v-for="(item, idx) in missed" :key="idx">
              <span class="missed-instruction">{{ item.instruction }}</span>
              <strong>{{ item.correctAnswer }}</strong>
            </li>
          </ul>
        </template>
        <div class="srs-done-actions">
          <button class="btn btn-secondary" @click="goBack">Back to deck</button>
          <button class="btn btn-primary" @click="restartSession">Practice again</button>
        </div>
      </div>

      <!-- Active Exercise Component -->
      <component
        :is="resolveActiveExerciseComponent"
        v-else-if="currentExercise"
        :key="currentExercise.id"
        :data="currentExercise.payload"
        @answered="handleExerciseCompleted"
      />

      <div v-else class="engine-empty-state">
        <p>This deck has no activities yet.</p>
        <button class="btn btn-secondary" @click="goBack">Back to deck</button>
      </div>
    </main>

    <!-- Evaluation Review Overlay Drawer -->
    <Transition name="slide-up">
      <div v-if="evaluationReview" class="evaluation-overlay-drawer">
        <div class="drawer-content-box">
          <div
            class="feedback-status-banner"
            :class="evaluationReview.isCorrect ? 'status-correct' : 'status-incorrect'"
          >
            <span class="status-icon-badge">
              {{ evaluationReview.isCorrect ? '✓' : '✗' }}
            </span>
            <div class="status-text-block">
              <h4>{{ evaluationReview.isCorrect ? 'Well done!' : 'Not quite.' }}</h4>
              <p v-if="!evaluationReview.isCorrect && evaluationReview.correctAnswer" class="feedback-correct-answer">
                Correct answer: <strong>{{ evaluationReview.correctAnswer }}</strong>
              </p>
              <p v-else-if="evaluationReview.isCorrect">That's correct.</p>
              <p v-if="evaluationReview.feedback" class="feedback-explanation">{{ evaluationReview.feedback }}</p>
            </div>
          </div>

          <!-- Action Control Routing Row -->
          <div class="drawer-actions-row">
            <button
              v-if="!evaluationReview.isCorrect"
              class="btn btn-secondary close-drawer-btn"
              @click="clearEvaluationReview"
            >
              Try again
            </button>
            <button class="btn btn-primary advance-session-btn" @click="advanceToNextExercise">
              {{ isLastExercise ? 'See results' : 'Next exercise' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>
