<template>
  <div class="hub-container">
    <div class="menu-dashboard">
      <header class="menu-header">
        <button @click="goBack" class="btn-close">← Back to Course Overview</button>
        <p class="subtitle">Select your study method: {{ deckId }}</p>
      </header>

      <div class="modes-grid">
        <!-- Option 1: Flashcards -->
        <!-- Keeps mapping to the Flashcards route name -->
        <div class="mode-card" @click="launchMode('Flashcards')">
          <h3>Flashcards</h3>
          <p>Learn. Repeat. Remember.<br>
            Through Spaced Repetition and Active Recall</p>
          <span class="launch-label">Launch Mode →</span>
        </div>

        <!-- Option 2: Grammar/Exercises -->
        <!-- We pass 'exercises' to match the name in your router config -->
        <div class="mode-card" @click="launchMode('Exercises')">
          <h3>Activities</h3>
          <p>Engage exercises for your learning and practice lanuage grammar context. </p>
          <span class="launch-label">Launch Mode →</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const deckId = computed(() => route.params.deckId)

function launchMode(routeName) {
  router.push({
    name: routeName,
    // Passes the deckId so the dashboard can load the correct deck profile later
    params: { deckId: deckId.value },
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