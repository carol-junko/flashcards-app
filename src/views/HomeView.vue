<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { loadSavedPlan } from '@/utils/planStore'
import { buildPlan, currentWeek, LEVEL_NAMES } from '@/utils/studyPlan'
import { createProgressStore, deckStats } from '@/utils/srs'

const router = useRouter()
const store = createProgressStore()

const saved = ref(null)
const plan = ref(null)
const language = ref(null)

// Reviews due today across every deck studied in this browser
const dueToday = computed(() =>
  store.deckKeys().reduce((sum, key) => sum + deckStats(store.getDeck(key), 0).due, 0)
)

const week = computed(() => (saved.value ? currentWeek(saved.value.startedAt) : null))
const thisWeek = computed(() => plan.value?.schedule[week.value - 1] || null)
const planFinished = computed(() => plan.value && week.value > plan.value.planWeeks)

onMounted(async () => {
  saved.value = loadSavedPlan()
  if (!saved.value) return
  try {
    const [decks, languages] = await Promise.all([
      fetch(`/data/manifests/${saved.value.langId}-manifest.json`).then((r) => r.json()),
      fetch('/data/languages.json').then((r) => r.json()),
    ])
    language.value = languages.find((l) => l.id === saved.value.langId) || null
    plan.value = buildPlan({ ...saved.value.input, decks })
  } catch (error) {
    console.error('Could not load the saved plan:', error)
  }
})

function deckDue(deck) {
  return deckStats(store.getDeck(`${saved.value.langId}/${deck.id}`), deck.cardCount)
}

function openDeck(deck) {
  router.push({ name: 'ExerciseHub', params: { langId: saved.value.langId, deckId: deck.id } })
}
</script>

<template>
  <div class="home-wrapper">
    <!-- Returning learner with a plan: today's work first -->
    <div v-if="plan" class="hero-card today-card">
      <p class="today-eyebrow">{{ language?.flag }} {{ language?.name }} · {{ LEVEL_NAMES[plan.currentLevel] }} → {{ plan.planLevel }}</p>
      <h1 v-if="!planFinished">Week {{ week }} of {{ plan.planWeeks }}</h1>
      <h1 v-else>Plan complete 🎉</h1>

      <p v-if="dueToday" class="tagline">You have <strong>{{ dueToday }}</strong> card{{ dueToday === 1 ? '' : 's' }} to review today.</p>
      <p v-else class="tagline">No reviews due right now.</p>

      <div v-if="thisWeek && thisWeek.decks.length" class="today-decks">
        <p class="today-label">This week's decks</p>
        <button v-for="deck in thisWeek.decks" :key="deck.id" class="plan-deck-chip" @click="openDeck(deck)">
          {{ deck.title }}
          <small v-if="deckDue(deck).due">{{ deckDue(deck).due }} due</small>
          <small v-else-if="deckDue(deck).unseen">{{ deckDue(deck).unseen }} new</small>
          <small v-else>✓</small>
        </button>
      </div>
      <p v-else-if="thisWeek" class="today-label">Review week: catch up on your due cards.</p>
      <p v-if="planFinished">Take the placement test again to check your new level, then set a new goal.</p>

      <div class="srs-done-actions">
        <RouterLink class="btn btn-secondary" :to="`/plan/${saved.langId}`">See full plan</RouterLink>
        <RouterLink class="btn btn-primary" :to="`/category/${saved.langId}`">All decks →</RouterLink>
      </div>
    </div>

    <!-- First visit -->
    <div v-else class="hero-card">
      <div class="hero-logo">📇</div>
      <h1>Welcome to Flashcards</h1>
      <p class="tagline">
        Learn a language at your own pace: remember vocabulary for good with spaced repetition,
        practice it in exercises, and follow a plan built around your level and your goal.
      </p>
      <p v-if="dueToday" class="tagline">You have <strong>{{ dueToday }}</strong> cards to review today.</p>

      <button @click="router.push('/languages')" class="cta-button">
        Start Learning Now →
      </button>
    </div>
  </div>
</template>
