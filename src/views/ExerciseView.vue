<template>
  <div class="hub-container">
    <div class="menu-dashboard">
      <header class="menu-header">
        <button @click="goBack" class="btn-close">← Back to Course Overview</button>
        <h2 class="hub-deck-title">{{ deck?.title || deckId }}</h2>
        <p class="subtitle">
          <template v-if="deck">{{ deck.level }} · {{ deck.cardCount }} cards · </template>Select your study method
        </p>
        <div v-if="stats" class="deck-srs-stats">
          <span v-if="stats.due" class="stat-due">{{ stats.due }} due for review</span>
          <span>{{ stats.unseen }} not started</span>
          <span class="stat-mastered">{{ stats.mastered }} mastered</span>
        </div>
      </header>

      <div class="modes-grid">
        <!-- Option 1: Flashcards -->
        <button class="mode-card" @click="launchMode('Flashcards')">
          <h3>Flashcards</h3>
          <p>Learn. Repeat. Remember.<br>
            Through Spaced Repetition and Active Recall</p>
          <span class="launch-label">
            <template v-if="stats && (stats.due || stats.newToday)">
              Study {{ stats.due + stats.newToday }} card{{ stats.due + stats.newToday === 1 ? '' : 's' }} →
            </template>
            <template v-else>Launch Mode →</template>
          </span>
        </button>

        <!-- Option 2: Grammar/Exercises -->
        <button class="mode-card" @click="launchMode('Exercises')">
          <h3>Activities</h3>
          <p>Practice the words of this deck and its grammar in context.</p>
          <span class="launch-label">Launch Mode →</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { createProgressStore, deckStats } from '@/utils/srs'

const route = useRoute()
const router = useRouter()

const deckId = computed(() => route.params.deckId)
const deck = ref(null) // this deck's entry from the language manifest
const stats = ref(null)

onMounted(async () => {
  try {
    const response = await fetch(`/data/manifests/${route.params.langId}-manifest.json`)
    const decks = await response.json()
    deck.value = decks.find((d) => d.id === deckId.value) || null
    if (deck.value) {
      const progress = createProgressStore().getDeck(`${route.params.langId}/${deckId.value}`)
      stats.value = deckStats(progress, deck.value.cardCount)
    }
  } catch (error) {
    console.error('Could not load deck details:', error) // the hub still works without them
  }
})

function launchMode(routeName) {
  router.push({
    name: routeName,
    // Language and deck travel in the URL, so refresh and shared links keep working
    params: { langId: route.params.langId, deckId: deckId.value },
  })
}

function goBack() {
  router.push({ name: 'Category', params: { langId: route.params.langId } })
}
</script>
