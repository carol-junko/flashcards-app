<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

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

// State management variables
const activeIndex = ref(0)
const evaluationReview = ref(null)
const exerciseFleet = ref([])
const isLoading = ref(true)
const errorMessage = ref(null)

// Map routing parameters to build our dynamic public path structure
const deckId = computed(() => route.params.deckId)
const lang = computed(() => history.state?.lang || 'br')
const level = computed(() => history.state?.level || 'beginner')

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

// Asynchronous Data Fetching Initialization
onMounted(async () => {
  const targetPath = `/data/${lang.value}/${level.value}/${deckId.value}/exercises.json`
  try {
    isLoading.value = true
    errorMessage.value = null
    
    const response = await fetch(targetPath)
    if (!response.ok) {
      throw new Error(`Não foi possível carregar os exercícios (${response.status})`)
    }
    
    const data = await response.json()
    exerciseFleet.value = Array.isArray(data) ? data : data.exercises || []
  } catch (error) {
    console.error('Falha ao processar arquivo JSON:', error)
    errorMessage.value = 'Houve um problema ao processar seu módulo de exercícios. Verifique o caminho do arquivo.'
  } finally {
    isLoading.value = false
  }
})

// Computed System Metrics
const totalExercises = computed(() => exerciseFleet.value.length)
const currentExercise = computed(() => exerciseFleet.value[activeIndex.value] || null)
const isLastExercise = computed(() => activeIndex.value >= totalExercises.value - 1)
const completionPercentage = computed(() => {
  if (totalExercises.value === 0) return 0
  return (activeIndex.value / totalExercises.value) * 100
})

const resolveActiveExerciseComponent = computed(() => {
  if (!currentExercise.value) return null
  return componentMapping[currentExercise.value.type] || null
})

// Business Event Handlers
const handleExerciseCompleted = (evaluationPayload) => {
  evaluationReview.value = evaluationPayload
}

const clearEvaluationReview = () => {
  evaluationReview.value = null
}

const advanceToNextExercise = () => {
  clearEvaluationReview()
  if (!isLastExercise.value) {
    activeIndex.value++
  } else {
    alert('Parabéns! Você completou todos os exercícios da trilha corrente.')
    activeIndex.value = 0 
  }
}


</script>

<template>
  <div class="engine-workspace-container">
    <!-- Session Global Header & Tracking Metrics -->
    <header class="engine-session-header">
      <div class="session-meta-info">
        <span class="session-badge">Sessão Ativa</span>
        <h2 class="session-title">Progresso do Módulo</h2>
      </div>
      
      <!-- Progress Bar Tracker -->
      <div class="session-progress-wrapper" v-if="!isLoading && totalExercises > 0">
        <div class="progress-track-rail">
          <div 
            class="progress-fill-bar" 
            :style="{ width: `${completionPercentage}%` }"
          ></div>
        </div>
        <span class="progress-numeric-label">
          {{ activeIndex + 1 }} de {{ totalExercises }}
        </span>
      </div>
    </header>

    <!-- Component Dynamic Mount Pipeline Zone -->
    <main class="engine-viewport-card">
      <!-- Loading State UI -->
      <div v-if="isLoading" class="engine-loading-state">
        <p>Carregando trilha de exercícios...</p>
      </div>

      <!-- Error State UI -->
      <div v-else-if="errorMessage" class="engine-error-state">
        <p>{{ errorMessage }}</p>
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
        Nenhum exercício encontrado para esta unidade.
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
              <h4>{{ evaluationReview.isCorrect ? 'Excelente Trabalho!' : 'Não desanime!' }}</h4>
              <p>{{ evaluationReview.isCorrect ? 'Resposta correta.' : 'Há alguns erros para revisar.' }}</p>
            </div>
          </div>

          <!-- Action Control Routing Row -->
          <div class="drawer-actions-row">
            <button class="btn btn-secondary close-drawer-btn" @click="clearEvaluationReview">
              Revisar Estrutura
            </button>
            <button class="btn btn-primary advance-session-btn" @click="advanceToNextExercise">
              {{ isLastExercise ? 'Finalizar Sessão' : 'Próximo Exercício' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

