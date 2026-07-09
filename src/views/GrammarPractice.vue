<script setup>
import { ref, computed } from 'vue'

// Import the sub-exercise components from your local workspace paths
// import ClozeGaps from './exercises/ClozeGaps.vue'
// import SentenceScramble from './exercises/SentenceScramble.vue'
// import MatchTranslation from './exercises/MatchTranslation.vue'
// import ConjugationGrid from './exercises/ConjugationGrid.vue'
// import PrepositionContractor from './exercises/PrepositionContractor.vue'
// import ListeningBridge from './exercises/ListeningBridge.vue'
// import ContextualDialogue from './exercises/ContextualDialogue.vue'

const props = defineProps({
  cards: {
    type: Array,
    required: true
  },
  // Receives an array of 4 exactly matched items based on your custom mix logic
  exerciseMix: {
    type: Array,
    default: () => ['cloze-gaps', 'sentence-scramble', 'preposition-contractor', 'listening-bridge']
  }
})

const emit = defineEmits(['exit'])

const currentStep = ref(0)
const exerciseCompletedStates = ref(new Array(props.exerciseMix.length).fill(false))

const activeExerciseType = computed(() => props.exerciseMix[currentStep.value])
const isLastStep = computed(() => currentStep.value === props.exerciseMix.length - 1)

// Map engine strings to clean labels for the step indicator row
function formatStepLabel(type) {
  const labelMap = {
    'cloze-gaps': 'Fill Gaps',
    'sentence-scramble': 'Syntax Puzzle',
    'match-translation': 'Match Terms',
    'conjugation-grid': 'Verbs Grid',
    'preposition-contractor': 'Contractions',
    'listening-bridge': 'Listening',
    'contextual-dialogue': 'Dialogue'
  }
  return labelMap[type] || 'Exercise'
}

function handleStepComplete(scorePayload) {
  // Mark the individual step complete to light up the progress matrix
  exerciseCompletedStates.value[currentStep.value] = true
}

function advanceStep() {
  if (!isLastStep.value) {
    currentStep.value++
  } else {
    // Session is fully finished! Trigger complete sequence
    alert("Incredible work! You've finalized all structural language drills for this session.")
    emit('exit')
  }
}

function stepBackward() {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}
</script>

<template>
  <div class="grammar-container animate-fade-in">
    
    <!-- Workspace Navigation Bar -->
    <header class="grammar-header">
      <button @click="emit('exit')" class="btn-exit">✕ Leave Drills</button>
      
      <!-- Linear Sequence Tracker Progress Matrix -->
      <nav class="timeline-tracker">
        <div 
          v-for="(exercise, index) in exerciseMix" 
          :key="index"
          class="timeline-node"
          :class="{ 
            'is-active': index === currentStep, 
            'is-past': index < currentStep,
            'is-done': exerciseCompletedStates[index]
          }"
        >
          <div class="node-circle">
            <span v-if="exerciseCompletedStates[index]">✓</span>
            <span v-else>{{ index + 1 }}</span>
          </div>
          <span class="node-label">{{ formatStepLabel(exercise) }}</span>
        </div>
      </nav>
    </header>

    <!-- Main Live Simulation Workspace Frame -->
    <main class="exercise-canvas">
      <Transition name="slide-fade" mode="out-in">
        <!-- Keep-Alive or Key Re-bind to force component updates if data parameters adapt -->
        <div :key="currentStep" class="canvas-inner-wrapper">
          
          <ClozeGaps 
            v-if="activeExerciseType === 'cloze-gaps'" 
            :cards="cards" 
            @complete="handleStepComplete" 
          />
          
          <SentenceScramble 
            v-else-if="activeExerciseType === 'sentence-scramble'" 
            :cards="cards" 
            @complete="handleStepComplete" 
          />
          
          <MatchTranslation 
            v-else-if="activeExerciseType === 'match-translation'" 
            :cards="cards" 
            @complete="handleStepComplete" 
          />
          
          <ConjugationGrid 
            v-else-if="activeExerciseType === 'conjugation-grid'" 
            :cards="cards" 
            @complete="handleStepComplete" 
          />
          
          <PrepositionContractor 
            v-else-if="activeExerciseType === 'preposition-contractor'" 
            :cards="cards" 
            @complete="handleStepComplete" 
          />
          
          <ListeningBridge 
            v-else-if="activeExerciseType === 'listening-bridge'" 
            :cards="cards" 
            @complete="handleStepComplete" 
          />
          
          <ContextualDialogue 
            v-else-if="activeExerciseType === 'contextual-dialogue'" 
            :cards="cards" 
            @complete="handleStepComplete" 
          />
          
        </div>
      </Transition>
    </main>

    <!-- Anchor Control Command Panel -->
    <footer class="control-footer">
      <button 
        @click="stepBackward" 
        :disabled="currentStep === 0" 
        class="btn-footer-nav back"
      >
        ← Previous Drill
      </button>

      <button 
        @click="advanceStep" 
        class="btn-footer-nav primary-forward"
      >
        {{ isLastStep ? 'Finish Session 🏁' : 'Next Drill →' }}
      </button>
    </footer>

  </div>
</template>

<style scoped>
.grammar-container {
  width: 100%;
  background: #f8fafc;
  border-radius: 1.5rem;
  border: 1px solid #e2e8f0;
  padding: 2rem;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.01);
}

.grammar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 1.5rem;
  margin-bottom: 2.5rem;
  gap: 2rem;
}

.btn-exit {
  background: #fff;
  border: 1px solid #cbd5e1;
  color: #64748b;
  padding: 0.6rem 1.2rem;
  border-radius: 0.5rem;
  font-weight: 700;
  cursor: pointer;
  font-size: 0.85rem;
  white-space: nowrap;
  transition: all 0.2s;
}

.btn-exit:hover {
  background: #fee2e2;
  border-color: #fca5a5;
  color: #991b1b;
}

/* Linear Timeline Tracker Matrix Layout */
.timeline-tracker {
  display: flex;
  justify-content: space-between;
  flex-grow: 1;
  max-width: 650px;
  position: relative;
}

/* Base line vector running beneath node circles */
.timeline-tracker::before {
  content: '';
  position: absolute;
  top: 1.25rem;
  left: 10%;
  right: 10%;
  height: 3px;
  background: #e2e8f0;
  z-index: 1;
}

.timeline-node {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.node-circle {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background: white;
  border: 3px solid #e2e8f0;
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

.node-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  transition: color 0.3s ease;
}

/* State Variant Overrides for Timeline Elements */
.timeline-node.is-active .node-circle {
  border-color: #10b981;
  background: #d1fae5;
  color: #065f46;
  transform: scale(1.08);
}

.timeline-node.is-active .node-label {
  color: #0f172a;
}

.timeline-node.is-past .node-circle {
  border-color: #3b82f6;
  background: #eff6ff;
  color: #1d4ed8;
}

.timeline-node.is-done .node-circle {
  background: #10b981;
  border-color: #10b981;
  color: white;
}

/* Central Active Sandbox Area */
.exercise-canvas {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 1.25rem;
  padding: 3rem 2rem;
  min-height: 400px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
}

.canvas-inner-wrapper {
  width: 100%;
}

/* Bottom Control Deck */
.control-footer {
  display: flex;
  justify-content: space-between;
  margin-top: 2.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e2e8f0;
}

.btn-footer-nav {
  padding: 0.85rem 1.75rem;
  border-radius: 0.75rem;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-footer-nav.back {
  background: white;
  border: 1px solid #cbd5e1;
  color: #475569;
}

.btn-footer-nav.back:hover:not(:disabled) {
  background: #f1f5f9;
  border-color: #94a3b8;
}

.btn-footer-nav:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.primary-forward {
  background: #10b981;
  border: 1px solid #10b981;
  color: white;
  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.1);
}

.primary-forward:hover {
  background: #059669;
  border-color: #059669;
  transform: translateY(-1px);
}

/* Transition Animations between active quiz components */
.slide-fade-enter-active {
  transition: all 0.25s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from {
  transform: translateX(15px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateX(-15px);
  opacity: 0;
}

/* Entry utility transitions */
.animate-fade-in {
  animation: fadeIn 0.4s ease-out forwards;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>