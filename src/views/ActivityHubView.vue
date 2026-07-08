<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// Capture the specific deck selected from the URL route parameters
const deckId = route.params.deckId

// Clean readable Title computation from deckId strings
const deckTitle = deckId
  .split('-')
  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
  .join(' ')

// Reactive statistics trackers
const flashcardProgress = ref(0)
const grammarProgress = ref(0)
const userStreak = ref(0)

// Load user stats from localStorage when the component mounts
onMounted(() => {
  // Check if this specific deck already has records stored locally
  const savedData = localStorage.getItem(`prolingua_progress_${deckId}`)
  
  if (savedData) {
    const parsed = JSON.parse(savedData)
    flashcardProgress.value = parsed.flashcardScore || 0
    grammarProgress.value = parsed.grammarScore || 0
  }
  
  // Track global daily login streak metrics
  const savedStreak = localStorage.getItem('prolingua_user_streak')
  userStreak.value = savedStreak ? parseInt(savedStreak, 10) : 1
})

function navigateToActivity(mode) {
  if (mode === 'flashcards') {
    router.push(`/deck/${deckId}`)
  } else if (mode === 'grammar') {
    // We will build this view right after this step!
    router.push(`/exercises/${deckId}`)
  }
}
</script>

<template>
  <div class="hub-container">
    <!-- Back Navigation Navigation Link -->
    <div class="header-nav">
      <button @click="router.back()" class="back-btn">← Back to Topics</button>
      <div class="streak-badge">🔥 {{ userStreak }} Day Streak</div>
    </div>

    <!-- Main Banner Title Area -->
    <header class="hub-header">
      <span class="meta-label">Active Learning Deck</span>
      <h2>{{ deckTitle }}</h2>
      <p>Choose your training style below to begin earning experience points.</p>
    </header>

    <!-- TWO PILLAR SELECTION HUB PANELS -->
    <div class="activity-grid">
      
      <!-- MODE 1: VOCABULARY MEMORIZATION -->
      <div class="activity-card" @click="navigateToActivity('flashcards')">
        <div class="card-icon icon-vocab">📇</div>
        <div class="card-body">
          <h3>Flashcard Player</h3>
          <p>Review critical vocabulary items, check language contexts, and master pronunciation using flip-retention loops.</p>
          
          <!-- Localized Session Performance Meter -->
          <div class="progress-section">
            <div class="progress-bar-meta">
              <span>Mastery Score</span>
              <span>{{ flashcardProgress }}%</span>
            </div>
            <div class="progress-bar-track">
              <div class="progress-fill fill-vocab" :style="{ width: flashcardProgress + '%' }"></div>
            </div>
          </div>
        </div>
        <button class="action-arrow">Launch Player →</button>
      </div>

      <!-- MODE 2: GRAMMAR APPLICATION -->
      <div class="activity-card" @click="navigateToActivity('grammar')">
        <div class="card-icon icon-grammar">✏️</div>
        <div class="card-body">
          <h3>Grammar Trainer</h3>
          <p>Test layout construction with interactive sentence unscrambling and contextual gap-fill cloze exercises.</p>
          
          <!-- Localized Session Performance Meter -->
          <div class="progress-section">
            <div class="progress-bar-meta">
              <span>Accuracy Score</span>
              <span>{{ grammarProgress }}%</span>
            </div>
            <div class="progress-bar-track">
              <div class="progress-fill fill-grammar" :style="{ width: grammarProgress + '%' }"></div>
            </div>
          </div>
        </div>
        <button class="action-arrow">Start Exercises →</button>
      </div>

    </div>
  </div>
</template>

<style scoped>
.hub-container {
  max-width: 800px;
  margin: 1rem auto 0 auto;
}

.header-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.back-btn {
  background: none;
  border: none;
  color: #4f46e5;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
}

.streak-badge {
  background-color: #ffedd5;
  color: #c2410c;
  padding: 0.35rem 0.75rem;
  font-weight: 700;
  border-radius: 0.5rem;
  font-size: 0.85rem;
}

.hub-header {
  text-align: center;
  margin-bottom: 3rem;
}

.meta-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: #94a3b8;
}

.hub-header h2 {
  font-size: 2.25rem;
  color: #1e293b;
  margin: 0.25rem 0 0.5rem 0;
}

.hub-header p {
  color: #64748b;
}

/* Split Column Selection Grid Layout */
.activity-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

@media (max-width: 640px) {
  .activity-grid {
    grid-template-columns: 1fr;
  }
}

.activity-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 1.25rem;
  padding: 2rem;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.activity-card:hover {
  transform: translateY(-4px);
  border-color: #cbd5e1;
  box-shadow: 0 15px 30px -10px rgba(0, 0, 0, 0.05);
}

.card-icon {
  font-size: 2.5rem;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 1rem;
  margin-bottom: 1.5rem;
}

.icon-vocab { background-color: #eef2ff; }
.icon-grammar { background-color: #f0fdf4; }

.card-body h3 {
  font-size: 1.35rem;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.card-body p {
  color: #64748b;
  font-size: 0.95rem;
  line-height: 1.6;
  margin-bottom: 2rem;
}

/* Tracking Bar Engine Layouts */
.progress-section {
  margin-top: auto;
  margin-bottom: 1.5rem;
}

.progress-bar-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 0.35rem;
}

.progress-bar-track {
  background-color: #f1f5f9;
  height: 8px;
  border-radius: 9999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 9999px;
  transition: width 0.4s ease;
}

.fill-vocab { background-color: #4f46e5; }
.fill-grammar { background-color: #22c55e; }

.action-arrow {
  background: none;
  border: none;
  text-align: left;
  padding: 0;
  color: #4f46e5;
  font-weight: 700;
  font-size: 0.95rem;
  margin-top: auto;
  cursor: pointer;
}

.activity-card:hover .action-arrow {
  color: #312e81;
}
</style>