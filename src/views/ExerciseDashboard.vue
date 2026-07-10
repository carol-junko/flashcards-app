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

<style scoped>
.engine-workspace-container {
  max-width: 800px;
  margin: 2rem auto;
  padding: 0 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  position: relative;
}

/* Header Session Tracking Styles */
.engine-session-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #ffffff;
  padding: 1.25rem 1.5rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.session-badge {
  display: inline-block;
  font-size: 0.75rem;
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: #3498db;
  background-color: rgba(52, 152, 219, 0.08);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  margin-bottom: 0.25rem;
}

.session-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.session-progress-wrapper {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 40%;
}

.progress-track-rail {
  flex: 1;
  height: 8px;
  background-color: #f1f5f9;
  border-radius: 10px;
  overflow: hidden;
}

.progress-fill-bar {
  height: 100%;
  background-color: #3498db;
  border-radius: 10px;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.progress-numeric-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #64748b;
  white-space: nowrap;
}

/* Viewport Card Mount Bracket */
.engine-viewport-card {
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 2rem;
  min-height: 320px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
}

.engine-empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: #94a3b8;
  font-style: italic;
}

/* Sliding Evaluation Overlay Drawer Layouts */
.evaluation-overlay-drawer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #ffffff;
  box-shadow: 0 -10px 25px -5px rgba(0, 0, 0, 0.08);
  border-top: 1px solid #e2e8f0;
  z-index: 999;
  padding: 1.5rem 0;
}

.drawer-content-box {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.feedback-status-banner {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.status-icon-badge {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
  font-size: 1.25rem;
}

.status-correct .status-icon-badge {
  background-color: rgba(46, 204, 113, 0.12);
  color: #2ecc71;
}

.status-incorrect .status-icon-badge {
  background-color: rgba(231, 76, 60, 0.12);
  color: #e74c3c;
}

.status-text-block h4 {
  margin: 0 0 0.15rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
}

.status-text-block p {
  margin: 0;
  font-size: 0.9rem;
  color: #64748b;
}

.drawer-actions-row {
  display: flex;
  gap: 0.75rem;
}

/* Micro-Transitions CSS rules */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.25s ease-out;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}
</style>