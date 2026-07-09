<template>
  <div class="hub-container">
    <div class="menu-dashboard">
      <header class="menu-header">
        <button @click="goBack" class="btn-close">← Back to Course Overview</button>
        <h2>Deck Dashboard</h2>
        <p class="subtitle">Select your study method for topic: {{ deckId }}</p>
      </header>

      <div class="modes-grid">
        <!-- Option 1: Flashcards -->
        <div class="mode-card" @click="launchMode('Flashcards')">
          <div class="card-icon">🎴</div>
          <h3>Flashcard Flipping Review</h3>
          <p>Review keywords, check phonetic spellings, and master raw spoken recall.</p>
          <span class="launch-label">Launch Mode →</span>
        </div>

        <!-- Option 2: Grammar/Exercises -->
        <div class="mode-card" @click="launchMode('GrammarPractice')">
          <div class="card-icon">🧠</div>
          <h3>Structural Grammar Drills</h3>
          <p>Engage with contextual sentence puzzles, drag-and-drop cloze targets, and syntax bridges.</p>
          <span class="launch-label">Launch Mode →</span>
        </div>
      </div>
    </div>
  </div>
</template>

<!-- Update the script setup inside ExerciseView.vue -->
<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const deckId = computed(() => route.params.deckId)

function launchMode(routeName) {
  router.push({
    name: routeName,
    params: { deckId: deckId.value },
    // Forward the history state (lang and level) chosen by the user
    state: {
      lang: history.state?.lang || 'br',
      level: history.state?.level || 'beginner'
    }
  })
}

function goBack() {
  router.back()
}
</script>