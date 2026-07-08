<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const deckId = route.params.deckId || 'greetings-beginner'

// State Engines
const exercises = ref([])
const currentIndex = ref(0)
const loading = ref(true)
const isChecked = ref(false)
const score = ref(0)
const isFinished = ref(false)

// Drag and Drop / Selection States
const draggedItem = ref(null)
const selectedAnswer = ref(null)          // Used for Cloze, Conjugation, Gender, Contraction, Dialogue
const workspacePool = ref([])             // Used for Scramble & Listening
const matchedPairs = ref({})              // Used for Matching game: { portugueseKey: englishValue }
const selectedMatchKey = ref(null)       // Tapping fallback for matching

const currentEx = computed(() => exercises.value[currentIndex.value] || null)

// Fetch Data dynamic hook
onMounted(async () => {
  try {
    const res = await fetch(`/data/${deckId}.json`)
    const data = await res.json()
    exercises.value = data.exercises
    initExercise()
  } catch (err) {
    console.error("Error loading exercises profiles:", err)
  } finally {
    loading.value = false
  }
})

function initExercise() {
  isChecked.value = false
  selectedAnswer.value = null
  draggedItem.value = null
  selectedMatchKey.value = null
  
  if (!currentEx.value) return

  if (currentEx.value.type === 'scramble' || currentEx.value.type === 'listening') {
    workspacePool.value = []
  } else if (currentEx.value.type === 'matching') {
    matchedPairs.value = {}
  }
}

// --- Drag & Drop Event Routing Handlers ---
function onDragStart(item, index, source = 'pool') {
  draggedItem.value = { item, index, source }
}

function onDragOver(e) {
  e.preventDefault() // Required to allow drop target zone landing
}

function handleDropOnTarget(targetType) {
  if (isChecked.value || !draggedItem.value) return
  
  const { item, index, source } = draggedItem.value

  if (targetType === 'cloze-slot') {
    selectedAnswer.value = item
  } else if (targetType === 'workspace' && source === 'pool') {
    workspacePool.value.push(item)
    // If it's a scramble, choices is static; if listening, it acts dynamically
    if (currentEx.value.type === 'scramble') {
      currentEx.value.choices.splice(index, 1)
    }
  }
  draggedItem.value = null
}

function handleMatchDrop(englishWord) {
  if (isChecked.value || !draggedItem.value) return
  const { item } = draggedItem.value // item is the Portuguese word
  matchedPairs.value[item] = englishWord
  draggedItem.value = null
}

// --- Tapping Fallback Handlers (Mobile Friendly) ---
function handleChoiceTap(choice, index) {
  if (isChecked.value) return
  
  if (currentEx.value.type === 'scramble' || currentEx.value.type === 'listening') {
    workspacePool.value.push(choice)
  } else {
    selectedAnswer.value = choice
  }
}

function clearWorkspaceWord(word, index) {
  if (isChecked.value) return
  workspacePool.value.splice(index, 1)
  if (currentEx.value.type === 'scramble') {
    currentEx.value.choices.push(word)
  }
}

function tapMatchKey(ptWord) {
  if (isChecked.value) return
  selectedMatchKey.value = ptWord
}

function tapMatchTarget(enWord) {
  if (isChecked.value || !selectedMatchKey.value) return
  matchedPairs.value[selectedMatchKey.value] = enWord
  selectedMatchKey.value = null
}

// --- Text-To-Speech (TTS) Engine ---
function playAudioPrompt(text) {
  if (!text) return
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'pt-BR'
  window.speechSynthesis.speak(utterance)
}

// --- Answer Verification Suite ---
const isCurrentCorrect = ref(false)

function checkAnswer() {
  if (isChecked.value) return
  isChecked.value = true
  let correct = false

  const type = currentEx.value.type
  if (['cloze', 'conjugation', 'gender', 'contraction', 'dialogue'].includes(type)) {
    correct = selectedAnswer.value === currentEx.value.correctAnswer
  } else if (type === 'scramble' || type === 'listening') {
    correct = workspacePool.value.join(' ').trim() === currentEx.value.correctAnswer.trim()
  } else if (type === 'matching') {
    correct = Object.entries(currentEx.value.pairs).every(([pt, en]) => matchedPairs.value[pt] === en)
  }

  isCurrentCorrect.value = correct
  if (correct) score.value++
}

function advanceNext() {
  if (currentIndex.value < exercises.value.length - 1) {
    currentIndex.value++
    initExercise()
  } else {
    isFinished.value = true
    saveToStorage()
  }
}

function saveToStorage() {
  const finalPercentage = Math.round((score.value / exercises.value.length) * 100)
  const record = localStorage.getItem(`prolingua_progress_${deckId}`)
  const profile = record ? JSON.parse(record) : { flashcardScore: 0 }
  profile.grammarScore = finalPercentage
  localStorage.setItem(`prolingua_progress_${deckId}`, JSON.stringify(profile))
}
</script>

<template>
  <div class="exercise-view-wrapper">
    <div v-if="loading" class="state-msg">Loading comprehensive exercise deck profile...</div>
    
    <div v-else-if="!isFinished" class="game-frame">
      <!-- Upper Stat Bar -->
      <div class="stat-bar">
        <button @click="router.push(`/hub/${deckId}`)" class="quit-trigger">✕ Exit</button>
        <span class="progress-step">Exercise {{ currentIndex + 1 }} of {{ exercises.length }}</span>
      </div>

      <h3 class="instruction-header">{{ currentEx.instruction }}</h3>

      <!-- DYNAMIC EXERCISE TYPE ENGINE ROUTER PLUGINS -->
      <div class="interaction-sandbox">
        
        <!-- TYPE 1, 5, 6: GAP MATCHING (CLOZE / GENDER / CONTRACTION) -->
        <div v-if="['cloze', 'gender', 'contraction'].includes(currentEx.type)" class="cloze-box">
          <div class="sentence-row">
            <span v-for="word in currentEx.prompt.split('___')" :key="word">
              {{ word }}
              <span 
                v-if="word !== currentEx.prompt.split('___').pop()"
                class="drop-target-slot"
                :class="{ filled: selectedAnswer }"
                @dragover="onDragOver"
                @drop="handleDropOnTarget('cloze-slot')"
              >
                {{ selectedAnswer || 'Drop here' }}
              </span>
            </span>
          </div>
        </div>

        <!-- TYPE 2 & 7: SCRAMBLE & LISTENING PUZZLES -->
        <div v-if="['scramble', 'listening'].includes(currentEx.type)" class="scramble-box">
          <div v-if="currentEx.type === 'listening'" class="audio-trigger-row">
            <button @click="playAudioPrompt(currentEx.audioText)" class="audio-btn">🔊 Play Voice Audio</button>
          </div>
          
          <div class="drop-target-slot active-tray" @dragover="onDragOver" @drop="handleDropOnTarget('workspace')">
            <span v-if="workspacePool.length === 0" class="empty-tip">Drag words here...</span>
            <button v-for="(word, i) in workspacePool" :key="i" class="word-chip built-chip" @click="clearWorkspaceWord(word, i)">
              {{ word }} ✕
            </button>
          </div>
        </div>

        <!-- TYPE 3: DRAG TO TRANSLATION MATCHING -->
        <div v-if="currentEx.type === 'matching'" class="matching-box">
          <div class="matching-grid">
            <div class="column-keys">
              <button 
                v-for="(en, pt) in currentEx.pairs" 
                :key="pt" 
                draggable="true"
                @dragstart="onDragStart(pt, 0, 'match-key')"
                class="word-chip match-key-chip"
                :class="{ activeSelection: selectedMatchKey === pt, linked: matchedPairs[pt] }"
                @click="tapMatchKey(pt)"
              >
                {{ pt }} {{ matchedPairs[pt] ? '✓' : '⋮⋮' }}
              </button>
            </div>
            <div class="column-targets">
              <div 
                v-for="(en, pt) in currentEx.pairs" 
                :key="en"
                class="matching-target-row"
                @dragover="onDragOver"
                @drop="handleMatchDrop(en)"
                @click="tapMatchTarget(en)"
              >
                <span class="target-label">{{ en }}</span>
                <span class="dropped-binding-value">
                  {{ Object.keys(matchedPairs).find(k => matchedPairs[k] === en) || 'Drop Match' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- TYPE 4 & 8: SELECTION BLOCKS (CONJUGATION & DIALOGUE) -->
        <div v-if="['conjugation', 'dialogue'].includes(currentEx.type)" class="selection-box">
          <p v-if="currentEx.setup" class="setup-context">{{ currentEx.setup }}</p>
          <div class="options-vertical-stack">
            <button 
              v-for="choice in currentEx.choices" 
              :key="choice" 
              class="choice-row-btn"
              :class="{ selected: selectedAnswer === choice }"
              @click="handleChoiceTap(choice)"
            >
              {{ choice }}
            </button>
          </div>
        </div>

        <!-- GENERAL INTERACTIVE POOL (For Dragging chips if not matching/selection) -->
        <div v-if="!['matching', 'conjugation', 'dialogue'].includes(currentEx.type)" class="choices-pool-wrapper">
          <p class="help-text-label">Drag elements above or tap to answer:</p>
          <div class="pool-chips-row">
            <button 
              v-for="(choice, idx) in currentEx.choices" 
              :key="idx"
              draggable="true"
              @dragstart="onDragStart(choice, idx, 'pool')"
              class="word-chip"
              @click="handleChoiceTap(choice, idx)"
            >
              {{ choice }}
            </button>
          </div>
        </div>

      </div>

      <!-- FEEDBACK CONTROLLER SYSTEM -->
      <div v-if="isChecked" class="feedback-toast" :class="isCurrentCorrect ? 'valid-state' : 'invalid-state'">
        <h4>{{ isCurrentCorrect ? '🎉 Correct!' : '❌ Let\'s check that one' }}</h4>
        <p class="correct-reveal-line" v-if="!isCurrentCorrect"><strong>Correct Answer:</strong> {{ currentEx.correctAnswer }}</p>
        <p class="explanation-p">{{ currentEx.explanation }}</p>
      </div>

      <!-- FOOTER COMMAND LINE ACTIONS -->
      <div class="footer-actions">
        <button v-if="!isChecked" @click="checkAnswer" class="action-btn-main black-btn">Verify Answer</button>
        <button v-else @click="advanceNext" class="action-btn-main green-btn">Next Step →</button>
      </div>
    </div>

    <!-- GAME OVER DISPLAY OVERLAY -->
    <div v-else class="game-over-card">
      <span class="badge-icon">🎖️</span>
      <h2>Session Completed!</h2>
      <div class="score-breakdown-row">
        You correctly answered <strong>{{ score }}</strong> out of <strong>{{ exercises.length }}</strong> tasks.
      </div>
      <p class="local-sync-alert">Your profile scores are saved securely to your browser storage profile.</p>
      <button @click="router.push(`/hub/${deckId}`)" class="action-btn-main black-btn">Return to Dashboard</button>
    </div>
  </div>
</template>

<style scoped>
.exercise-view-wrapper {
  max-width: 680px;
  margin: 2rem auto;
  padding: 0 1rem;
}

.game-frame, .game-over-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 1.25rem;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.03);
}

.stat-bar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  color: #64748b;
  font-weight: 600;
}

.quit-trigger {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
}
.quit-trigger:hover { color: #f43f5e; }

.instruction-header {
  font-size: 1.2rem;
  color: #1e293b;
  margin-bottom: 1.5rem;
}

.interaction-sandbox {
  min-height: 180px;
  margin-bottom: 2rem;
}

/* Chips Formatting Engine */
.word-chip {
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  padding: 0.6rem 1.2rem;
  border-radius: 0.5rem;
  font-weight: 600;
  color: #334155;
  cursor: grab;
  user-select: none;
}
.word-chip:active { cursor: grabbing; }

.choices-pool-wrapper {
  margin-top: 2rem;
  border-top: 1px solid #f1f5f9;
  padding-top: 1rem;
}
.pool-chips-row {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

/* Cloze Gaps Styles */
.sentence-row {
  font-size: 1.4rem;
  font-weight: 700;
  color: #1e293b;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.drop-target-slot {
  background: #f1f5f9;
  border: 2px dashed #cbd5e1;
  padding: 0.4rem 1rem;
  font-size: 1rem;
  min-width: 110px;
  text-align: center;
  color: #64748b;
  border-radius: 0.375rem;
  display: inline-block;
}
.drop-target-slot.filled {
  border-style: solid;
  border-color: #3b82f6;
  background: #eff6ff;
  color: #1d4ed8;
  font-weight: 600;
}

/* Scramble & Active Workspace */
.active-tray {
  width: 100%;
  min-height: 60px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
}
.built-chip { background: #eff6ff; border-color: #bfdbfe; color: #1e40af; }

/* Matching Grid Engines Layout */
.matching-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}
.column-keys, .column-targets {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.match-key-chip.activeSelection { border-color: #3b82f6; background: #dbeafe; }
.match-key-chip.linked { opacity: 0.4; }

.matching-target-row {
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  padding: 0.6rem 1rem;
  border-radius: 0.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}
.dropped-binding-value { font-weight: 700; color: #2563eb; font-size: 0.95rem; }

/* Selection Boxes Stacked layout */
.setup-context {
  font-size: 1.1rem;
  font-weight: 600;
  background: #f1f5f9;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}
.options-vertical-stack {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.choice-row-btn {
  width: 100%;
  text-align: left;
  padding: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  background: white;
  font-weight: 600;
  cursor: pointer;
}
.choice-row-btn.selected { border-color: #3b82f6; background: #f0f5ff; color: #1d4ed8; }

/* Audio Trigger Rows Styles */
.audio-btn {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  padding: 0.5rem 1rem;
  font-weight: 600;
  border-radius: 0.375rem;
  cursor: pointer;
  margin-bottom: 1rem;
}

/* Feedback Layout Blocks */
.feedback-toast {
  padding: 1.25rem;
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
}
.feedback-toast.valid-state { background: #f0fdf4; border-left: 4px solid #22c55e; color: #166534; }
.feedback-toast.invalid-state { background: #fef2f2; border-left: 4px solid #ef4444; color: #991b1b; }
.correct-reveal-line { margin: 0.25rem 0; font-size: 1rem; }
.explanation-p { font-size: 0.9rem; opacity: 0.9; line-height: 1.4; }

/* Primary Footers Actions controls */
.action-btn-main {
  width: 100%;
  padding: 1rem;
  border-radius: 0.5rem;
  font-weight: 700;
  font-size: 1.05rem;
  border: none;
  cursor: pointer;
}
.black-btn { background: #1e293b; color: white; }
.green-btn { background: #22c55e; color: white; }

/* Game Over Card Styles */
.game-over-card { text-align: center; }
.badge-icon { font-size: 3.5rem; display: block; margin-bottom: 1rem; }
.score-breakdown-row { font-size: 1.3rem; margin-bottom: 0.5rem; }
.local-sync-alert { color: #94a3b8; margin-bottom: 1.5rem; font-size: 0.95rem; }
</style>