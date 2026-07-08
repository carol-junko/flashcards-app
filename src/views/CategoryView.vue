<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// Capture the language ID from the URL (e.g., 'pt' or 'en')
const langId = route.params.langId

// Active filter states
const selectedLevel = ref('All')

// Sample data structure representing available modules
// Later, this can match entries in your manifest.json
const decks = ref([
  { id: 'greetings-beginner', title: 'Essential Greetings', category: 'Greetings', level: 'Beginner', cardCount: 15, lang: 'pt' },
  { id: 'greetings-intermediate', title: 'Social Conversations', category: 'Greetings', level: 'Intermediate', cardCount: 20, lang: 'pt' },
  { id: 'travel-beginner', title: 'At the Airport', category: 'Travel', level: 'Beginner', cardCount: 12, lang: 'pt' },
  { id: 'food-beginner', title: 'Ordering Food', category: 'Food', level: 'Beginner', cardCount: 18, lang: 'pt' },
  { id: 'food-intermediate', title: 'In a Restaurant', category: 'Food', level: 'Intermediate', cardCount: 15, lang: 'pt' }
])

// Filter decks dynamically based on language path and level selected
const filteredDecks = computed(() => {
  return decks.value.filter(deck => {
    const matchesLang = deck.lang === langId
    const matchesLevel = selectedLevel.value === 'All' || deck.level === selectedLevel.value
    return matchesLang && matchesLevel
  })
})

function selectDeck(deckId) {
  // Directs the user to the Activity Hub for this specific deck
  router.push(`/hub/${deckId}`)
}
</script>

<template>
  <div class="category-container">
    <div class="header-nav">
      <RouterLink to="/languages" class="back-link">← Change Language</RouterLink>
    </div>

    <h2>Select Your Level & Topic</h2>
    <p class="subtitle">Language tracked: <span class="lang-tag">{{ langId.toUpperCase() }}</span></p>

    <!-- FILTER SEGMENT CONTROLS -->
    <div class="filter-bar">
      <button 
        v-for="tier in ['All', 'Beginner', 'Intermediate']" 
        :key="tier"
        class="filter-tab"
        :class="{ active: selectedLevel === tier }"
        @click="selectedLevel = tier"
      >
        {{ tier }}
      </button>
    </div>

    <!-- MODULE DECK SELECTION GRID -->
    <div v-if="filteredDecks.length > 0" class="decks-grid">
      <div 
        v-for="deck in filteredDecks" 
        :key="deck.id" 
        class="deck-card"
        @click="selectDeck(deck.id)"
      >
        <div class="card-meta">
          <span class="level-badge" :class="deck.level.toLowerCase()">{{ deck.level }}</span>
          <span class="category-label">{{ deck.category }}</span>
        </div>
        <h3>{{ deck.title }}</h3>
        <p class="card-count">📇 {{ deck.cardCount }} Cards + Exercises</p>
      </div>
    </div>

    <!-- EMPTY STATE FALLBACK -->
    <div v-else class="empty-state">
      <p>No content groups found matching the selected level filters.</p>
    </div>
  </div>
</template>

<style scoped>
.category-container {
  max-width: 800px;
  margin: 1rem auto 0 auto;
}

.header-nav {
  margin-bottom: 1.5rem;
}

.back-link {
  color: #4f46e5;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.95rem;
}

h2 {
  font-size: 1.85rem;
  color: #1e293b;
  margin-bottom: 0.25rem;
}

.subtitle {
  color: #64748b;
  margin-bottom: 2rem;
}

.lang-tag {
  background-color: #e2e8f0;
  color: #334155;
  padding: 0.2rem 0.5rem;
  border-radius: 0.35rem;
  font-weight: 700;
  font-size: 0.85rem;
}

/* Tab Segment Filter Controls */
.filter-bar {
  display: flex;
  gap: 0.5rem;
  background-color: #f1f5f9;
  padding: 0.35rem;
  border-radius: 0.75rem;
  margin-bottom: 2rem;
  max-width: fit-content;
}

.filter-tab {
  border: none;
  background: transparent;
  padding: 0.5rem 1.25rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: #64748b;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-tab.active {
  background-color: #ffffff;
  color: #4f46e5;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

/* Grid Layout Styling */
.decks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
}

.deck-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 1rem;
  padding: 1.5rem;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: all 0.2s ease;
}

.deck-card:hover {
  transform: translateY(-3px);
  border-color: #cbd5e1;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
}

.card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.level-badge {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.6rem;
  border-radius: 9999px;
  text-transform: uppercase;
}

.level-badge.beginner {
  background-color: #dcfce7;
  color: #166534;
}

.level-badge.intermediate {
  background-color: #fef9c3;
  color: #854d0e;
}

.category-label {
  font-size: 0.8rem;
  color: #94a3b8;
  font-weight: 600;
}

h3 {
  font-size: 1.2rem;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.card-count {
  font-size: 0.85rem;
  color: #64748b;
  margin-top: auto;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #94a3b8;
  background: white;
  border-radius: 1rem;
  border: 1px dashed #e2e8f0;
}
</style>