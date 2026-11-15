<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getLanguage } from '@/utils/languages'
import { deckDataPath } from '@/utils/deckPaths'
import { buildLevelQuestions, QUESTIONS_PER_LEVEL } from '@/utils/placement'
import { placementLevel, cefrOfDeck, LEVEL_NAMES, PASS_RATE } from '@/utils/studyPlan'

const route = useRoute()
const router = useRouter()
const langId = computed(() => route.params.langId)

const language = ref(null)
const levels = ref([])          // levels that have published decks, e.g. ['A1','A2','B1','B2']
const decksByLevel = ref({})
const levelIdx = ref(0)
const questions = ref([])
const questionIdx = ref(0)
const picked = ref(null)        // option chosen for the current question
const results = ref({})         // { A1: { correct, total } }
const phase = ref('intro')      // intro | loading | question | done | error
const errorMessage = ref('')

const currentLevel = computed(() => levels.value[levelIdx.value])
const question = computed(() => questions.value[questionIdx.value])
const finalLevel = computed(() => placementLevel(results.value))
const answeredCount = computed(() =>
  Object.values(results.value).reduce((sum, r) => sum + r.total, 0) + (picked.value ? 1 : 0)
)

onMounted(async () => {
  try {
    language.value = await getLanguage(langId.value)
    const manifest = await (await fetch(`/data/manifests/${langId.value}-manifest.json`)).json()
    const groups = {}
    for (const deck of manifest.filter((d) => !d.comingSoon)) {
      const level = cefrOfDeck(deck.id)
      if (level) (groups[level] = groups[level] || []).push(deck)
    }
    decksByLevel.value = groups
    levels.value = ['A1', 'A2', 'B1', 'B2', 'C1'].filter((l) => groups[l]?.length)
  } catch (error) {
    console.error(error)
    phase.value = 'error'
    errorMessage.value = 'Could not load this language.'
  }
})

async function loadLevel() {
  phase.value = 'loading'
  // Two random decks of this level give a varied sample of its vocabulary
  const decks = [...decksByLevel.value[currentLevel.value]].sort(() => Math.random() - 0.5).slice(0, 2)
  const cardLists = await Promise.all(
    decks.map((d) => fetch(`${deckDataPath(langId.value, d.id)}/flashcards.json`).then((r) => r.json()))
  )
  questions.value = buildLevelQuestions(cardLists.flat())
  questionIdx.value = 0
  picked.value = null
  phase.value = questions.value.length ? 'question' : 'done'
}

async function start() {
  levelIdx.value = 0
  results.value = {}
  try {
    await loadLevel()
  } catch (error) {
    console.error(error)
    phase.value = 'error'
    errorMessage.value = 'Could not load the test questions.'
  }
}

function choose(option) {
  if (picked.value) return
  picked.value = option
}

async function next() {
  const level = currentLevel.value
  const r = results.value[level] || { correct: 0, total: 0 }
  r.total++
  if (picked.value === question.value.answer) r.correct++
  results.value = { ...results.value, [level]: r }
  picked.value = null

  if (questionIdx.value < questions.value.length - 1) {
    questionIdx.value++
    return
  }
  // Level finished: go up a level only if this one was passed
  const passed = r.correct / r.total >= PASS_RATE
  if (passed && levelIdx.value < levels.value.length - 1) {
    levelIdx.value++
    await loadLevel()
  } else {
    phase.value = 'done'
  }
}

function speak(text) {
  if (!('speechSynthesis' in window) || !language.value) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = language.value.speechLang
  utterance.rate = 0.85
  window.speechSynthesis.speak(utterance)
}

function goToPlan() {
  router.push({ name: 'StudyPlan', params: { langId: langId.value }, query: { level: finalLevel.value } })
}
</script>

<template>
  <div class="hub-container placement-view">
    <header class="menu-header">
      <button class="btn-close" @click="router.push(`/category/${langId}`)">← Back to decks</button>
      <h2>Placement test {{ language ? `· ${language.name}` : '' }}</h2>
    </header>

    <div v-if="phase === 'error'" class="hub-status error"><p>{{ errorMessage }}</p></div>

    <section v-else-if="phase === 'intro'" class="plan-card">
      <p>
        Find your starting level in about 5 minutes. You'll see phrases from each level
        ({{ levels.join(', ') }}) and choose what they mean.
      </p>
      <ul class="plan-list">
        <li>{{ QUESTIONS_PER_LEVEL }} questions per level; pass a level with {{ Math.round(PASS_RATE * 100) }}% to move up.</li>
        <li>If you don't know, choose <strong>"I don't know"</strong>: guessing makes the result less useful.</li>
        <li>This measures vocabulary recognition, so treat the result as an estimate.</li>
      </ul>
      <button class="btn btn-primary" :disabled="!levels.length" @click="start">Start the test</button>
    </section>

    <div v-else-if="phase === 'loading'" class="hub-status"><p>Preparing questions…</p></div>

    <section v-else-if="phase === 'question'" class="plan-card placement-question">
      <div class="placement-meta">
        <span class="srs-card-tag tag-review">Level {{ currentLevel }}</span>
        <span>Question {{ answeredCount + (picked ? 0 : 1) }}</span>
      </div>
      <p class="placement-ask">What does this mean?</p>
      <h3 class="placement-prompt">
        {{ question.prompt }}
        <button class="btn-speak-icon" aria-label="Listen" @click="speak(question.prompt)">🔊</button>
      </h3>

      <div class="placement-options">
        <button
          v-for="option in question.options"
          :key="option"
          class="placement-option"
          :class="{
            'is-right': picked && option === question.answer,
            'is-wrong': picked === option && option !== question.answer,
          }"
          :disabled="!!picked"
          @click="choose(option)"
        >
          {{ option }}
        </button>
        <button
          class="placement-option dont-know"
          :class="{ 'is-wrong': picked === '__unknown__' }"
          :disabled="!!picked"
          @click="choose('__unknown__')"
        >
          I don't know
        </button>
      </div>

      <div class="srs-done-actions">
        <button class="btn btn-primary" :disabled="!picked" @click="next">Next →</button>
      </div>
    </section>

    <section v-else-if="phase === 'done'" class="plan-card placement-result">
      <p class="placement-ask">Your estimated level</p>
      <h3 class="placement-level">{{ LEVEL_NAMES[finalLevel] }}</h3>
      <ul class="srs-stats-row">
        <li v-for="(r, level) in results" :key="level">
          <strong>{{ r.correct }}/{{ r.total }}</strong> {{ level }}
        </li>
      </ul>
      <p v-if="finalLevel === 'A0'">No problem: everyone starts somewhere. Begin with the A1 decks.</p>
      <p v-else-if="finalLevel === levels[levels.length - 1]">
        You passed every level available in the app. Use the plan to keep it fresh and work on production.
      </p>
      <div class="srs-done-actions">
        <button class="btn btn-secondary" @click="start">Retake</button>
        <button class="btn btn-primary" @click="goToPlan">Build my study plan →</button>
      </div>
    </section>
  </div>
</template>
