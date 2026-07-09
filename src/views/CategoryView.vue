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

<style scoped>
.category-wrapper {
  max-width: 900px;
  margin: 2.5rem auto;
  padding: 0 1.5rem;
}

.category-header {
  margin-bottom: 3rem;
}

.back-link {
  background: none;
  border: none;
  color: #4f46e5;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  margin-bottom: 1rem;
  font-size: 0.95rem;
  display: inline-flex;
  align-items: center;
  transition: color 0.2s;
}

.back-link:hover {
  color: #4338ca;
  text-decoration: underline;
}

h2 {
  font-size: 2rem;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
  font-weight: 800;
}

.subtitle {
  color: #64748b;
  font-size: 1.05rem;
  margin: 0;
}

/* Tiered category structures styling */
.level-section {
  margin-bottom: 3rem;
}

.level-badge-header {
  font-size: 1.1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
  border-bottom: 2px solid #f1f5f9;
  padding-bottom: 0.5rem;
  margin: 0 0 1.5rem 0;
  font-weight: 700;
}

.decks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.deck-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 1rem;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.01);
}

.deck-card:hover {
  border-color: #4f46e5;
  transform: translateY(-4px);
  box-shadow: 0 12px 20px -8px rgba(79, 70, 229, 0.12);
}

.deck-top-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.category-tag {
  background: #f0fdf4;
  color: #166534;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.75rem;
  border-radius: 2rem;
}

.card-counter {
  color: #94a3b8;
  font-size: 0.8rem;
  font-weight: 500;
}

.deck-title {
  font-size: 1.25rem;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
  font-weight: 700;
  line-height: 1.3;
}

.deck-description {
  color: #64748b;
  font-size: 0.95rem;
  line-height: 1.5;
  margin: 0 0 1.5rem 0;
  flex-grow: 1;
}

.deck-action-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 1rem;
  border-top: 1px dashed #f1f5f9;
}

.action-prompt {
  font-size: 0.9rem;
  color: #64748b;
  font-weight: 600;
  transition: color 0.2s;
}

.action-arrow {
  font-size: 1.1rem;
  color: #94a3b8;
  transition: all 0.2s;
}

.deck-card:hover .action-prompt {
  color: #4f46e5;
}

.deck-card:hover .action-arrow {
  color: #4f46e5;
  transform: translateX(3px);
}

/* Status States Dashboard Layouts */
.status-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 1rem;
  text-align: center;
}

.loading-box p {
  color: #64748b;
  margin-top: 1rem;
}

.loading-ring {
  width: 2.25rem;
  height: 2.25rem;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #4f46e5;
  border-radius: 50%;
  animation: spin 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

.error-box p {
  color: #ef4444;
  font-weight: 500;
  margin-top: 0.5rem;
}

.empty-box h3 {
  color: #334155;
  margin: 1rem 0 0.25rem 0;
}

.empty-box p {
  color: #64748b;
  font-size: 0.95rem;
  margin: 0;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>