<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const langId = computed(() => route.params.langId)
const decks = ref([])
const isLoading = ref(true)
const fetchError = ref(null)


// 🔄 Syncing the fetching logic with your file naming scheme
onMounted(async () => {
  try {
    // This perfectly matches: /data/manifests/br-manifest.json
    const response = await fetch(`/data/manifests/${langId.value}-manifest.json`)
    
    if (!response.ok) {
      throw new Error(`Could not find a manifest file for language key: ${langId.value}`)
    }
    
    // Ingest the isolated language file directly
    decks.value = await response.json()
  } catch (error) {
    console.error("Error reading modules manifest data:", error)
    fetchError.value = "This language track doesn't have any active modules launched yet."
  } finally {
    isLoading.value = false
  }
})

// Organizes filtered decks into separate buckets grouped by learning level
const groupedDecks = computed(() => {
  return decks.value.reduce((groups, deck) => {
    const level = deck.level || 'General'
    if (!groups[level]) {
      groups[level] = []
    }
    groups[level].push(deck)
    return groups;
  }, {})
})

function selectDeck(deckId) {
  if (!deckId) {
    console.error("Critical: Invoked navigation without a valid deck definition reference tag.")
    return
  }

  router.push({
    name: 'ExerciseHub',    // Matches the exact 'name' key in your routes array
    params: { deckId: deckId } // Safely injects your dynamic property
  })
}

function goBack() {
  router.push('/languages')
}
</script>

<template>
  <div class="category-wrapper">
    <!-- Context Header Layout -->
    <header class="category-header">
      <button @click="goBack" class="back-link">← Choose a different language</button>
      <h2>Study Tracks</h2>
      <p class="subtitle">Select a subject deck below to begin parsing vocabulary and grammar rules</p>
    </header>

    <!-- Loading Placeholder view -->
    <div v-if="isLoading" class="status-panel loading-box">
      <div class="loading-ring"></div>
      <p>Parsing available course decks...</p>
    </div>

    <!-- Error fallback message board -->
    <div v-else-if="fetchError" class="status-panel error-box">
      <span>⚠️</span>
      <p>{{ fetchError }}</p>
    </div>

    <!-- Empty condition container -->
    <div v-else-if="decks.length === 0" class="status-panel empty-box">
      <span>📭</span>
      <h3>No modules launched yet</h3>
      <p>There are currently no course packs registered under the structural path parameter matching "{{ langId }}".</p>
    </div>

    <!-- Catalog Modules Grid organized cleanly by tier level -->
    <div v-else class="levels-container">
      <div 
        v-for="(levelDecks, levelName) in groupedDecks" 
        :key="levelName" 
        class="level-section"
      >
        <h3 class="level-badge-header">{{ levelName }}</h3>
        
        <div class="decks-grid">
          <div 
            v-for="deck in levelDecks" 
            :key="deck.id" 
            class="deck-card"
            @click="selectDeck(deck.id)"
          >
            <div class="deck-top-meta">
              <span class="category-tag">{{ deck.category }}</span>
              <span class="card-counter">{{ deck.cardCount }} Cards</span>
            </div>
            
            <h4 class="deck-title">{{ deck.title }}</h4>
            <p class="deck-description">{{ deck.description }}</p>
            
            <div class="deck-action-row">
              <span class="action-prompt">Open Deck Dashboard</span>
              <span class="action-arrow">→</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

