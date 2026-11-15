<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getLanguage } from '@/utils/languages'
import {
  buildPlan, currentWeek, LEVELS, LEVEL_NAMES, GOALS, ACTIVITY_LABELS,
} from '@/utils/studyPlan'
import { loadSavedPlan, savePlan, clearPlan } from '@/utils/planStore'

const route = useRoute()
const router = useRouter()
const langId = computed(() => route.params.langId)

const language = ref(null)
const decks = ref([])
const saved = ref(null)
const loadError = ref('')

// Form inputs (defaults are a sensible starting point)
const form = ref({
  currentLevel: 'A0',
  targetLevel: 'B1',
  weeks: 12,
  minutesPerDay: 45,
  daysPerWeek: 6,
  goal: 'general',
  mode: 'fit',
})

const MINUTE_OPTIONS = [15, 20, 30, 45, 60, 90, 120, 180]
const DEADLINES = [
  { weeks: 4, label: '1 month' }, { weeks: 8, label: '2 months' }, { weeks: 12, label: '3 months' },
  { weeks: 26, label: '6 months' }, { weeks: 39, label: '9 months' }, { weeks: 52, label: '1 year' },
  { weeks: 78, label: '18 months' }, { weeks: 104, label: '2 years' },
]

const targetOptions = computed(() => LEVELS.slice(LEVELS.indexOf(form.value.currentLevel) + 1))

watch(() => form.value.currentLevel, () => {
  if (!targetOptions.value.includes(form.value.targetLevel)) form.value.targetLevel = targetOptions.value[0]
})

const plan = computed(() => {
  if (!decks.value.length || !targetOptions.value.length) return null
  return buildPlan({ ...form.value, decks: decks.value })
})

// The "fit my deadline" version, used to label that choice whichever one is selected
const fitPlan = computed(() => (plan.value ? buildPlan({ ...form.value, mode: 'fit', decks: decks.value }) : null))

const isSaved = computed(() => saved.value && saved.value.langId === langId.value &&
  JSON.stringify(saved.value.input) === JSON.stringify(form.value))
const weekNow = computed(() => (isSaved.value ? currentWeek(saved.value.startedAt) : null))

onMounted(async () => {
  try {
    language.value = await getLanguage(langId.value)
    decks.value = await (await fetch(`/data/manifests/${langId.value}-manifest.json`)).json()
  } catch (error) {
    console.error(error)
    loadError.value = 'Could not load this language.'
  }
  saved.value = loadSavedPlan()
  if (saved.value?.langId === langId.value) {
    form.value = { ...form.value, ...saved.value.input }
  }
  if (route.query.level && LEVELS.includes(route.query.level)) {
    form.value.currentLevel = route.query.level
  }
})

function save() {
  saved.value = savePlan(langId.value, { ...form.value })
}

function reset() {
  clearPlan()
  saved.value = null
}

function openDeck(deck) {
  router.push({ name: 'ExerciseHub', params: { langId: langId.value, deckId: deck.id } })
}

function formatHours(h) {
  return `${Math.round(h)} hour${Math.round(h) === 1 ? '' : 's'}`
}
</script>

<template>
  <div class="hub-container plan-view">
    <header class="menu-header">
      <button class="btn-close" @click="router.push(`/category/${langId}`)">← Back to decks</button>
      <h2>Your study plan {{ language ? `· ${language.name}` : '' }}</h2>
      <p class="subtitle">
        Tell us where you are, where you want to be and how much time you have.
        <RouterLink :to="`/placement/${langId}`">Not sure of your level? Take the placement test.</RouterLink>
      </p>
    </header>

    <div v-if="loadError" class="hub-status error"><p>{{ loadError }}</p></div>

    <template v-else>
      <!-- Inputs -->
      <section class="plan-card plan-form">
        <label>
          My level now
          <select v-model="form.currentLevel">
            <option v-for="l in LEVELS.slice(0, -1)" :key="l" :value="l">{{ LEVEL_NAMES[l] }}</option>
          </select>
        </label>
        <label>
          Level I want to reach
          <select v-model="form.targetLevel">
            <option v-for="l in targetOptions" :key="l" :value="l">{{ LEVEL_NAMES[l] }}</option>
          </select>
        </label>
        <label>
          In
          <select v-model.number="form.weeks">
            <option v-for="d in DEADLINES" :key="d.weeks" :value="d.weeks">{{ d.label }}</option>
          </select>
        </label>
        <label>
          Minutes per day
          <select v-model.number="form.minutesPerDay">
            <option v-for="m in MINUTE_OPTIONS" :key="m" :value="m">{{ m }} min</option>
          </select>
        </label>
        <label>
          Days per week
          <select v-model.number="form.daysPerWeek">
            <option v-for="d in [3, 4, 5, 6, 7]" :key="d" :value="d">{{ d }} days</option>
          </select>
        </label>
        <label>
          Main goal
          <select v-model="form.goal">
            <option v-for="(g, key) in GOALS" :key="key" :value="key">{{ g.label }}</option>
          </select>
        </label>
      </section>

      <template v-if="plan">
        <!-- Honest feasibility check -->
        <section class="plan-card plan-verdict" :class="plan.feasible ? 'is-realistic' : 'is-ambitious'">
          <template v-if="plan.feasible">
            <h3>✅ Realistic goal</h3>
            <p>
              Going from {{ plan.currentLevel }} to {{ plan.targetLevel }} takes roughly
              <strong>{{ formatHours(plan.hoursNeeded) }}</strong> of study.
              Your schedule gives you about <strong>{{ formatHours(plan.hoursAvailable) }}</strong>.
            </p>
          </template>
          <template v-else>
            <h3>⚠️ Very ambitious goal</h3>
            <p>
              Going from {{ plan.currentLevel }} to {{ plan.targetLevel }} takes roughly
              <strong>{{ formatHours(plan.hoursNeeded) }}</strong> of study, but
              {{ form.minutesPerDay }} min × {{ form.daysPerWeek }} days for
              {{ form.weeks }} weeks gives about <strong>{{ formatHours(plan.hoursAvailable) }}</strong>.
              To reach {{ plan.targetLevel }} on time you would need about
              <strong>{{ plan.minutesPerDayNeeded }} minutes a day</strong>.
            </p>
            <div class="plan-choice">
              <button
                class="btn"
                :class="form.mode === 'fit' ? 'btn-primary' : 'btn-secondary'"
                @click="form.mode = 'fit'"
              >
                <template v-if="fitPlan.partialPercent">
                  Keep {{ form.weeks }} weeks: get ~{{ fitPlan.partialPercent }}% of the way to {{ fitPlan.planLevel }}
                </template>
                <template v-else>Keep {{ form.weeks }} weeks: aim for {{ fitPlan.planLevel }}</template>
              </button>
              <button
                class="btn"
                :class="form.mode === 'target' ? 'btn-primary' : 'btn-secondary'"
                @click="form.mode = 'target'"
              >
                Keep {{ plan.targetLevel }}: about {{ plan.weeksNeeded }} weeks at your pace
              </button>
            </div>
          </template>
          <p class="plan-footnote">
            Hours are estimates from Cambridge's CEFR guidelines and include practice outside the app.
          </p>
        </section>

        <!-- Daily routine -->
        <section class="plan-card">
          <h3>Your daily {{ form.minutesPerDay }} minutes</h3>
          <ul class="plan-routine">
            <li v-for="(minutes, activity) in plan.dailyMinutes" :key="activity">
              <strong>{{ minutes }} min</strong> {{ ACTIVITY_LABELS[activity] }}
            </li>
          </ul>
          <p v-if="plan.newCardsPerDay">
            Flashcards: about <strong>{{ plan.newCardsPerDay }} new cards per study day</strong>
            ({{ plan.totalCards }} cards in {{ plan.planWeeks }} weeks), plus your reviews.
            <span v-if="plan.newCardsPerDay > 30" class="plan-warning">
              That's a heavy load: reviews pile up quickly above ~30 new cards a day.
            </span>
          </p>
          <p v-if="language?.exams && form.goal === 'exam'" class="plan-footnote">
            Exam goal ({{ language.exams }}): do a timed practice paper every 2–3 weeks to check progress.
          </p>
        </section>

        <!-- Grammar focus for each level on the way -->
        <section v-if="language?.grammarByLevel" class="plan-card">
          <h3>Grammar to focus on</h3>
          <div class="plan-grammar">
            <div v-for="level in plan.levelsToStudy" :key="level">
              <h4>{{ LEVEL_NAMES[level] }}</h4>
              <ul class="plan-list">
                <li v-for="topic in language.grammarByLevel[level] || []" :key="topic">{{ topic }}</li>
              </ul>
            </div>
          </div>
        </section>

        <!-- Week-by-week decks -->
        <section class="plan-card">
          <h3>Week by week</h3>
          <p v-if="plan.missingLevels.length" class="plan-warning">
            Decks for {{ plan.missingLevels.join(', ') }} are still being written. Until then, use
            graded readers, podcasts and a tutor for that part of the plan.
          </p>
          <ol class="plan-weeks">
            <li
              v-for="week in plan.schedule"
              :key="week.week"
              :class="{ 'is-current': week.week === weekNow, 'is-review': !week.decks.length }"
            >
              <span class="plan-week-label">Week {{ week.week }}<template v-if="week.week === weekNow"> · now</template></span>
              <span v-if="!week.decks.length" class="plan-week-review">Review week: catch up on due cards</span>
              <button v-for="deck in week.decks" :key="deck.id" class="plan-deck-chip" @click="openDeck(deck)">
                {{ deck.title }} <small>{{ deck.cardCount }}</small>
              </button>
            </li>
          </ol>
        </section>

        <div class="srs-done-actions">
          <button v-if="isSaved" class="btn btn-secondary" @click="reset">Remove saved plan</button>
          <button class="btn btn-primary" :disabled="isSaved" @click="save">
            {{ isSaved ? '✓ Plan saved, it will show on your home page' : 'Save this plan' }}
          </button>
        </div>
      </template>
    </template>
  </div>
</template>
