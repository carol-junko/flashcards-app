<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const deckId = route.params.deckId || 'greetings-beginner'

// User Score Profile Tracking
const flashcardProgress = ref(0)
const grammarProgress = ref(0)
const currentStreak = ref(3) // Mock active day counter tracking

onMounted(() => {
  // Pull profile state from browser database storage safely using the uniform workspace key
  const localRecord = localStorage.getItem(`lang_deck_${deckId}`)
  if (localRecord) {
    try {
      const profile = JSON.parse(localRecord)
      flashcardProgress.value = profile.flashcardScore || 0
      grammarProgress.value = profile.grammarScore || 0
    } catch (e) {
      console.warn("Could not read tracking data matrix for deck instance:", deckId)
    }
  }

  // Sync general application session streaks if needed
  const appStreak = localStorage.getItem('lang_app_streak')
  if (appStreak) {
    currentStreak.value = parseInt(appStreak, 10) || 3
  } else {
    localStorage.setItem('lang_app_streak', '3')
  }
})

function startFlashcards() {
  router.push(`/deck/${deckId}`)
}

function startGrammar() {
  router.push(`/exercises/${deckId}`)
}

function returnToCategories() {
  router.push('/languages')
}
</script>

<template>
  <div class="hub-wrapper">
    <!-- Navigation Context Header -->
    <button @click="returnToCategories" class="back-link-btn">← Back to Category Decks</button>

    <div class="hub-card">
      <div class="hub-header-row">
        <h2>Activity Dashboard</h2>
        <div class="streak-badge" title="Consecutive learning days completed">
          🔥 <span class="streak-count">{{ currentStreak }} Day Streak</span>
        </div>
      </div>
      
      <p class="deck-subtitle-label">Current Deck Focus: <strong>{{ deckId.replace(/-/g, ' ') }}</strong></p>

      <div class="modes-split-layout">
        
        <!-- MODULE COLUMN A: FLASHCARDS STUDY -->
        <div class="mode-workspace-card">
          <div class="icon-avatar blue-bg">🗂️</div>
          <h3>Vocabulary Flashcards</h3>
          <p class="mode-desc">Review essential terms, pronunciation cues, and targeted translations using an interactive card loop.</p>
          
          <div class="score-tracking-pill">
            <span class="score-title">Completion:</span>
            <strong class="score-value">{{ flashcardProgress }}%</strong>
          </div>

          <button @click="startFlashcards" class="action-trigger-btn blue-btn">
            {{ flashcardProgress > 0 ? 'Resume Cards Session' : 'Start Cards Training' }}
          </button>
        </div>

        <!-- MODULE COLUMN B: GRAMMAR PUZZLE TRAINER -->
        <div class="mode-workspace-card">
          <div class="icon-avatar green-bg">🎮</div>
          <h3>Interactive Grammar Challenges</h3>
          <p class="mode-desc">Practice tenses, articles, word orders, matching pairs, and listening scripts using drag-and-drop mechanics.</p>
          
          <div class="score-tracking-pill">
            <span class="score-title">Highest Grade:</span>
            <strong class="score-value">{{ grammarProgress }}%</strong>
          </div>

          <button @click="startGrammar" class="action-trigger-btn green-btn">
            {{ grammarProgress > 0 ? 'Improve Score Profile' : 'Start Grammar Training' }}
          </button>
        </div>

      </div>
    </div>
  </div>
</template>



<style scoped>
.hub-wrapper {
  max-width: 800px;
  margin: 2rem auto;
  padding: 0 1rem;
}

.back-link-btn {
  background: none;
  border: none;
  color: #64748b;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 1rem;
  transition: color 0.15s;
}
.back-link-btn:hover { color: #4f46e5; }

.hub-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 1.5rem;
  padding: 2.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.hub-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 1rem;
  margin-bottom: 0.5rem;
}
.hub-header-row h2 { color: #1e293b; margin: 0; }

.streak-badge {
  background: #fff7ed;
  border: 1px solid #ffedd5;
  padding: 0.4rem 0.8rem;
  border-radius: 2rem;
  font-weight: 700;
  color: #ea580c;
  font-size: 0.9rem;
}

.deck-subtitle-label {
  color: #64748b;
  text-transform: capitalize;
  margin-bottom: 2rem;
}

.modes-split-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

@media (max-width: 640px) {
  .modes-split-layout { grid-template-columns: 1fr; }
}

.mode-workspace-card {
  border: 1px solid #e2e8f0;
  border-radius: 1rem;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  background: #f8fafc;
}

.icon-avatar {
  font-size: 2rem;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  margin-bottom: 1rem;
}
.blue-bg { background-color: #dbeafe; }
.green-bg { background-color: #dcfce7; }

.mode-workspace-card h3 { color: #1e293b; margin: 0 0 0.5rem 0; font-size: 1.25rem; }
.mode-desc { color: #64748b; font-size: 0.95rem; line-height: 1.5; margin-bottom: 1.5rem; flex-grow: 1; }

.score-tracking-pill {
  background: white;
  border: 1px solid #e2e8f0;
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  font-size: 0.9rem;
  margin-bottom: 1.25rem;
  display: flex;
  gap: 0.25rem;
}
.score-title { color: #94a3b8; }
.score-value { color: #1e293b; }

.action-trigger-btn {
  width: 100%;
  padding: 0.75rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.15s;
}
.blue-btn { background-color: #3b82f6; color: white; }
.blue-btn:hover { background-color: #1d4ed8; }
.green-btn { background-color: #22c55e; color: white; }
.green-btn:hover { background-color: #16a34a; }
</style>