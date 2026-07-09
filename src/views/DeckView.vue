<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const deckId = route.params.deckId // Captures whatever is after /deck/ in the URL

// Interface Lifecycle States
const flashcards = ref([])
const currentCardIndex = ref(0)
const isFlipped = ref(false)
const loading = ref(true)
const error = ref(null)

// Session Tracking Vectors
const correctCount = ref(0)

function flipCard() {
  isFlipped.value = !isFlipped.value
}

// Exit back to dashboard cleanly
function exitToHub() {
  router.push(`/hub/${deckId}`)
}

// Progress through the deck, routing to score finalizing if closing out the final item
function handleResponse(isCorrect) {
  if (isCorrect) correctCount.value++
  
  // Clean up flip rotation state
  isFlipped.value = false

  // Minimal timeout to let card front reset smoothly before swapping index text
  setTimeout(() => {
    if (currentCardIndex.value < flashcards.value.length - 1) {
      currentCardIndex.value++
    } else {
      finalizeSessionScore()
    }
  }, 200)
}

// Safely modify target metrics without blowing away cross-functional exercise scores
function finalizeSessionScore() {
  const customStorageKey = `lang_deck_${deckId}`
  const existingRawData = localStorage.getItem(customStorageKey)
  
  let persistentPayload = { flashcardScore: 0, grammarScore: 0 }
  
  if (existingRawData) {
    try {
      persistentPayload = JSON.parse(existingRawData)
    } catch (e) {
      // Gracefully fall back to initialization defaults if payload parsing catches
    }
  }

  // Set score percentage
  const finalPercentage = Math.round((correctCount.value / flashcards.value.length) * 100)
  persistentPayload.flashcardScore = finalPercentage

  // Write out targeted mutations
  localStorage.setItem(customStorageKey, JSON.stringify(persistentPayload))
  
  // Move user out back to the Hub view
  exitToHub()
}

// Mount target file system loader
onMounted(async () => {
  try {
    const response = await fetch(`/data/${deckId}.json`)
    if (!response.ok) throw new Error(`Target module resource data was missing or inaccessible: ${deckId}.json`)
    
    const data = await response.json()
    
    // Normalized input mapping: parses standardized flat array OR multi-key payload layouts
    let derivedCards = Array.isArray(data) ? data : (data.vocabulary || [])
    
    // Safety transformer ensuring dynamic properties safely fallback to common alternate properties
    flashcards.value = derivedCards.map(card => ({
      id: card.id || Math.random().toString(),
      front: card.front || card.foreign || '',
      back: card.back || card.native || '',
      context: card.context || ''
    }))
    
  } catch (err) {
    error.value = err.message || 'An error occurred while building the vocabulary session cards.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="deck-container">
    <!-- BACK TO HUB NAV TRIGGER -->
    <div style="width: 100%; text-align: left; margin-bottom: 0.5rem;">
      <button @click="exitToHub" style="background: none; border: none; color: #64748b; font-weight: 500; cursor: pointer; padding: 0;">
        ✕ Exit to Hub
      </button>
    </div>

    <p class="deck-info">Viewing Deck: <strong>{{ deckId }}</strong></p>

    <!-- ASYNC STATE SCENARIOS -->
    <div v-if="loading" class="empty-state-fallback">
      <p>Assembling vocabulary card layout...</p>
    </div>

    <div v-else-if="error" class="empty-state-fallback" style="border-color: #fca5a5; color: #ef4444;">
      <p>{{ error }}</p>
    </div>

    <div v-else-if="flashcards.length === 0" class="empty-state-fallback">
      <p>No card data discovered within this learning index profile.</p>
    </div>

    <div v-else style="width: 100%; display: flex; flex-direction: column; align-items: center;">
      <p class="progress-tracker">Card {{ currentCardIndex + 1 }} of {{ flashcards.length }}</p>

      <!-- THE FLASHCARD STAGE -->
      <div class="flashcard-wrapper" @click="flipCard">
        <div class="flashcard-inner" :class="{ 'is-flipped': isFlipped }">
          
          <!-- Front of Card -->
          <div class="card-face card-front">
            <span class="language-label">Portuguese</span>
            <h2>{{ flashcards[currentCardIndex].front }}</h2>
            <small class="hint-text">Click card to reveal translation</small>
          </div>

          <!-- Back of Card -->
          <div class="card-face card-back">
            <span class="language-label">English</span>
            <h2>{{ flashcards[currentCardIndex].back }}</h2>
            <p class="context-text">{{ flashcards[currentCardIndex].context }}</p>
          </div>

        </div>
      </div>

      <!-- PERFORMANCE GRADING BAR CONTROLS -->
      <div class="controls" style="display: flex; gap: 0.75rem;">
        <button 
          class="btn" 
          style="background-color: #ef4444;" 
          @click.stop="handleResponse(false)"
        >
          Still Learning
        </button>
        <button 
          class="btn" 
          style="background-color: #10b981;" 
          @click.stop="handleResponse(true)"
        >
          Know It!
        </button>
      </div>
    </div>
  </div>
</template>



<style scoped>
.deck-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 500px;
  margin: 0 auto;
}

.deck-info, .progress-tracker {
  color: #64748b;
  margin-bottom: 0.5rem;
}

/* 3D Canvas Box Setup */
.flashcard-wrapper {
  background-color: transparent;
  width: 100%;
  height: 300px;
  perspective: 1000px; /* Creates the 3D space depth */
  cursor: pointer;
  margin: 1.5rem 0;
}

/* The element that actually rotates inside our 3D space */
.flashcard-inner {
  position: relative;
  width: 100%;
  height: 100%;
  text-align: center;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  transform-style: preserve-3d; /* Tells children to live in 3D space */
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
  border-radius: 1rem;
}

/* Trigger Class controlled by Vue */
.flashcard-inner.is-flipped {
  transform: rotateY(180deg);
}

/* Common properties for both card faces */
.card-face {
  position: absolute;
  width: 100%;
  height: 100%;
  -webkit-backface-visibility: hidden; /* Safari support */
  backface-visibility: hidden;         /* Hides front when looking at back */
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  padding: 2rem;
  border-radius: 1rem;
  border: 1px solid #e2e8f0;
}

.card-front {
  background-color: #ffffff;
  color: #1e293b;
}

.card-back {
  background-color: #4f46e5; /* Vibrant indigo face when turned */
  color: #ffffff;
  transform: rotateY(180deg); /* Pre-rotates the back face so it mirrors the front */
}

/* Typography styles */
.language-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 700;
  color: #94a3b8;
}
.card-back .language-label {
  color: #c7d2fe;
}

h2 {
  font-size: 2.25rem;
  font-weight: 700;
}

.hint-text {
  font-size: 0.85rem;
  color: #94a3b8;
}

.context-text {
  font-size: 1rem;
  color: #e0e7ff;
}

/* Navigation button styles */
.controls {
  width: 100%;
}

.btn {
  width: 100%;
  color: white;
  border: none;
  padding: 1rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn:hover {
  opacity: 0.9;
}

.empty-state-fallback {
  text-align: center;
  width: 100%;
  padding: 3rem;
  color: #94a3b8;
  background: white;
  border-radius: 1rem;
  border: 1px dashed #e2e8f0;
  margin: 1.5rem 0;
}
</style>