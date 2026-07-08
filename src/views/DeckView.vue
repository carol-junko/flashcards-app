<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const deckId = route.params.deckId // Captures whatever is after /deck/ in the URL

// Temporary hardcoded card data to test our logic and styling
const currentCardIndex = ref(0)
const isFlipped = ref(false)

const flashcards = ref([
  { id: '1', front: 'Bom dia', back: 'Good morning', context: 'Used until noon.' },
  { id: '2', front: 'Por favor', back: 'Please', context: 'Polite request.' },
  { id: '3', front: 'Obrigado', back: 'Thank you', context: 'Masculine form.' }
])

function flipCard() {
  isFlipped.value = !isFlipped.value
}

function nextCard() {
  isFlipped.value = false // Ensure the next card starts on the front side
  if (currentCardIndex.value < flashcards.value.length - 1) {
    currentCardIndex.value++
  } else {
    currentCardIndex.value = 0 // Loop back to the first card
  }
}
</script>

<template>
  <div class="deck-container">
    <p class="deck-info">Viewing Deck: <strong>{{ deckId }}</strong></p>
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

    <!-- ACTION BUTTONS -->
    <div class="controls">
      <button class="btn" @click.stop="nextCard">Next Card →</button>
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
  background-color: #1e293b;
  color: white;
  border: none;
  padding: 1rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn:hover {
  background-color: #0f172a;
}
</style>